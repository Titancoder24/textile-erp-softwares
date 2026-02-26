import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Admin client uses the service role key for privileged operations
// like creating auth users on behalf of others.
// ONLY use this in API routes / server actions, never expose to client.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
