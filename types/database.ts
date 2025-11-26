import { z } from "zod";
import { languages } from "./editor-languages";
import {
  ProblemsTable,
  TemplatesTable,
  TemplateArgsTable,
  PrerequisiteDataStructuresTable,
  UserSubmissionCodeTable
} from "@/drizzle/schema";
import { InferSelectModel } from "drizzle-orm";

// Infer types directly from Drizzle schema
export type ProblemTable = InferSelectModel<typeof ProblemsTable>;
export type TemplateTable = InferSelectModel<typeof TemplatesTable>;
export type TemplateArgsTable = InferSelectModel<typeof TemplateArgsTable>;
export type PrerequisiteDataStructureTable = InferSelectModel<
  typeof PrerequisiteDataStructuresTable
>;
export type UserSubmissionCode = Pick<
  InferSelectModel<typeof UserSubmissionCodeTable>,
  "language" | "code"
>;

// Type for the problem object returned by getProblem action
// This represents the joined/constructed object with relations
export type GetProblem = ProblemTable & {
  template: TemplateTable & {
    typed_args: Record<keyof typeof languages, TemplateArgsTable>;
  };
  prerequisite_data_structure: PrerequisiteDataStructureTable[] | null;
};
// Union type for the getProblem return value (success or error)
export type GetProblemResult = GetProblem | { error: string };

// Zod schemas for AI-generated data
export const problemDetailsBasicSchema = z.object({
  title: z.string(),
  description: z.string(),
  example_input: z.string(),
  example_output: z.string()
});

export const problemDetailsTemplateSchema = z.object({
  functionName: z.string(),
  argNames: z.array(z.string()),
  typedArgs: z.object({
    cpp: z.array(z.string()),
    go: z.array(z.string()),
    java: z.array(z.string()),
    javascript: z.array(z.string()),
    python: z.array(z.string()),
    rust: z.array(z.string()),
    typescript: z.array(z.string())
  }),
  returnType: z.object({
    cpp: z.string(),
    go: z.string(),
    java: z.string(),
    javascript: z.string(),
    python: z.string(),
    rust: z.string(),
    typescript: z.string()
  }),
  jsDocString: z.string().describe(
    `A JSON string where keys are parameter names
      and values are their types, and a "returns" key. Example:
      \'{ "s": "string", "nums": "Array<number>", "returns": "number" }\'`
  )
});

export const problemDetailsSchema = z.object({
  title: z.string(),
  description: z.string(),
  example_input: z.string(),
  example_output: z.string(),
  template: z.object({
    functionName: z.string(),
    argNames: z.array(z.string()),
    typedArgs: z.object({
      cpp: z.array(z.string()),
      go: z.array(z.string()),
      java: z.array(z.string()),
      javascript: z.array(z.string()),
      python: z.array(z.string()),
      rust: z.array(z.string()),
      typescript: z.array(z.string())
    }),
    returnType: z.object({
      cpp: z.string(),
      go: z.string(),
      java: z.string(),
      javascript: z.string(),
      python: z.string(),
      rust: z.string(),
      typescript: z.string()
    }),
    jsDocString: z.string().describe(
      `A JSON string where keys are parameter names
        and values are their types, and a "returns" key. Example:
        \'{ "s": "string", "nums": "Array<number>", "returns": "number" }\'`
    )
  })
});
export const referenceSolutionSchema = z.object({
  cpp: z.string(),
  go: z.string(),
  java: z.string(),
  javascript: z.string(),
  python: z.string(),
  rust: z.string(),
  typescript: z.string()
});
export const prerequisiteDataStructureSchema = z.object({
  prerequisiteDataStructure: z
    .object({
      cpp: z.string(),
      go: z.string(),
      java: z.string(),
      javascript: z.string(),
      python: z.string(),
      rust: z.string(),
      typescript: z.string()
    })
    .optional(),
  testInputs: z.object({
    python: z.array(z.string()).length(5, "Must generate exactly 5 test inputs")
  })
});

