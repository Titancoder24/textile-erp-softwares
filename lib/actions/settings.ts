"use server";

import { createClient } from "@/lib/supabase/server";

export async function getCompanySettings(companyId: string) {
  const supabase = await createClient();

  if (!companyId) {
    return { data: null, error: "Company ID is required" };
  }

  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function updateCompanySettings(
  companyId: string,
  updates: {
    name?: string;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
    gst_number?: string | null;
    pan_number?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    financial_year_start?: number;
    default_currency?: string;
    logo_url?: string | null;
  }
) {
  const supabase = await createClient();

  if (!companyId) {
    return { data: null, error: "Company ID is required" };
  }

  const { data, error } = await supabase
    .from("companies")
    .update(updates)
    .eq("id", companyId)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}
