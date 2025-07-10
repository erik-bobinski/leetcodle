import type { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  generateProblemDetails,
  generateReferenceSolution,
  generateTestCases,
  generateHints
} from "@/lib/gemini";
import type {
  ProblemDetails,
  ReferenceSolution
} from "@/types/problem-generation";

export async function GET(request: NextRequest) {
  // 1. security check
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401
    });
  }

  // 2. problem details AI call
  const problemDetails: ProblemDetails = await generateProblemDetails();

  // 3. reference solution AI call
  const referenceSolution: ReferenceSolution = await generateReferenceSolution(
    problemDetails.description
  );

  // 4. test cases AI call
  const testCases = await generateTestCases();

  // 5. generate expected outputs via judge0

  // 6. hints AI call
  const hints = await generateHints();

  // DB insert

  return Response.json({ success: true });
}
