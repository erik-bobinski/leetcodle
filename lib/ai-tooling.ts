import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { db } from "@/drizzle";
import { desc } from "drizzle-orm";
import { languages } from "@/types/editor-languages";
import { tryCatch } from "@/lib/try-catch";
import { ProblemsTable } from "@/drizzle/schema";
import {
  problemDetailsSchema,
  referenceSolutionSchema,
  prerequisiteDataStructureSchema,
  gradeSolutionOutputSchema,
  Problems,
  GradeSolutionOutput
} from "@/types/database";

async function getRecentProblemTitles() {
  const { data: recentProblems, error: recentProblemsError } = await tryCatch(
    db
      .select({ title: ProblemsTable.title })
      .from(ProblemsTable)
      .orderBy(desc(ProblemsTable.created_at))
      .limit(30)
  );
  if (recentProblemsError) {
    console.error("Error fetching recent problem titles:", recentProblemsError);
    return recentProblemsError;
  }
  // Handle empty results - return empty array if no problems exist
  if (!recentProblems || recentProblems.length === 0) {
    return [];
  }
  return recentProblems.map((problem) => problem.title);
}

export async function generateProblemDetails() {
  const recentProblemTitles = await getRecentProblemTitles();
  if (recentProblemTitles instanceof Error) {
    return recentProblemTitles;
  }

  const { data, error } = await tryCatch(
    generateObject({
      model: google("gemini-2.5-pro"),
      schema: problemDetailsSchema,
      system:
        "You are creating a daily coding problem in the style of leetcode with easy to medium difficulty.",
      prompt: `You can use various data structures such as arrays, strings, stacks, queues, heaps, trees, linked lists, etc.
    Generate the problem's \`title\`, \`description\`, an \`example_input\`,  and its corresponding
    \`example_output\`. In the description, example_input, and example_output fields, wrap all code terms,
    variable names, function names, and programming concepts in markdown backticks (\`code\`).
    For example: "Given a string \`s\`" or "Return the index of the first \`non-repeating\` character".
    Do NOT use HTML tags like <code> or <pre>. Use only markdown backticks for code formatting.

    ${
      recentProblemTitles.length > 0
        ? `Ensure you do not generate a problem that has a similar description or uses data structures
    frequently used in these ${recentProblemTitles.length} previous problems (i.e. don't create a problem that revolves around a
    string input if they are common in these problems): ${recentProblemTitles.join(", ")}.`
        : "This is a new problem database, so there are no previous problems to avoid duplicating."
    }

    Generate \`functionName\`, the name of the function(just the name of the function, no parenthesees, etc).
    Generate \`argNames\`, the names of all the args passed into the function to solve the problem.
    Generate \`typedArgs\`, which are the args as they appear in the function definition with type annotations
    specific to the programming language.
    Generate \`testInputs\`, five values to be passed into the function to test an output. Ensure the test inputs
    capture specific edge cases for the problem to verify a solution is correct. It should be the same five test
    cases for each programming language with correct syntax.
    Generate \`testOutputs\`, the corresponding five values, in the same order as testInputs, that a correct solution would produce.
    Generate \`returnType\` which is the return type of the function for a given programming language.
    Generate \`jsDocString\`, A JSON string where keys are parameter names and values are their types,
    and a "return" key for the return type. Example: { "s": "string", "nums": "Array<number>", "returns": "number" }

    For any generated field that depends on the programming language's syntax, ensure it is correct.

    Generate those instructions for these languages: ${Object.keys(languages)
      .map((langKey) => languages[langKey].name + languages[langKey].version)
      .join(", ")}.`,
      temperature: 1.8
    })
  );
  if (error) {
    return error;
  }
  if (
    !data ||
    Object.keys(data).length === 0 ||
    Object.values(data).length === 0
  ) {
    return new Error("No object returned");
  }
  return data.object;
}

