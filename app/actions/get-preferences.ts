"use server";

import { supabase } from "@/lib/supabase";
import type { User } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";

export async function getUser(): Promise<User | null> {
  try {
    const { userId } = await auth();

    if (!userId) {
      console.error("No authenticated user found");
      return null;
    }

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Database error:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in getUser:", error);
    return null;
  }
}
