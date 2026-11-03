import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * The signed-in user and their profile, fetched ONCE per request.
 *
 * A dashboard page, its header and the notification bell all need this; with
 * React's cache() they share one result instead of each making their own
 * auth + profile round trips to Supabase (that used to be 3x per page load).
 */
export const getSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, school_id, status")
    .eq("id", user.id)
    .single();

  return { supabase, user, profile };
});
