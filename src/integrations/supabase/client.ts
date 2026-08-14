import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// These are statically replaced by Vite at build time for the client bundle.
// On the server side (SSR/Nitro), process.env is used instead.
const SUPABASE_URL: string =
  (typeof process !== 'undefined' && process.env.SUPABASE_URL)
    ? process.env.SUPABASE_URL
    : (import.meta.env.VITE_SUPABASE_URL as string);

const SUPABASE_PUBLISHABLE_KEY: string =
  (typeof process !== 'undefined' && process.env.SUPABASE_PUBLISHABLE_KEY)
    ? process.env.SUPABASE_PUBLISHABLE_KEY
    : (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string);

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  const missing = [
    ...(!SUPABASE_URL ? ['SUPABASE_URL / VITE_SUPABASE_URL'] : []),
    ...(!SUPABASE_PUBLISHABLE_KEY ? ['SUPABASE_PUBLISHABLE_KEY / VITE_SUPABASE_PUBLISHABLE_KEY'] : []),
  ];
  console.error(`[Supabase] Missing env vars: ${missing.join(', ')}`);
}

function createSupabaseClient() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
