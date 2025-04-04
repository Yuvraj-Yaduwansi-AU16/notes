/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { createClient } from '@supabase/supabase-js';
import { env } from "~/env";

// Create a single supabase client for interacting with your database
// This client is configured to NOT manage sessions, as we're using NextAuth for that
export const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false, // Don't persist Supabase session in localStorage
      autoRefreshToken: false, // Don't auto refresh tokens
      detectSessionInUrl: false, // Don't detect session in URL
    },
  }
); 