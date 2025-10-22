// TODO: migrate all server actions to drizzle, update corresponding client logic, and use tryCatch() wrapper

"use server";

import { supabase } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";

// TODO: Refactor this function to use user-submisson table
export type ArchiveData = {
  date: string; // YYYY-MM-DD format
  problem: {
    id: string;
    title: string;
    description: string;
  } | null;
  submission: {
    attempt_status: "completed" | "in_progress" | "failed" | "not_attempted";
    attempts_count: number;
    latest_code?: string;
  } | null;
};

export async function getArchiveData(): Promise<ArchiveData[]> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return [];
    }

    // Get all problems with their active dates
    const { data: problems, error: problemsError } = await supabase
      .from("problems")
      .select("id, title, description, active_date")
      .order("active_date", { ascending: true });

    if (problemsError) {
      console.error("Error fetching problems:", problemsError);
      return [];
    }

    // Get user submissions for all problems
    const { data: submissions, error: submissionsError } = await supabase
      .from("user_submissions")
      .select("problem_id, attempt_status, attempts_count, latest_code")
      .eq("user_id", userId);

    if (submissionsError) {
      console.error("Error fetching user submissions:", submissionsError);
      return [];
    }

    // Create a map of submissions by problem_id for quick lookup
    const submissionsMap = new Map(
      submissions?.map((sub) => [sub.problem_id, sub]) || []
    );

    // Combine problems with submission data
    const archiveData: ArchiveData[] =
      problems?.map((problem) => {
        const submission = submissionsMap.get(problem.id);

        return {
          date: problem.active_date,
          problem: {
            id: problem.id,
            title: problem.title,
            description: problem.description
          },
          submission: submission
            ? {
                attempt_status: submission.attempt_status as
                  | "completed"
                  | "in_progress"
                  | "failed"
                  | "not_attempted",
                attempts_count: submission.attempts_count,
                latest_code: submission.latest_code
              }
            : {
                attempt_status: "not_attempted" as const,
                attempts_count: 0
              }
        };
      }) || [];

    return archiveData;
  } catch (error) {
    console.error("Error in getArchiveData:", error);
    return [];
  }
}
