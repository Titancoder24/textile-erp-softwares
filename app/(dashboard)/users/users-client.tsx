"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Search,
  MoreHorizontal,
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  Mail,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, INTERNAL_ROLES } from "@/lib/constants";
import type { Role } from "@/lib/constants";
import type { Database } from "@/types/database";
import { updateUserRole, toggleUserStatus } from "@/lib/actions/users";
import { toast } from "sonner";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const DEPARTMENTS = [
  "Merchandising",
  "Production",
  "Quality",
  "Purchase",
  "Stores",
  "Finance",
  "HR",
  "Dyeing",
  "IT",
  "Management",
];

const ROLE_COLORS: Record<string, string> = {
  super_admin: "border-purple-200 bg-purple-50 text-purple-700",
  factory_owner: "border-blue-200 bg-blue-50 text-blue-700",
  general_manager: "border-indigo-200 bg-indigo-50 text-indigo-700",
  production_manager: "border-green-200 bg-green-50 text-green-700",
  merchandiser: "border-teal-200 bg-teal-50 text-teal-700",
  purchase_manager: "border-orange-200 bg-orange-50 text-orange-700",
  store_manager: "border-yellow-200 bg-yellow-50 text-yellow-700",
  quality_manager: "border-cyan-200 bg-cyan-50 text-cyan-700",
  dyeing_master: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
  sewing_supervisor: "border-lime-200 bg-lime-50 text-lime-700",
  finance_manager: "border-emerald-200 bg-emerald-50 text-emerald-700",
  hr_manager: "border-rose-200 bg-rose-50 text-rose-700",
  maintenance_engineer: "border-gray-200 bg-gray-50 text-gray-700",
  data_entry_operator: "border-slate-200 bg-slate-50 text-slate-700",
  buyer_user: "border-sky-200 bg-sky-50 text-sky-700",
  vendor_user: "border-amber-200 bg-amber-50 text-amber-700",
};

function formatLastLogin(iso: string | null): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

interface UsersClientProps {
  users: Profile[];
  currentUserId: string;
  companyId: string;
}

