import { languages } from "@/types/editor-languages";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

export async function generateProblemDetails() {
  const { object } = await generateObject({
    model: google("gemini-2.5-pro"),
    schema: z.object({
      title: z.string(),
      description: z.string(),
      example_input: z.string(),
      example_output: z.string(),
      template: z.object({
        functionName: z.string(),
        args: z.array(z.string()),
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
        jsDocString: z.record(z.string(), z.string())
      })
    }),
    prompt: `You are creating a daily coding problem in the style of leetcode
    with easy to medium difficulty. Generate the problem's title, description, an example input, 
    and its corresponding example output. Also generate the name of the 
    function(just the name of the function, no parenthesees, etc), the name of the args when passing them into 
    said function with no types on them, testArgs which are the args as they appear in the 
    function definition with type annotations, and returnType which is the return type of the function for a given programming language. 
    Generate those instructions for these languages: C++ 17, 
    Go 1.21, Java 13.01, NodeJS 18.15, TypeScript 5.0, Python 3.11, and Rust 1.70. 
    
    For JavaScript JSDoc generation, also provide:
    - jsDocString: An object where keys are parameter names and values are their types, plus a "return" key for the return type
    - Example: { "s": "string", "nums": "Array<number>", "returns": "number" }
    
    IMPORTANT: In the description, example_input, and example_output fields, wrap all code terms, 
    variable names, function names, and programming concepts in markdown backticks (\`code\`). 
    For example: "Given a string \`s\`" or "Return the index of the first \`non-repeating\` character".
    Do NOT use HTML tags like <code> or <pre>. Use only markdown backticks for code formatting.
    }`
  });

  return object;
}

export async function generateReferenceSolution(
  problem: string,
  functionName: string,
  args: string[]
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
      these arguments: ${args.join(", ")}. Ensure the code can be run if I were to 
      copy and paste it into a blank file.
    `
  });

  return object;
}

export async function generateTestCasesSolutions(
  problemDescription: string,
  referenceSolution: string
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
    prompt: `You are writing 5 test cases for the following coding problem: ${problemDescription}
    Here is the reference solution in Python: \`${referenceSolution}\`
    
    Your task is to create 5 test cases that use this exact reference solution. Each test case should:
    1. Include the complete reference solution function
    2. Call the function with different test inputs
    3. Print the result
    
    CRITICAL REQUIREMENTS:
    - Copy the reference solution function exactly as provided
    - Add a print statement that calls the function with test input
    - Use proper Python formatting with newlines (\\n) and indentation (4 spaces)
    - Each test case should be complete, runnable Python code
    - The code must print the result of calling the solution function
    - EVERY line of code must be separated by \\n
    - EVERY indented line must start with 4 spaces
    - The function definition and all its contents must be properly formatted with \\n and indentation
    
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