export async function generateReferenceSolution(
  problemDescription: string,
  functionName: string,
  argNames: string[]
) {
  const { data, error } = await tryCatch(
    generateObject({
      model: google("gemini-2.5-pro"),
      schema: referenceSolutionSchema,
      system:
        "You are generating reference solutions for a programming problem in an online coding platform.",
      prompt: `Here is a programming problem: \`${problemDescription}\`
      Solve this problem in the following programming languages: ${Object.values(
        languages
      )
        .map((lang) => lang.name)
        .join(
          ", "
        )}. Write the solution within a function called ${functionName} that receives
        these arguments: ${argNames.join(", ")}. Ensure each solution is complete and syntactically correct
        for each language.
      `
    })
  );
  if (error) {
    return error;
  }
  if (
    !data ||
    Object.keys(data).length === 0 ||
    Object.values(data).length === 0
  ) {
    return new Error("No object generated from ai-sdk or LLM provider");
  }
  return data.object;
}

export async function generatePrerequisiteDataStructure(
  problemTitle: string,
  problemDescription: string
) {
  const { data, error } = await tryCatch(
    generateObject({
      model: google("gemini-2.5-pro"),
      schema: prerequisiteDataStructureSchema,
      system:
        "You are helping create a daily coding problem in the style of leetcode. You will fill out some parameters of the problem to be stored in a database.",
      prompt: `Problem Title: ${problemTitle}
      Problem Description: ${problemDescription}

      Generate \`prerequisiteDataStructure\` ONLY IF a custom type is required to understand the inputs or outputs (e.g., \`TreeNode\`, \`ListNode\). If not required, return an empty string for that language.

      Strict requirements:
      - Output must be a SINGLE minimal type definition per language when needed (class/struct/type alias) with only the essential fields (e.g., left, right, val/next, value).
      - DO NOT write or include any solution code, algorithms, helper methods, or functions unrelated to the type definition.
      - DO NOT include the problem's function, main method, tests, imports, printing, or comments explaining the solution.
      - Constructors are allowed only if idiomatic for the language; no other methods.
      - Use idiomatic field names per language. Prefer \`val\` or \`value\` consistently.
      - Wrap the entire definition in a single code block for each language.

      Examples of acceptable outputs (Python):
      \"\"\"
      class ListNode:
          def __init__(self, val: int = 0, next: 'ListNode | None' = None):
              self.val = val
              self.next = next
      \"\"\"

      If no prerequisite type is needed, return an empty string.

      Generate results for these languages: ${Object.keys(languages)
        .map((langKey) => languages[langKey].name + languages[langKey].version)
        .join(", ")}.`,
      temperature: 0.3
    })
  );
  if (error) {
    return error;
  }
  if (
    !data ||
    Object.keys(data).length === 0 ||
    Object.values(data).length === 0
  ) {
    return new Error("No object generated from ai-sdk or LLM provider");
  }

  return data.object;
}

// TODO: update this fn with new db schema for user submission flow
export async function gradeSolutionOutput(
  userTestCases: Record<string, string>,
  expectedTestCases: Problems["test_cases"],
  problemTitle: string,
  problemDescription: string
): Promise<GradeSolutionOutput | undefined> {
  try {
    const { object } = await generateObject({
      model: google("gemini-2.5-pro"),
      schema: gradeSolutionOutputSchema,
      system:
        "You are grading a solution to a coding problem for an online coding platform. You are given 5 test cases, and the solution's output to those 5 test cases. A test case is passed if the output is the same as the expected output, accounting for minor language-specific syntax differences.",
      prompt: `Here is the problem title: ${problemTitle}.
      Here is the problem description: ${problemDescription}.
      Here are the user's inputs and outputs: ${userTestCases}.
      Here are the expected inputs and outputs: ${expectedTestCases}.
      \`graded\`: Were you able to grade each output?
      \`hint\`: A hint to give the user without plainly giving them an answer. If their solution meets every test case, make the hint an empty string.
      \`isCorrect\` An array of booleans that state whether a test case was correctly met.
      Ensure you order this array in the same order as \`outputs\` and \`expectedOutputs\`, so their positions all correspond to each other!

      Keep in mind problems that expect an iterable as an output may not care about the order of items in the iterable.
      If the problem cares about the order, ensure you grade based on order. If it does not care about order, then you should not either when grading.`
    });
    return object;
  } catch (error) {
    console.error("Error grading solution output:", error);
    return undefined;
  }
}