export const testInputsAllLanguagesSchema = z.object({
  cpp: z
    .array(z.string())
    .length(5, "Must generate exactly 5 test inputs for each language"),
  go: z
    .array(z.string())
    .length(5, "Must generate exactly 5 test inputs for each language"),
  java: z
    .array(z.string())
    .length(5, "Must generate exactly 5 test inputs for each language"),
  javascript: z
    .array(z.string())
    .length(5, "Must generate exactly 5 test inputs for each language"),
  python: z
    .array(z.string())
    .length(5, "Must generate exactly 5 test inputs for each language"),
  rust: z
    .array(z.string())
    .length(5, "Must generate exactly 5 test inputs for each language"),
  typescript: z
    .array(z.string())
    .length(5, "Must generate exactly 5 test inputs for each language")
});
export const testCasesSolutionsSchema = z.object({
  testCase1: z.object({
    input: z.string(),
    code: z.string()
  }),
  testCase2: z.object({
    input: z.string(),
    code: z.string()
  }),
  testCase3: z.object({
    input: z.string(),
    code: z.string()
  }),
  testCase4: z.object({
    input: z.string(),
    code: z.string()
  }),
  testCase5: z.object({
    input: z.string(),
    code: z.string()
  })
});
export const gradeSolutionOutputSchema = z.object({
  graded: z.boolean(),
  hint: z.union([z.string(), z.null()]),
  isCorrect: z.array(z.boolean())
});
// Types for AI-generated data
export type ProblemDetails = z.infer<typeof problemDetailsSchema>;
export type ReferenceSolution = z.infer<typeof referenceSolutionSchema>;
export type PrerequisiteDataStructure = z.infer<
  typeof prerequisiteDataStructureSchema
>;
export type TestCasesSolutions = z.infer<typeof testCasesSolutionsSchema>;
export type GradeSolutionOutput = z.infer<typeof gradeSolutionOutputSchema>;

// DEPRECATED: Legacy database table types (for reference only)
// These represent the old structure before the database schema refactor
// Use the Drizzle-inferred types above instead
export interface UserSubmission {
  user_id: string;
  problem_id: string;
  latest_code: Record<keyof typeof languages, string> | null;
  attempts: boolean[][];
  created_at: string;
}
export interface Problems {
  id: string;
  title: string;
  description: string;
  test_cases: Record<string, string>;
  reference_solution: Record<keyof typeof languages, string>;
  example_input: string;
  example_output: string;
  template: {
    argNames: string[];
    testArgs: Record<keyof typeof languages, string[]>;
    typedArgs: Record<keyof typeof languages, string[]>;
    returnType: Record<keyof typeof languages, string>;
    jsDocString?: string | Record<string, string>;
    functionName: string;
  };
  prerequisite_data_structure: Record<keyof typeof languages, string> | null;
  active_date: string;
  created_at: string;
}
export interface Users {
  user_id: string;
  theme?: Record<string, string>;
  font_size: number | null;
  tab_size: number | null;
  line_numbers: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  vim_mode: boolean | null;
  language: keyof typeof languages | null;
  username: string | null;
  email: string;
}

// DEPRECATED: Legacy Problem type (for reference only)
// This represents the old structure before the database schema refactor
export interface ProblemLegacy {
  id: string;
  title: string;
  description: string;
  test_cases: Record<string, string>;
  reference_solution: Record<keyof typeof languages, string>;
  example_input: string;
  example_output: string;
  template: {
    argNames: string[];
    testArgs: Record<keyof typeof languages, string[]>;
    typedArgs: Record<keyof typeof languages, string[]>;
    returnType: Record<keyof typeof languages, string>;
    jsDocString?: string | Record<string, string>;
    functionName: string;
  };
  prerequisite_data_structure: Record<keyof typeof languages, string> | null;
  active_date: string;
  created_at: string;
}
