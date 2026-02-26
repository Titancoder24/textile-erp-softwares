import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UsersClient } from "./users-client";

export default async function UsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  // Only admins can access user management
  const adminRoles = ["super_admin", "factory_owner", "general_manager"];
  if (!adminRoles.includes(profile.role)) {
    redirect("/dashboard");
  }

  // Fetch all company users
  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: true });

  return (
    <UsersClient
      users={users ?? []}
      currentUserId={user.id}
      companyId={profile.company_id}
    />
  );
}
