import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Types for our editor preferences
export type User = {
  theme: string | null;
  font_size: number | null;
  tab_size: number | null;
  line_numbers: boolean | null;
  vim_mode: boolean | null;
  language: string | null;
};

export const createClerkWebhookSupabaseClient = () =>
  createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false
    }
  });
