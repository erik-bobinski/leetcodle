"use server";

import { supabase } from "@/lib/supabase";
import type { EditorPreferences } from "@/lib/supabase";

export async function getPreferences(
  deviceId: string
): Promise<EditorPreferences | null> {
  const { data, error } = await supabase
    .from("editor_preferences")
    .select("*")
    .eq("device_id", deviceId)
    .single();

  if (error || !data) {
    console.error(`Error occurred or no data returned: 
        Error: ${error},
        ===============================
        Data: ${data}`);
  }
  return data;
}
