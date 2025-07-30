"use server";

import { supabase } from "@/lib/supabase";
import type { Problem } from "@/types/problem-generation";

export async function getTodaysProblem() {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("problems")
    .select("*")
    .eq("active_date", today)
    .single();
  if (error) {
    console.error(`Database Error: ${error}`);
    throw new Error(error.message);
  }
  return data as Problem;
}
