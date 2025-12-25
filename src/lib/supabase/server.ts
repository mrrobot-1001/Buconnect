import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { type Database } from "./client";

export function createSupabaseServerClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies();
          return cookieStore.get(name)?.value;
        },
        async set(name: string, value: string, options: CookieOptions) {
          const cookieStore = await cookies();
          cookieStore.set({ name, value, ...options });
        },
        async remove(name: string, options: CookieOptions) {
          const cookieStore = await cookies();
          cookieStore.set({ name, value: "", ...options });
        },
      },
    },
  );
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Helper to create client safely
const createSafeClient = (url: string | undefined, key: string | undefined) => {
  if (url && key) {
    return createClient<Database>(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  // Return a dummy client for build time if vars are missing
  console.warn(
    "Supabase environment variables missing. Using fallback client.",
  );
  return createClient<Database>(
    "https://placeholder.supabase.co",
    "placeholder",
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
};

// Server-side Supabase client with service role (bypasses RLS)
export const supabaseAdmin = createSafeClient(supabaseUrl, supabaseServiceKey);
