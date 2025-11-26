"use server";

import { tryCatch } from "@/lib/try-catch";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/drizzle";
import { eq, and, desc, asc } from "drizzle-orm";
import {
  ProblemsTable,
  UserSubmissionsTable,
  UserSubmissionAttemptsTable,
  UserSubmissionCodeTable
} from "@/drizzle/schema";

export async function getUserSubmission(date?: string) {
  const { data: authData, error: authError } = await tryCatch(auth());
  if (authError) {
    return { error: authError.message };
  }
  if (!authData) {
    return null;
  }
  const { userId } = authData;
  if (!userId) {
    return null;
  }

  const targetDate = date || new Date().toISOString().split("T")[0];

  const { data: problemData, error: problemError } = await tryCatch(
    db
      .select()
      .from(ProblemsTable)
      .where(eq(ProblemsTable.active_date, targetDate))
      .limit(1)
  );
  if (problemError) {
    return { error: problemError.message };
  }
  if (!problemData) {
    return { error: `Problem not found for the date: ${targetDate}` };
  }
  const problem = problemData[0];

  // get user's attempts for the target date's problem
  const { data: userSubmissionData, error: userSubmissionError } =
    await tryCatch(
      db
        .select()
        .from(UserSubmissionsTable)
        .where(
          and(
            eq(UserSubmissionsTable.user_id, userId),
            eq(UserSubmissionsTable.problem_id, problem.id)
          )
        )
        .orderBy(desc(UserSubmissionsTable.created_at))
        .limit(1)
    );
  if (userSubmissionError) {
    return {
      error: `Error getting user submission: ${userSubmissionError.message}`
    };
  }
  if (!userSubmissionData || userSubmissionData.length === 0) {
    return null;
  }
  const userSubmission = userSubmissionData[0];

  const { data: userSubmissionsCodeData, error: userSubmissionCodeError } =
    await tryCatch(
      db
        .select()
        .from(UserSubmissionCodeTable)
        .where(eq(UserSubmissionCodeTable.submission_id, userSubmission.id))
        .limit(1)
    );
  if (userSubmissionCodeError) {
    return {
      error: `Error getting user submission code: ${userSubmissionCodeError.message}`
    };
  }
  if (!userSubmissionsCodeData) {
    return null;
  }
  const userSubmissionCode = userSubmissionsCodeData[0];

  const { data: userSubmissionAttemptData, error: userSubmissionAttemptError } =
    await tryCatch(
      db
        .select()
        .from(UserSubmissionAttemptsTable)
        .where(eq(UserSubmissionAttemptsTable.submission_id, userSubmission.id))
        .orderBy(asc(UserSubmissionAttemptsTable.attempt_number))
    );
  if (userSubmissionAttemptError) {
    return {
      error: `Error getting user submission attempt: ${userSubmissionAttemptError.message}`
    };
  }
  if (!userSubmissionAttemptData || userSubmissionAttemptData.length === 0) {
    return {
      userSubmissionCode: {
        language: userSubmissionCode.language,
        code: userSubmissionCode.code
      },
      userSubmissionAttempts: []
    };
  }

  // Parse the test_case_results JSON string for each attempt
  const attempts = userSubmissionAttemptData.map((attempt) => {
    try {
      const testCaseResults = JSON.parse(
        attempt.test_case_results
      ) as boolean[];
      return testCaseResults;
    } catch {
      return [];
    }
  });

  return {
    userSubmissionCode: {
      language: userSubmissionCode.language,
      code: userSubmissionCode.code
    },
    userSubmissionAttempts: attempts
  };
}
