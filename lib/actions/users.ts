"use server";

import { createClient } from "@/lib/supabase/server";

export async function getCompanyUsers(companyId: string) {
  const supabase = await createClient();

  if (!companyId) {
    return { data: null, error: "Company ID is required" };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: true });

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function updateUserRole(
  userId: string,
  role: string,
  companyId: string
) {
  const supabase = await createClient();

  // Verify the target user belongs to the same company
  const { data: targetProfile, error: fetchError } = await supabase
    .from("profiles")
    .select("id, company_id")
    .eq("id", userId)
    .eq("company_id", companyId)
    .single();

  if (fetchError || !targetProfile) {
    return { data: null, error: "User not found in your company" };
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId)
    .eq("company_id", companyId)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function updateUserDepartment(
  userId: string,
  department: string,
  companyId: string
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .update({ department })
    .eq("id", userId)
    .eq("company_id", companyId)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function toggleUserStatus(userId: string, companyId: string) {
  const supabase = await createClient();

  // Get current status
  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", userId)
    .eq("company_id", companyId)
    .single();

  if (fetchError || !profile) {
    return { data: null, error: "User not found" };
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ is_active: !profile.is_active })
    .eq("id", userId)
    .eq("company_id", companyId)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function updateOwnProfile(data: {
  full_name?: string;
  phone?: string;
  department?: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: null, error: "Not authenticated" };

  const { data: updated, error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", user.id)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: updated, error: null };
}
