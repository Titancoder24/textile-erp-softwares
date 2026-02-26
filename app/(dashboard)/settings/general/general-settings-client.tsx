"use client";

import * as React from "react";
import { Building2, Upload, Save, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { updateCompanySettings } from "@/lib/actions/settings";
import type { Database } from "@/types/database";
import { toast } from "sonner";

type Company = Database["public"]["Tables"]["companies"]["Row"];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED"];

interface GeneralSettingsClientProps {
  company: Company;
  companyId: string;
  canEdit: boolean;
}

export function GeneralSettingsClient({
  company,
  companyId,
  canEdit,
}: GeneralSettingsClientProps) {
  const [saving, setSaving] = React.useState(false);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(
    company.logo_url
  );

  const [form, setForm] = React.useState({
    name: company.name || "",
    email: company.email || "",
    phone: company.phone || "",
    website: company.website || "",
    gst_number: company.gst_number || "",
    pan_number: company.pan_number || "",
    address: company.address || "",
    city: company.city || "",
    state: company.state || "",
    country: company.country || "",
    financial_year_start: String(company.financial_year_start || 4),
    default_currency: company.default_currency || "INR",
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!canEdit) {
      toast.error("You don't have permission to edit company settings.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await updateCompanySettings(companyId, {
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        website: form.website || null,
        gst_number: form.gst_number || null,
        pan_number: form.pan_number || null,
        address: form.address || null,
        city: form.city || null,
        state: form.state || null,
        country: form.country || null,
        financial_year_start: parseInt(form.financial_year_start) || 4,
        default_currency: form.default_currency,
      });

      if (error) {
        toast.error(error);
      } else {
        toast.success("Company settings saved successfully.");
      }
    } catch {
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="General Settings"
        description="Manage your company profile, contact information, and financial year."
        breadcrumb={[
          { label: "Settings", href: "/settings" },
          { label: "General" },
        ]}
        actions={
          canEdit ? (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          ) : null
        }
      />

      {!canEdit && (
        <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <p className="text-xs text-yellow-700">
            You have read-only access to company settings. Contact your admin to
            make changes.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Logo upload */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Building2 className="h-4 w-4 text-gray-500" />
            Company Logo
          </h2>
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Company logo"
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-blue-600 text-2xl font-bold text-white rounded-xl">
                  {form.name.charAt(0).toUpperCase() || "T"}
                </div>
              )}
            </div>
            {canEdit && (
              <>
                <label
                  htmlFor="logo-upload"
                  className="flex cursor-pointer items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload Logo
                </label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </>
            )}
            <p className="text-center text-[11px] text-gray-400">
              PNG, JPG up to 2MB.
              <br />
              Recommended: 200x200px
            </p>
          </div>
        </div>

        {/* Company info */}
        <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-900">
            Company Information
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={form.website}
                onChange={(e) => handleChange("website", e.target.value)}
                disabled={!canEdit}
              />
            </div>
          </div>

          <Separator />

          <h2 className="text-sm font-semibold text-gray-900">
            Tax & Compliance
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="gstNumber">GST Number</Label>
              <Input
                id="gstNumber"
                value={form.gst_number}
                onChange={(e) =>
                  handleChange("gst_number", e.target.value.toUpperCase())
                }
                className="font-mono"
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="panNumber">PAN Number</Label>
              <Input
                id="panNumber"
                value={form.pan_number}
                onChange={(e) =>
                  handleChange("pan_number", e.target.value.toUpperCase())
                }
                className="font-mono"
                disabled={!canEdit}
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            Registered Address
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="address">Street Address</Label>
              <Textarea
                id="address"
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                rows={2}
                className="resize-none"
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => handleChange("city", e.target.value)}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={form.state}
                onChange={(e) => handleChange("state", e.target.value)}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={form.country}
                onChange={(e) => handleChange("country", e.target.value)}
                disabled={!canEdit}
              />
            </div>
          </div>
        </div>

        {/* Financial settings */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            Financial Settings
          </h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Financial Year Start</Label>
              <Select
                value={form.financial_year_start}
                onValueChange={(v) =>
                  handleChange("financial_year_start", v)
                }
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month, idx) => (
                    <SelectItem key={idx} value={String(idx + 1)}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400">
                Financial year will start from{" "}
                {MONTHS[parseInt(form.financial_year_start) - 1]}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Default Currency</Label>
              <Select
                value={form.default_currency}
                onValueChange={(v) => handleChange("default_currency", v)}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
