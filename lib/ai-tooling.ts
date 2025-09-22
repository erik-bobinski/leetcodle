import { languages } from "@/types/editor-languages";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { createServiceRoleClient } from "./supabase";

// get the 30 most recent problem titles from db
export async function getRecentProblemTitles(): Promise<string[] | []> {
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

export async function generateProblemDetails() {
  let result;
  try {
    const recentProblems = await getRecentProblemTitles();
    const { object } = await generateObject({
      model: google("gemini-2.5-pro"),
      schema: z.object({
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
          testArgs: z.object({
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
      }),
      prompt: `You are creating a daily coding problem in the style of leetcode with easy to medium difficulty.
      You can use various data structures such as arrays, strings, stacks, queues, heaps, trees, linked lists, etc. 
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
      cases for each programming language.
      Generate \`returnType\` which is the return type of the function for a given programming language. 
      Generate \`jsDocString\`, A JSON string where keys are parameter names and values are their types, 
      and a "return" key for the return type. Example: { "s": "string", "nums": "Array<number>", "returns": "number" }
  
      For any generated field that depends on the programming language's syntax, ensure it is correct.
  
      Generate those instructions for these languages: C++ 17, Go 1.21, Java 13.01, NodeJS 18.15, 
      TypeScript 5.0, Python 3.11, and Rust 1.70.`,
      temperature: 1.8
    });
    console.log(`recentProblems: ${recentProblems.join(", ")}`);
    console.log(`returned object: ${JSON.stringify(object, null, 2)}`);
    result = object;
  } catch (e) {
    if (e instanceof Error) console.error(e.message);
    else console.error(e);
  }

  return result;
}

export async function generateReferenceSolution(
  problem: string,
  functionName: string,
  argNames: string[]
) {
  const { object } = await generateObject({
    model: google("gemini-2.5-pro"),
    schema: z.object({
      cpp: z.string(),
      go: z.string(),
      java: z.string(),
      javascript: z.string(),
      python: z.string(),
      rust: z.string(),
      typescript: z.string()
    }),
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
}

export async function generateTestCasesSolutions(
  problemDescription: string,
  referenceSolution: string,
  testArgsPython: string[]
) {
  const { object } = await generateObject({
    model: google("gemini-2.5-pro"),
    schema: z.object({
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
    }),
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
}
