import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// One client per request — see docs/technical/architecture.md "Reads"/"Writes".
// Always RLS-scoped: it authenticates as the signed-in user, never the service role.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component render — cookies can't be set there.
            // Session refresh already happens in proxy.ts on every request.
          }
        },
      },
    },
  );
}
