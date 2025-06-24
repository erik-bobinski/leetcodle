"use server";

import { supabase } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";

export async function updatePreferences(formData: FormData) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("No authenticated user found, sign up ;)");
    }

    const { data, error } = await supabase
      .from("users")
      .upsert({
        user_id: userId,
        ...preferences
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      throw new Error("Failed to update preferences");
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error in updatePreferences:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
