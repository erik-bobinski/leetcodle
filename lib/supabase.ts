import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our editor preferences
export type EditorPreferences = {
  device_id: string | null;
  user_id: string | null;
  theme: string | null;
  font_size: number | null;
  tab_size: number | null;
  line_numbers: boolean | null;
  vim_mode: boolean | null;
  language: string | null;
};

// Type for creating/updating preferences (omits auto-generated fields)
export type EditorPreferencesInput = Omit<
  EditorPreferences,
  "id" | "created_at" | "updated_at"
>;
