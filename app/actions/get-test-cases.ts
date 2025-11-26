"use server";

import { db } from "@/drizzle";
import { eq } from "drizzle-orm";
import { tryCatch } from "@/lib/try-catch";
import { ProblemsTable, TestCasesTable } from "@/drizzle/schema";

export async function getTestArgs(date?: string) {
  const targetDate = date?.trim() || new Date().toISOString().split("T")[0];

  const { data: problemData, error: problemError } = await tryCatch(
    db
      .select({ problemId: ProblemsTable.id })
      .from(ProblemsTable)
      .where(eq(ProblemsTable.active_date, targetDate))
  );
  if (problemError) {
    return problemError;
  }
  if (problemData.length === 0) {
    return [];
  }
  const { problemId } = problemData[0];

  const { data: testCasesData, error: testCasesError } = await tryCatch(
    db
      .select()
      .from(TestCasesTable)
      .where(eq(TestCasesTable.problem_id, problemId))
  );
  if (testCasesError) {
    return testCasesError;
  }
  if (testCasesData.length === 0) {
    return [];
  }

  return testCasesData;
}
