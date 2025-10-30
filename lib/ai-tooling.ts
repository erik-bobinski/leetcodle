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
  prerequisiteDataStructureSchema
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
  problemDescription: string,
  referenceSolutions: Record<string, string>
) {
  const { data, error } = await tryCatch(
    generateObject({
      model: google("gemini-2.5-pro"),
      schema: prerequisiteDataStructureSchema,
      system:
        "You are helping create a daily coding problem in the style of leetcode. You will fill out some parameters of the problem to be stored in a database.",
      prompt: `Problem Title: ${problemTitle}, Problem Description: ${problemDescription}, Example Solutions: ${referenceSolutions}

      Generate \`prerequisiteDataStructure\`, a definition for a prerequisite data structure that the problem uses:
        for example in python, a TreeNode class with a self.left, self.right, and self.value if the problem's function has an input or output with a tree,
        or a ListNode for a Linked List problem. You MUST include this field if the solution's function definition takes it as arguments or returns it.
        Only generate this field if the user needs to know it for the problem, else omit the field.

        For any generated field that depends on the programming language's syntax, ensure it is correct.

        Follow those instructions to generate data for these languages: ${Object.keys(
          languages
        )
          .map(
            (langKey) => languages[langKey].name + languages[langKey].version
          )
          .join(", ")}.`
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
