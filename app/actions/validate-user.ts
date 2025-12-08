"use server";

import { db } from "@/drizzle";
import { eq } from "drizzle-orm";
import { UsersTable } from "@/drizzle/schema";
import { tryCatch } from "@/lib/try-catch";

export async function validateUser(email: string) {
  if (!email) {
    return new Error("Email is required");
  }

  const { data, error } = await tryCatch(
    db
      .select({ userId: UsersTable.user_id, email: UsersTable.email })
      .from(UsersTable)
      .where(eq(UsersTable.email, email))
      .limit(1)
  );
  if (error) {
    return new Error(`Error finding user: ${error}`);
  }
  if (!data || data.length === 0) {
    return new Error(
      "User not found. Please check your credentials or sign up."
    );
  }

  return { success: true };
}
