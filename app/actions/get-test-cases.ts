// TODO: migrate all server actions to drizzle, update corresponding client logic, and use tryCatch() wrapper

"use server";

import { supabase } from "@/lib/supabase";
import { Problems } from "@/types/database";

export async function getTestCases() {
  // TODO: this will have to access URL params when the REST problem page is implemented
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("problems")
    .select("test_cases")
    .eq("active_date", today)
    .single();
  if (error) {
    throw new Error(`Database Error: ${error.message}`);
  }

  if (!data || data.test_cases == null)
    throw new Error("No test_cases found in database");

  return data.test_cases as Problems["test_cases"];
}
