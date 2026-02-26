import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_NUMBER_SERIES = [
  { document_type: "orders", prefix: "ORD", current_sequence: 0 },
  { document_type: "inquiries", prefix: "INQ", current_sequence: 0 },
  { document_type: "samples", prefix: "SMP", current_sequence: 0 },
  { document_type: "lab_dips", prefix: "LD", current_sequence: 0 },
  { document_type: "purchase_orders", prefix: "PO", current_sequence: 0 },
  { document_type: "grn", prefix: "GRN", current_sequence: 0 },
  { document_type: "work_orders", prefix: "WO", current_sequence: 0 },
  { document_type: "quality_checks", prefix: "QC", current_sequence: 0 },
  { document_type: "shipments", prefix: "SHP", current_sequence: 0 },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, fullName, companyName, city, country } = body;

    if (!userId || !email || !fullName || !companyName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // Verify the user exists in auth
    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    if (authError || !authUser?.user) {
      return NextResponse.json(
        { error: "Invalid user account" },
        { status: 400 }
      );
    }

    // Create company record
    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .insert({
        name: companyName,
        city: city || null,
        country: country || null,
        default_currency: "USD",
        financial_year_start: 1,
      })
      .select("id")
      .single();

    if (companyError) {
      return NextResponse.json(
        { error: "Failed to create company: " + companyError.message },
        { status: 500 }
      );
    }

    const companyId = company.id;

    // Create profile with super_admin role
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: userId,
        company_id: companyId,
        full_name: fullName,
        email: email,
        role: "super_admin",
        is_active: true,
      });

    if (profileError) {
      // Clean up company if profile creation fails
      await supabaseAdmin.from("companies").delete().eq("id", companyId);
      return NextResponse.json(
        { error: "Failed to create profile: " + profileError.message },
        { status: 500 }
      );
    }

    // Insert default number series
    const numberSeriesInserts = DEFAULT_NUMBER_SERIES.map((series) => ({
      ...series,
      company_id: companyId,
    }));

    const { error: seriesError } = await supabaseAdmin
      .from("number_series")
      .insert(numberSeriesInserts);

    if (seriesError) {
      console.warn("Failed to insert number series:", seriesError.message);
    }

    return NextResponse.json({
      success: true,
      companyId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
