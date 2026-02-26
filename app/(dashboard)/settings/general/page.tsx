import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GeneralSettingsClient } from "./general-settings-client";

export default async function GeneralSettingsPage() {
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

  // Only admins can edit company settings
  const adminRoles = ["super_admin", "factory_owner"];
  const canEdit = adminRoles.includes(profile.role);

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", profile.company_id)
    .single();

  if (!company) redirect("/dashboard");

  return (
    <GeneralSettingsClient
      company={company}
      companyId={profile.company_id}
      canEdit={canEdit}
    />
  );
}
