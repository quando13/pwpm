import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS. Server-only; SUPABASE_SERVICE_ROLE_KEY has no
// NEXT_PUBLIC_ prefix so it is never bundled into client-side code, per
// docs/technical/security-rls.md "Service Role Usage". Used exclusively by
// recomputeInvestmentSnapshot to write performance_snapshots, which has no
// insert/update policy for the authenticated role.
export function createServiceClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
