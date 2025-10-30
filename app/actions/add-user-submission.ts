// TODO: migrate all server actions to drizzle, update corresponding client logic, and use tryCatch() wrapper

"use server";

import { supabase } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";
import { languages } from "@/types/editor-languages";
export async function addAttempts(
  langKey: string,
  code: string,
  newAttempt: boolean[],
  date?: string
) {
  // push attempt to DB if user is logged in
  // TODO: localStorage will track it otherwise for non-logged in users
  const { userId } = await auth();
  if (!userId) {
    return;
  }

  if (!Object.keys(languages).includes(langKey)) {
    throw new Error(`Current language isn't supported`);
  }

  // Use provided date or default to today
  const targetDate = date || new Date().toISOString().split("T")[0];

  // Get problem ID for the target date
  const { data: problem, error: problemError } = await supabase
    .from("problems")
    .select("id")
    .eq("active_date", targetDate)
    .single();
  if (problemError) {
    console.error(`Problem fetch error: ${problemError.message}`);
    return null;
  }
  if (!problem?.id) {
    // user has no attempts
    return null;
  }

  // Get current attempts array
  const { data: storedAttempts, error: storedAttemptsError } = await supabase
    .from("user_submissions")
    .select("attempts")
    .eq("user_id", userId)
    .eq("problem_id", problem.id)
    .single();
  if (storedAttemptsError) {
    throw new Error(storedAttemptsError.message);
  }

  // Build the new attempts array
  const existingAttempts = storedAttempts?.attempts || [];
  const updatedAttempts = [...existingAttempts, newAttempt];
  if (updatedAttempts.length > 5) {
    const addAttemptsError = new Error(
      "You used all attempts for this problem"
    );
    addAttemptsError.name = "attempts_exceeded";
    throw addAttemptsError;
  }

  const { error } = await supabase
    .from("user_submissions")
    .update({
      latest_code: {
        [langKey]: code
      },
      attempts: updatedAttempts
    })
    .eq("user_id", userId)
    .eq("problem_id", problem.id);
  if (error) {
    console.error("Database error:", error);
    throw new Error(`Failed to update preferences: ${error.message}`);
  }
}
