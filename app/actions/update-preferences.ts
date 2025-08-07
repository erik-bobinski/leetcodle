"use server";

import { supabase } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";

export async function updatePreferences(formData: FormData) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("No current user - please sign in to save preferences");
    }

    const rawFormData = Object.fromEntries(formData);

    const newPreferences = {
      language: rawFormData.language,
      vim_mode: rawFormData.vim_mode === "on",
      line_numbers: rawFormData.line_numbers === "on",
      font_size: Number(rawFormData.font_size),
      tab_size: Number(rawFormData.tab_size)
    };

    const { error } = await supabase
      .from("users")
      .update({
        ...newPreferences
      })
      .eq("user_id", userId);

    if (error) {
      console.error("Database error:", error);
      throw new Error(`Failed to update preferences: ${error.message}`);
    }

    return newPreferences;
  } catch (error) {
    console.error("Error in updatePreferences:", error);
    throw new Error(error instanceof Error ? error.message : "Unknown error");
  }
}
