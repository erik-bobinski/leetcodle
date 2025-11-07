"use server";

import { db } from "@/drizzle";
import { asc, eq, sql } from "drizzle-orm";
import { ProblemsTable, UserSubmissionsTable } from "@/drizzle/schema";
import { auth } from "@clerk/nextjs/server";
import { tryCatch } from "@/lib/try-catch";

export type ArchiveData = {
  date: string; // YYYY-MM-DD format
  problem: {
    title: string;
  } | null;
  submission: {
    attempt_status: "completed" | "in_progress" | "failed" | "not_attempted";
  } | null;
};

export async function getArchiveData() {
  const { data: authData, error: authError } = await tryCatch(auth());
  if (authError) {
    return authError;
  }
  if (!authData || !authData.userId) {
    return [];
  }
  const userId = authData.userId;

  // Get all problems with their active dates - only fetch title and date
  const { data: problems, error: problemsError } = await tryCatch(
    db
      .select({
        id: ProblemsTable.id,
        title: ProblemsTable.title,
        active_date: ProblemsTable.active_date
      })
      .from(ProblemsTable)
      .orderBy(asc(ProblemsTable.active_date))
  );
  if (problemsError) {
    return problemsError;
  }
  if (problems === null) {
    return [];
  }

  // Get user submissions for all problems
  const { data: submissions, error: submissionsError } = await tryCatch(
    db
      .select({
        id: UserSubmissionsTable.id,
        problem_id: UserSubmissionsTable.problem_id
      })
      .from(UserSubmissionsTable)
      .where(eq(UserSubmissionsTable.user_id, userId))
  );

  if (submissionsError) {
    return submissionsError;
  }
  if (submissions === null) {
    return [];
  }

  // Get submission IDs to query related data
  const submissionIds = submissions.map((sub) => sub.id);

  // Get latest attempt per submission - only need test_case_results to determine status
  // This fetches only the latest attempt per submission, avoiding loading all attempts
  const { data: attemptsData, error: attemptsError } = await tryCatch(
    submissionIds.length > 0
      ? (db.execute(sql`
        SELECT DISTINCT ON (submission_id)
          submission_id::text as submission_id,
          test_case_results::text as test_case_results
        FROM user_submission_attempts
        WHERE submission_id = ANY(${submissionIds}::uuid[])
        ORDER BY submission_id, attempt_number DESC
      `) as Promise<
          Array<{
            submission_id: string;
            test_case_results: string;
          }>
        >)
      : Promise.resolve([])
  );
  if (attemptsError) {
    return attemptsError;
  }

  // Compute submission data with only attempt_status
  const submissionsWithData = submissions.map((submission) => {
    const attempt = attemptsData?.find(
      (a) => a.submission_id === submission.id
    );

    let attempt_status:
      | "completed"
      | "in_progress"
      | "failed"
      | "not_attempted" = "not_attempted";

    if (attempt) {
      try {
        const testCaseResults = JSON.parse(
          attempt.test_case_results
        ) as boolean[];
        const allPassed = testCaseResults.every((result) => result === true);
        const anyPassed = testCaseResults.some((result) => result === true);

        if (allPassed) {
          attempt_status = "completed";
        } else if (anyPassed) {
          attempt_status = "in_progress";
        } else {
          attempt_status = "failed";
        }
      } catch {
        attempt_status = "failed";
      }
    }

    return {
      problem_id: submission.problem_id,
      attempt_status
    };
  });

  // Create a map of submissions by problem_id for quick lookup
  const submissionsMap = new Map(
    submissionsWithData.map((sub) => [sub.problem_id, sub])
  );

  // Combine problems with submission data
  const archiveData: ArchiveData[] =
    problems?.map((problem) => {
      const submission = submissionsMap.get(problem.id);

      return {
        date: problem.active_date,
        problem: {
          title: problem.title
        },
        submission: submission
          ? {
              attempt_status: submission.attempt_status
            }
          : {
              attempt_status: "not_attempted" as const
            }
      };
    }) || [];

  return archiveData;
}
