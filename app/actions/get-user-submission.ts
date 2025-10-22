// TODO: migrate all server actions to drizzle, update corresponding client logic, and use tryCatch() wrapper

"use server";

import { supabase } from "@/lib/supabase";
import { UserSubmission } from "@/types/database";
import { auth } from "@clerk/nextjs/server";

export async function getUserSubmission(
  date?: string
): Promise<UserSubmission | null> {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  // Use provided date or default to today
  const targetDate = date || new Date().toISOString().split("T")[0];

  // get problem ID for the target date
  const { data: problem, error: problemError } = await supabase
    .from("problems")
    .select("id")
    .eq("active_date", targetDate)
    .single();
  if (problemError) {
    throw new Error(
      `Problem fetch error in get-user-submission.ts: ${problemError.message}`
    );
    return null;
  }

  // get user's attempts for the target date's problem
  const { data, error } = await supabase
    .from("user_submissions")
    .select("*")
    .eq("user_id", userId)
    .eq("problem_id", problem.id)
    .order("created_at", { ascending: true })
    .maybeSingle();
  if (error) {
    throw new Error(
      `Database Error in get-user-submission.ts: ${error.message}`
    );
  }

  return data as UserSubmission;
}
