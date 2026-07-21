import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

let _adminClient: ReturnType<typeof createClient<Database>> | null = null;

export function createAdminClient() {
  if (_adminClient) return _adminClient;

  _adminClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  return _adminClient;
}
