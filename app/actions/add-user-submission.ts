"use server";

import { db } from "@/drizzle";
import { eq, and, sql, desc } from "drizzle-orm";
import { tryCatch } from "@/lib/try-catch";
import {
  ProblemsTable,
  UserSubmissionsTable,
  UserSubmissionCodeTable,
  UserSubmissionAttemptsTable
} from "@/drizzle/schema";
import { auth } from "@clerk/nextjs/server";
import { languages } from "@/types/editor-languages";
export async function addUserSubmission(
  langKey: string,
  code: string,
  newAttempt: boolean[],
  date?: string
) {
  const { data: authData, error: authError } = await tryCatch(auth());
  if (authError instanceof Error) return authError;
  const userId = authData?.userId;
  if (!userId) {
    return new Error("User must be logged in to save submissions");
  }

  if (!Object.keys(languages).includes(langKey)) {
    return new Error(`Current language: ${langKey} isn't supported`);
  }

  const targetDate = date || new Date().toISOString().split("T")[0];

  // Get problem for target date
  const { data: problemDataArray, error: problemError } = await tryCatch(
    db
      .select({ problemId: ProblemsTable.id })
      .from(ProblemsTable)
      .where(eq(ProblemsTable.active_date, targetDate))
      .limit(1)
  );
  if (problemError) {
    return problemError;
  }
  if (problemDataArray === null || problemDataArray.length === 0) {
    return new Error(
      `No problem id found for date: ${targetDate} found while adding user submission`
    );
  }
  const { problemId } = problemDataArray[0];

  const { error: transactionError } = await tryCatch(
    db.transaction(async (tx) => {
      // Check if submission already exists for this user and problem
      const { data: existingSubmission, error: checkError } = await tryCatch(
        tx
          .select({ id: UserSubmissionsTable.id })
          .from(UserSubmissionsTable)
          .where(
            and(
              eq(UserSubmissionsTable.user_id, userId),
              eq(UserSubmissionsTable.problem_id, problemId)
            )
          )
      );
      if (checkError) {
        throw checkError;
      }

      let submissionId: string;

      if (existingSubmission && existingSubmission.length > 0) {
        // Use existing submission
        submissionId = existingSubmission[0].id;
      } else {
        // Insert new row in user_submissions
        const { data: newSubmission, error: insertError } = await tryCatch(
          tx
            .insert(UserSubmissionsTable)
            .values({
              user_id: userId,
              problem_id: problemId
            })
            .returning({ id: UserSubmissionsTable.id })
        );
        if (insertError) {
          throw insertError;
        }
        if (!newSubmission || newSubmission.length === 0) {
          throw new Error("Failed to create user submission");
        }
        submissionId = newSubmission[0].id;
      }

      // Insert attempt into user_submission_attempts
      // Get the max attempt number for this submission to determine the next attempt number
      const { data: existingAttempts, error: attemptsCheckError } =
        await tryCatch(
          tx
            .select({
              attempt_number: UserSubmissionAttemptsTable.attempt_number
            })
            .from(UserSubmissionAttemptsTable)
            .where(eq(UserSubmissionAttemptsTable.submission_id, submissionId))
            .orderBy(desc(UserSubmissionAttemptsTable.attempt_number))
            .limit(1)
        );
      if (attemptsCheckError) {
        throw attemptsCheckError;
      }

      // Calculate next attempt number (if no attempts exist, start at 1)
      const nextAttemptNumber =
        existingAttempts && existingAttempts.length > 0
          ? existingAttempts[0].attempt_number + 1
          : 1;
      if (nextAttemptNumber > 5) {
        throw new Error("All 5 attempts have been used for this problem");
      }

      const testCaseResultsJson = JSON.stringify(newAttempt);
      const { error: insertAttemptError } = await tryCatch(
        tx.insert(UserSubmissionAttemptsTable).values({
          submission_id: submissionId,
          attempt_number: nextAttemptNumber,
          test_case_results: testCaseResultsJson
        })
      );
      if (insertAttemptError) {
        throw insertAttemptError;
      }

      // Upsert code in user_submission_code
      const { error: upsertCodeError } = await tryCatch(
        tx
          .insert(UserSubmissionCodeTable)
          .values({
            submission_id: submissionId,
            language: langKey,
            code: code
          })
          .onConflictDoUpdate({
            target: [
              UserSubmissionCodeTable.submission_id,
              UserSubmissionCodeTable.language
            ],
            set: {
              code: code,
              updated_at: sql`now()`
            }
          })
      );
      if (upsertCodeError) {
        throw upsertCodeError;
      }
    })
  );

  if (transactionError) {
    return transactionError;
  }

  return { success: true };
}
