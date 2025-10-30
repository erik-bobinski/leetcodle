// TODO: Refactor cron to use tryCatch wrapper and Drizzle Schema

import { languages } from "@/types/editor-languages";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { createServiceRoleClient } from "./supabase";
import {
  problemDetailsSchema,
  referenceSolutionSchema,
  prerequisiteDataStructureSchema,
  testCasesSolutionsSchema,
  gradeSolutionOutputSchema,
  type ProblemDetails,
  type ReferenceSolution,
  type PrerequisiteDataStructure,
  type TestCasesSolutions,
  type GradeSolutionOutput,
  type Problems
} from "@/types/database";

async function getRecentProblemTitles(): Promise<string[] | []> {
  const supabase = createServiceRoleClient();

  try {
    const { data, error } = await supabase
      .from("problems")
      .select("title")
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      console.error("Error fetching recent problem titles:", error);
      return [];
    }

    return data?.map((problem) => problem.title) || [];
  } catch (error) {
    console.error("Error in getRecentProblemTitles:", error);
    return [];
  }
}

export async function generateProblemDetails(): Promise<
  ProblemDetails | undefined
> {
  try {
    const recentProblems = await getRecentProblemTitles();
    const { object } = await generateObject({
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

      Ensure you do not generate a problem that has a similar description or uses data structures
      frequently used in these 30 previous problems (i.e. don't create a problem that revolves around a
      string input if they are common in these 30 problems): ${recentProblems.join(", ")}.

      Generate \`functionName\`, the name of the function(just the name of the function, no parenthesees, etc).
      Generate \`argNames\`, the names of all the args passed into the function to solve the problem.
      Generate \`typedArgs\`, which are the args as they appear in the function definition with type annotations
      specific to the programming language.
      Generate \`testArgs\`, five values to be passed into the function to test an output. Ensure the test cases
      capture specific edge cases for the problem to verify a solution is correct. It should be the same five test
      cases for each programming language, but ensure.
      Generate \`returnType\` which is the return type of the function for a given programming language.
      Generate \`jsDocString\`, A JSON string where keys are parameter names and values are their types,
      and a "return" key for the return type. Example: { "s": "string", "nums": "Array<number>", "returns": "number" }

      For any generated field that depends on the programming language's syntax, ensure it is correct.

      Generate those instructions for these languages: ${Object.keys(languages)
        .map((langKey) => languages[langKey].name + languages[langKey].version)
        .join(", ")}.`,
      temperature: 1.8
    });
    return object;
  } catch (e) {
    if (e instanceof Error) console.error(e.message);
    else console.error(e);
    return undefined;
  }
}

export async function generateReferenceSolution(
  problem: string,
  functionName: string,
  argNames: string[]
): Promise<ReferenceSolution | undefined> {
  try {
    const { object } = await generateObject({
      model: google("gemini-2.5-pro"),
      schema: referenceSolutionSchema,
      prompt: `Here is a programming problem: \`${problem}\`
      Solve this problem in the following programming languages: ${Object.values(
        languages
      )
        .map((lang) => lang.name)
        .join(
          ", "
        )}. Write the solution within a function called ${functionName} that receives
        these arguments: ${argNames.join(", ")}. Ensure the solution is complete and syntactically correct
        for each language.
      `
    });

    return object;
  } catch (error) {
    console.error("Error generating reference solution:", error);
    return undefined;
  }
}

export async function generatePrerequisiteDataStructure(
  problemTitle: string,
  problemDescription: string,
  referenceSolutions: Record<string, string>
): Promise<PrerequisiteDataStructure | undefined> {
  try {
    const { object } = await generateObject({
      model: google("gemini-2.5-pro"),
      schema: prerequisiteDataStructureSchema,
      system:
        "You are helping create a daily coding problem in the style of leetcode. You will fill out some parameters of the problem to be stored in a database.",
      prompt: `Problem Title: ${problemTitle}, Problem Description: ${problemDescription}, Example Solutions: ${referenceSolutions}

      Generate \`prerequisiteDataStructure\`, a definition for a prerequisite data structure that the problem uses:
        for example in python, a TreeNode class with a self.left, self.right, and self.value if the problem's function has an input or output with a tree,
        or a ListNode for a Linked List problem. You MUST include this field especially if the solution function definition takes it as arguments or returns it.
        Only generate this field if the user needs to know it for the problem, else omit the field.

        For any generated field that depends on the programming language's syntax, ensure it is correct.

        Generate those instructions for these languages: ${Object.keys(
          languages
        )
          .map(
            (langKey) => languages[langKey].name + languages[langKey].version
          )
          .join(", ")}.`
    });

    return object;
  } catch (error) {
    console.error("Error generating prerequisite data structure:", error);
    return undefined;
  }
}

export async function generateTestCasesSolutions(
  problemDescription: string,
  referenceSolution: string,
  testArgsPython: string[]
): Promise<TestCasesSolutions | undefined> {
  try {
    const { object } = await generateObject({
      model: google("gemini-2.5-pro"),
      schema: testCasesSolutionsSchema,
      prompt: `You will be given a coding problem, a reference solution in Python, and 5 test cases.
      For each test case: copy the function exactly. Within a print statement call the function with
      the test case passed into it. Therefore, the program can be run to verify the standard output.
      Ensure the entire program is syntactically correct and has consistent indentation.

      The coding problem: ${problemDescription}

      The reference solution : \`${referenceSolution}\`

      The test cases: ${testArgsPython}

      Example format (replace 'solution' with the actual function name from the reference):
      {
        "testCase1": {
          "input": "world",
          "code": "def solution(str):\\n    return 'hello ' + str\\nprint(solution('world'))"
        },
        "testCase2": {
          "input": "universe",
          "code": "def solution(nums):\\n    return 'hello ' + str(nums)\\nprint(solution('universe'))"
        },
        "testCase3": {
          "input": "friend",
          "code": "def solution(name):\\n    return 'hello ' + name\\nprint(solution('friend'))"
        },
        "testCase4": {
          "input": "planet",
          "code": "def solution(place):\\n    return 'hello ' + place\\nprint(solution('planet'))"
        },
        "testCase5": {
          "input": "everyone",
          "code": "def solution(group):\\n    return 'hello ' + group\\nprint(solution('everyone'))"
        }
      }`
    });

    return object;
  } catch (error) {
    console.error("Error generating test cases solutions:", error);
    return undefined;
  }
}

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
