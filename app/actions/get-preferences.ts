"use server";

import { tryCatch } from "@/lib/try-catch";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/drizzle";
import { UsersTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function getUser() {
  const { data: authData, error: authError } = await tryCatch(auth());
  if (authError) {
    return { error: `Error getting userId from clerk: ${authError.message}` };
  }

  const userId = authData.userId;
  if (userId === null) {
    return null;
  }

  const { data: userData, error: dbError } = await tryCatch(
    db.select().from(UsersTable).where(eq(UsersTable.user_id, userId)).limit(1)
  );
  if (dbError) {
    return {
      error: `Error querying user from database: ${dbError.message}`
    };
  }

  // Check if user exists
  if (!userData || userData.length === 0) {
    return null;
  }

  // Return the first (and only) user record, excluding sensitive fields
  const user = userData[0];
  return {
    theme: user.theme,
    font_size: user.font_size,
    tab_size: user.tab_size,
    line_numbers: user.line_numbers,
    vim_mode: user.vim_mode,
    language: user.language,
    username: user.username
  } as Omit<typeof user, "created_at" | "updated_at" | "user_id" | "email">;
}
