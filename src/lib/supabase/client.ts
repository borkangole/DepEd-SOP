import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for use in Client Components ("use client").
 * Uses the public anon key — safe to expose to the browser because
 * Row Level Security policies (see supabase/migrations) enforce who
 * can actually read/write which rows.
 *
 * Not generic over the Database type: hand-maintaining a strict schema
 * type here fights the query builder more than it helps for a pilot.
 * Once the project is live, run
 *   npx supabase gen types typescript --project-id <ref>
 * and swap it back in for full type safety — src/lib/types/database.ts
 * documents the intended shape in the meantime.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
