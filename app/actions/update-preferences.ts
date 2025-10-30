"use server";

import { auth } from "@clerk/nextjs/server";
import { tryCatch } from "@/lib/try-catch";
import { db } from "@/drizzle";
import { UsersTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function updatePreferences(formData: FormData) {
  const { data: userData, error: authError } = await tryCatch(auth());
  if (authError) {
    return {
      error: `Clerk's auth() failed in updatePreferences(): ${authError.message}`
    };
  }

  const userId = userData.userId;
  if (!userId) {
    return {
      error: "Log in to save your preferences"
    };
  }

  const rawFormData = Object.fromEntries(formData);
  const newPreferences = {
    language: String(rawFormData.language),
    vim_mode: rawFormData.vim_mode === "on",
    line_numbers: rawFormData.line_numbers === "on",
    font_size: Number(rawFormData.font_size),
    tab_size: Number(rawFormData.tab_size)
  };

  const { error: dbError } = await tryCatch(
    db
      .update(UsersTable)
      .set({
        language: newPreferences.language,
        vim_mode: newPreferences.vim_mode,
        line_numbers: newPreferences.line_numbers,
        font_size: isFinite(newPreferences.font_size)
          ? newPreferences.font_size
          : null,
        tab_size: isFinite(newPreferences.tab_size)
          ? newPreferences.tab_size
          : null
      })
      .where(eq(UsersTable.user_id, userId))
  );
  if (dbError) {
    return {
      error: `Failed to update preferences: ${dbError.message}`
    };
  }

  return newPreferences;
}
