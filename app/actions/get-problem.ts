"use server";

import { supabase } from "@/lib/supabase";
import type { Problem } from "@/types/problem-generation";
import { PostgrestError } from "@supabase/supabase-js";

export async function getTodaysProblem(): Promise<PostgrestError | Problem> {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("problems")
    .select("*")
    .eq("active_date", today)
    .single();
  if (error) {
    console.error(`Database Error: ${error}`);
    return error;
  }
  return data as Problem;
}
