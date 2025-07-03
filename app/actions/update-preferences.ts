"use server";

import { supabase } from "@/lib/supabase";
import { currentUser } from "@clerk/nextjs/server";

export async function updatePreferences(formData: FormData) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error("No current user");
    }
    const userId = user.id;

    // process form data
    const rawFormData = Object.fromEntries(formData);

    const newPreferences = {
      language: rawFormData.language,
      vim_mode: rawFormData.vim_mode === "on",
      line_numbers: rawFormData.line_numbers === "on",
      font_size: Number(rawFormData.font_size),
      tab_size: Number(rawFormData.tab_size)
    };

    console.log(newPreferences);

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
  } catch (error) {
    console.error("Error in updatePreferences:", error);
    throw new Error(error instanceof Error ? error.message : "Unknown error");
  }
}