export function UsersClient({
  users: initialUsers,
  currentUserId,
  companyId,
}: UsersClientProps) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<Profile | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [inviteForm, setInviteForm] = React.useState({
    fullName: "",
    email: "",
    role: "" as Role | "",
    department: "",
  });

  const filtered = initialUsers.filter((u) => {
    const matchSearch =
      search === "" ||
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? u.is_active : !u.is_active);
    return matchSearch && matchRole && matchStatus;
  });

  const activeCount = initialUsers.filter((u) => u.is_active).length;
  const inactiveCount = initialUsers.length - activeCount;

  async function handleInvite() {
    if (!inviteForm.fullName || !inviteForm.email || !inviteForm.role) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: inviteForm.fullName,
          email: inviteForm.email,
          role: inviteForm.role,
          department: inviteForm.department || null,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to invite user");
      }

      toast.success(`${inviteForm.fullName} has been invited. They can now sign in.`);
      setSheetOpen(false);
      setInviteForm({ fullName: "", email: "", role: "", department: "" });
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to invite user";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleStatus(userId: string) {
    const user = initialUsers.find((u) => u.id === userId);
    if (!user) return;

    const { error } = await toggleUserStatus(userId, companyId);
    if (error) {
      toast.error(error);
      return;
    }

    toast.success(
      `${user.full_name} has been ${user.is_active ? "deactivated" : "activated"}.`
    );
    router.refresh();
  }

  async function handleUpdateRole(userId: string, role: Role) {
    const { error } = await updateUserRole(userId, role, companyId);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Role updated successfully.");
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Manage team members, roles, and access permissions."
        breadcrumb={[{ label: "Users" }]}
        actions={
          <Button onClick={() => { setEditingUser(null); setSheetOpen(true); }}>
            <UserPlus className="h-4 w-4" />
            Invite User
          </Button>
        }
      />

      {/* Stats */}
      <div className="mb-4 flex gap-3">
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 shadow-sm">
          <p className="text-xs text-gray-500">Total Users</p>
          <p className="text-lg font-semibold text-gray-900">
            {initialUsers.length}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 shadow-sm">
          <p className="text-xs text-gray-500">Active</p>
          <p className="text-lg font-semibold text-green-700">{activeCount}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 shadow-sm">
          <p className="text-xs text-gray-500">Inactive</p>
          <p className="text-lg font-semibold text-gray-500">{inactiveCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {INTERNAL_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 hidden sm:table-cell">
                  Department
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 hidden lg:table-cell">
                  Last Login
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((user) => {
                const roleClass =
                  ROLE_COLORS[user.role] ??
                  "border-gray-200 bg-gray-50 text-gray-700";
                const isCurrentUser = user.id === currentUserId;

                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700">
                          {user.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-gray-900">
                              {user.full_name}
                            </span>
                            {isCurrentUser && (
                              <span className="rounded bg-blue-100 px-1 py-0.5 text-[10px] font-medium text-blue-700">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-md border px-2 py-0.5 text-xs font-semibold",
                          roleClass
                        )}
                      >
                        {ROLE_LABELS[user.role as Role] ?? user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">
                      {user.department ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      {user.is_active ? (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                          <span className="text-xs font-medium text-green-700">
                            Active
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <XCircle className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-xs font-medium text-gray-500">
                            Inactive
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 hidden lg:table-cell">
                      {formatLastLogin(user.last_login_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label="User actions"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingUser(user);
                              setSheetOpen(true);
                            }}
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Edit Role
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(user.id)}
                            disabled={isCurrentUser}
                            className={
                              user.is_active
                                ? "text-red-600 focus:text-red-700"
                                : "text-green-600 focus:text-green-700"
                            }
                          >
                            {user.is_active ? (
                              <>
                                <XCircle className="mr-2 h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-center text-sm text-gray-500"
                  >
                    No users match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-100 px-4 py-2 text-xs text-gray-400">
          Showing {filtered.length} of {initialUsers.length} users
        </div>
      </div>

      {/* Invite / Edit Sheet */}
      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditingUser(null);
        }}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {editingUser
                ? `Edit User: ${editingUser.full_name}`
                : "Invite New User"}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {!editingUser ? (
              <>
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 text-blue-600 mt-0.5" />
                    <p className="text-xs text-blue-700">
                      The invited user will receive an email to set their
                      password and can then sign in directly.
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="inv-name">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="inv-name"
                    value={inviteForm.fullName}
                    onChange={(e) =>
                      setInviteForm((prev) => ({
                        ...prev,
                        fullName: e.target.value,
                      }))
                    }
                    placeholder="e.g. Arjun Verma"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="inv-email">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="inv-email"
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) =>
                      setInviteForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="arjun@factory.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>
                    Role <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={inviteForm.role}
                    onValueChange={(v) =>
                      setInviteForm((prev) => ({
                        ...prev,
                        role: v as Role,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role..." />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERNAL_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Department</Label>
                  <Select
                    value={inviteForm.department}
                    onValueChange={(v) =>
                      setInviteForm((prev) => ({
                        ...prev,
                        department: v,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department..." />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full mt-2"
                  onClick={handleInvite}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Inviting...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-sm font-medium text-gray-900">
                    {editingUser.full_name}
                  </p>
                  <p className="text-xs text-gray-500">{editingUser.email}</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Select
                    value={editingUser.role}
                    onValueChange={(v) => {
                      handleUpdateRole(editingUser.id, v as Role);
                      setEditingUser((prev) =>
                        prev ? { ...prev, role: v } : null
                      );
                    }}
                    disabled={editingUser.id === currentUserId}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERNAL_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {editingUser.id === currentUserId && (
                    <p className="text-xs text-gray-400">
                      You cannot change your own role.
                    </p>
                  )}
                </div>
                <Button
                  className="w-full mt-2"
                  variant="outline"
                  onClick={() => {
                    setSheetOpen(false);
                    setEditingUser(null);
                  }}
                >
                  Close
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
