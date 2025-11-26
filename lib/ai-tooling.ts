import { generateObject, generateText } from "ai";
import { google } from "@ai-sdk/google";
import { db } from "@/drizzle";
import { desc } from "drizzle-orm";
import { languages } from "@/types/editor-languages";
import { tryCatch } from "@/lib/try-catch";
import { ProblemsTable } from "@/drizzle/schema";
import {
  problemDetailsBasicSchema,
  problemDetailsTemplateSchema,
  type PrerequisiteDataStructure,
  referenceSolutionSchema,
  prerequisiteDataStructureSchema,
  gradeSolutionOutputSchema,
  testInputsAllLanguagesSchema
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

  // Generate basic problem details (title, description, example_input, example_output)
  const { data: basicData, error: basicError } = await tryCatch(
    generateObject({
      model: google("gemini-2.5-pro"),
      schema: problemDetailsBasicSchema,
      system:
        "You are creating a daily coding problem in the style of leetcode with easy to medium difficulty.",
      prompt: `You can use various data structures in the problem such as arrays, strings, stacks, queues, heaps, trees, linked lists, etc.
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
    } Create a tree problem for today.`,
      temperature: 1.8
    })
  );
  if (basicError) {
    return basicError;
  }
  if (
    !basicData ||
    Object.keys(basicData).length === 0 ||
    Object.values(basicData).length === 0
  ) {
    return new Error("No object returned from first AI call");
  }

  // Generate template details (functionName, argNames, typedArgs, returnType, jsDocString)
  const { data: templateData, error: templateError } = await tryCatch(
    generateObject({
      model: google("gemini-2.5-pro"),
      schema: problemDetailsTemplateSchema,
      system:
        "You are creating a daily coding problem in the style of leetcode with easy to medium difficulty.",
      prompt: `Problem Title: ${basicData.object.title} Problem Description: ${basicData.object.description}

    Generate \`functionName\`, the name of the function(just the name of the function, no parenthesees, etc).
    Generate \`argNames\`, the names of all the args passed into the function to solve the problem.
    Generate \`typedArgs\`, which are the args as they appear in the function definition with type annotations
    specific to the programming language.
    Generate \`returnType\` which is the return type of the function for a given programming language.
    Generate \`jsDocString\`, A JSON string where keys are parameter names and values are their types,
    and a "return" key for the return type. Example: { "s": "string", "nums": "Array<number>", "returns": "number" }

    CRITICAL: The \`returnType\` must NEVER be void for any language. The function must always return a value
    that can be printed or compared. If a problem would naturally have a void return type (e.g., modifying
    a data structure in-place), reframe the problem so the function returns the modified structure or a
    result value instead. For example, instead of "void flatten(TreeNode* root)" that modifies in-place,
    use "TreeNode* flatten(TreeNode* root)" that returns the flattened tree.

    For any generated field that depends on the programming language's syntax, ensure it is correct.

    Generate those instructions for these languages: ${(
      Object.keys(languages) as Array<keyof typeof languages>
    )
      .map((langKey) => languages[langKey].name + languages[langKey].version)
      .join(", ")}.`,
      temperature: 0.5
    })
  );
  if (templateError) {
    return templateError;
  }
  if (
    !templateData ||
    Object.keys(templateData).length === 0 ||
    Object.values(templateData).length === 0
  ) {
    return new Error("No object returned from second AI call");
  }

  // Combine the results to match the original return shape
  return {
    title: basicData.object.title,
    description: basicData.object.description,
    example_input: basicData.object.example_input,
    example_output: basicData.object.example_output,
    template: templateData.object
  };
}

export async function generateReferenceSolution(
  problemDescription: string,
  functionName: string,
  argNames: string[],
  prerequisiteDataStructure?: PrerequisiteDataStructure["prerequisiteDataStructure"]
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
        )}. Write the solution as a standalone function called ${functionName} that receives
        these arguments: ${argNames.join(", ")}. Ensure each solution is complete and syntactically correct
        for each language.
        
        CRITICAL: The function must return a value (never void). If the problem would naturally modify a structure
        in-place, return the modified structure instead.
        
        CRITICAL: Do NOT wrap the function in a class (e.g., do NOT use "class Solution" or "impl Solution"). 
        Write the function as a standalone function/function declaration for each language:
        - C++: Write as a standalone function (not inside a class). Include necessary headers like #include <iostream> if needed.
        - Java: Write as a public static method inside a class named "Main" (e.g., "public class Main { public static ReturnType functionName(...) { ... } }")
        - Python: Write as a standalone function (not inside a class)
        - JavaScript/TypeScript: Write as a standalone function
        - Go: Write as a standalone function. MUST include "package main" at the very top of the code. Include necessary imports like "fmt" if needed.
        - Rust: Write as a standalone function (not inside an impl block)
        
        ${
          prerequisiteDataStructure
            ? `\n\nIMPORTANT: For each language, you MUST include the prerequisite data structure code at the TOP of your solution, before your solution function. Here are the prerequisite data structures for each language:\n${(
                Object.keys(prerequisiteDataStructure) as Array<
                  keyof typeof prerequisiteDataStructure
                >
              )
                .map((lang) => {
                  const code = prerequisiteDataStructure[lang];
                  if (!code || code.trim().length === 0) return null;
                  return `${lang}:\n\`\`\`${lang}\n${code}\n\`\`\``;
                })
                .filter(Boolean)
                .join(
                  "\n\n"
                )}\n\nFor each language, place the prerequisite code BEFORE your solution function. The prerequisite code should be included verbatim as provided above.`
            : ""
        }
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
  functionName: string,
  argNames: string[],
  typedArgs: Record<string, string[]>,
  returnType: Record<string, string>
) {
  const { data, error } = await tryCatch(
    generateObject({
      model: google("gemini-2.5-pro"),
      schema: prerequisiteDataStructureSchema,
      system:
        "You are helping create a daily coding problem in the style of leetcode. You will create some parameters of the problem to be stored in a database.",
      prompt: `Problem Title: ${problemTitle}
      Problem Description: ${problemDescription}
      Function Name: ${functionName}
      Argument Names: ${argNames.join(", ")}
      Typed Arguments by Language: ${JSON.stringify(typedArgs, null, 2)}
      Return Type by Language: ${JSON.stringify(returnType, null, 2)}

      Generate \`prerequisiteDataStructure\` ONLY IF a custom type is required to understand the inputs or outputs (e.g., \`TreeNode\`, \`ListNode\). If not required, return an empty string for that language.

      Strict requirements:
      - Output must be a SINGLE minimal type definition per language when needed (class/struct/type alias) with only the essential fields (e.g., left, right, val/next, value).
      - DO NOT write or include any solution code, algorithms, helper methods, or functions unrelated to the type definition.
      - DO NOT include the problem's function, main method, tests, imports, printing, or comments explaining the solution.
      - Constructors are allowed only if idiomatic for the language.
      - Use idiomatic field names per language. Prefer \`val\` or \`value\` consistently.
      - Wrap the entire definition in a single code block for each language.
      - Java: CRITICAL - Do NOT use the \`public\` keyword for the class. Use package-private (no access modifier) so it can be in the same file as the Main class. Java only allows one public class per file, and the file name must match the public class name.
      
      CRITICAL: You MUST include a string representation method for each data structure so that when printed, it displays a readable format instead of a memory address. The method should show the constructor-style representation (e.g., "TreeNode(6)" or "ListNode(1)"). Implement the appropriate method for each language:
      - Python: Include \`__repr__\` method that returns a string like "TreeNode(6)" or "ListNode(1)". For TreeNode, show the value: "TreeNode({self.val})". For ListNode, show the value: "ListNode({self.val})".
      - JavaScript/TypeScript: Include a \`toString()\` method that returns a string like "TreeNode(6)" or "ListNode(1)".
      - Java: Include a \`toString()\` method that returns a string like "TreeNode(6)" or "ListNode(1)". The class must be package-private (no \`public\` keyword).
      - C++: Include an \`operator<<\` overload or a \`toString()\` method. For simplicity, you can use a \`toString()\` method that returns std::string.
      - Go: Include a \`String()\` method that returns a string like "TreeNode(6)" or "ListNode(1)".
      - Rust: Include a \`Display\` trait implementation using \`fmt::Display\` that formats as "TreeNode(6)" or "ListNode(1)".

      Examples of acceptable outputs (Python):
      \"\"\"
      class ListNode:
          def __init__(self, val: int = 0, next: 'ListNode | None' = None):
              self.val = val
              self.next = next
          
          def __repr__(self):
              return f"ListNode({self.val})"
      \"\"\"
      
      Example for Java (note: NO public keyword):
      \"\"\"
      class TreeNode {
          int val;
          TreeNode left;
          TreeNode right;
          TreeNode() {}
          TreeNode(int val) { this.val = val; }
          TreeNode(int val, TreeNode left, TreeNode right) {
              this.val = val;
              this.left = left;
              this.right = right;
          }
          @Override
          public String toString() {
              return "TreeNode(" + this.val + ")";
          }
      }
      \"\"\"

      If no prerequisite type is needed, return an empty string.

      Generate \`testInputs\`, EXACTLY five test case inputs in Python syntax ONLY. You MUST generate exactly 5 test inputs, no more, no less. These will be programmatically converted to other languages.
      Use Python syntax for all test inputs:
      - For arrays/lists: Use Python list syntax like [1, 2, 3]
      - For TreeNode: Use constructor syntax like TreeNode(1, TreeNode(2), TreeNode(3)) or None for null
      - For ListNode: Use constructor syntax like ListNode(1, ListNode(2)) or None for null
      - For strings: Use Python string syntax like "hello" or 'world'
      - For numbers: Use plain numbers like 42 or 3.14
      - For booleans: Use True or False
      - For null values: Use None
      
      IMPORTANT: Generate ONLY Python syntax. Do NOT generate syntax for other languages. The same five test cases should be represented in Python format only.
      Ensure the test inputs capture specific edge cases for the problem to verify a solution is correct.

      Generate results for these languages: ${(
        Object.keys(languages) as Array<keyof typeof languages>
      )
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

  // Validate that exactly 5 test inputs were generated
  if (
    !data.object.testInputs?.python ||
    data.object.testInputs.python.length !== 5
  ) {
    return new Error(
      `Expected exactly 5 test inputs, got ${data.object.testInputs?.python?.length || 0}`
    );
  }

  return data.object;
}

/**
 * Generates test inputs for all languages based on Python test inputs
 * This ensures correct syntax for each language without manual conversion
 */
export async function generateTestInputsForAllLanguages(
  pythonTestInputs: string[],
  prerequisiteDataStructure?: PrerequisiteDataStructure["prerequisiteDataStructure"],
  typedArgs?: Record<string, string[]>
) {
  const { data, error } = await tryCatch(
    generateObject({
      model: google("gemini-2.5-pro"),
      schema: testInputsAllLanguagesSchema,
      system:
        "You are converting Python test inputs to equivalent test inputs in other programming languages. Ensure the syntax is correct for each language.",
      prompt: `You are given ${pythonTestInputs.length} Python test inputs that need to be converted to equivalent syntax for other programming languages.

CRITICAL: You MUST generate exactly ${pythonTestInputs.length} test inputs for each language. The number of test inputs for each language must match the number of Python test inputs provided.

Python Test Inputs:
${pythonTestInputs.map((input, idx) => `${idx + 1}. ${input}`).join("\n")}

${
  prerequisiteDataStructure
    ? `Prerequisite Data Structures for each language:
${(
  Object.keys(prerequisiteDataStructure) as Array<
    keyof typeof prerequisiteDataStructure
  >
)
  .map((lang) => {
    const code = prerequisiteDataStructure[lang];
    if (!code || code.trim().length === 0) return null;
    return `${lang}:\n\`\`\`${lang}\n${code}\n\`\`\``;
  })
  .filter(Boolean)
  .join("\n\n")}`
    : ""
}

${
  typedArgs
    ? `Typed Arguments by Language (for context on parameter types):
${JSON.stringify(typedArgs, null, 2)}`
    : ""
}

CRITICAL Requirements:
- Convert each Python test input to the equivalent syntax for each language (cpp, go, java, javascript, rust, typescript)
- For Python, keep the original inputs as-is
- Ensure the syntax is correct and will compile/run in each language
- For TreeNode/ListNode: Use the correct constructor syntax for each language
  - C++: Use \`new TreeNode(val, left, right)\` with \`nullptr\` for null. All TreeNode calls MUST have exactly 3 arguments.
  - Java: Use \`new TreeNode(val, left, right)\` with \`null\` for null
  - JavaScript/TypeScript: Use \`new TreeNode(val, left, right)\` with \`null\` for null
  - Go: Use struct literal syntax \`&TreeNode{Val: val, Left: left, Right: right}\` with \`nil\` for null
  - Rust: Use \`Some(Rc::new(RefCell::new(TreeNode { val, left, right })))\` with \`None\` for null
- For arrays/lists: Use the correct syntax for each language
- For strings: Use the correct quote style and syntax
- For numbers/booleans: Use the correct literal syntax
- Maintain the same logical values across all languages - only the syntax should differ

Generate test inputs for these languages: ${(
        Object.keys(languages) as Array<keyof typeof languages>
      )
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

  // Validate that all languages have exactly the same number of test inputs as Python
  const expectedCount = pythonTestInputs.length;
  const langKeys = Object.keys(languages) as Array<keyof typeof languages>;
  const errors: string[] = [];

  for (const lang of langKeys) {
    const count = data.object[lang]?.length || 0;
    if (count !== expectedCount) {
      errors.push(`${lang}: expected ${expectedCount}, got ${count}`);
    }
  }

  if (errors.length > 0) {
    return new Error(
      `Test input count mismatch for ${errors.length} language(s): ${errors.join("; ")}`
    );
  }

  return data.object;
}

export async function gradeSolutionOutput(
  userTestCases: Record<string, string>,
  expectedTestCases: Record<string, string>,
  problemTitle: string,
  problemDescription: string
) {
  // Convert objects to ordered arrays to preserve test case order
  const testCasesArray = Object.keys(userTestCases).map((input, index) => ({
    testCaseNumber: index + 1,
    input: input,
    userOutput: userTestCases[input],
    expectedOutput: expectedTestCases[input] || ""
  }));

  const { data: objectData, error: objectError } = await tryCatch(
    generateObject({
      model: google("gemini-2.5-flash"),
      schema: gradeSolutionOutputSchema,
      system:
        "You are grading a solution to a coding problem for an online coding platform. You are given 5 test cases, and the solution's output to those 5 test cases. A test case is passed if the output is the same as the expected output, accounting for minor language-specific syntax differences.",
      prompt: `Here is the problem title: ${problemTitle}.
      Here is the problem description: ${problemDescription}.
      
      Here are the test cases in order (testCaseNumber 1 through 5):
      ${JSON.stringify(testCasesArray, null, 2)}
      
      \`graded\`: Were you able to grade each output?
      \`hint\`: A hint to give the user without plainly giving them an answer. If their solution meets every test case, make the hint an empty string.
      \`isCorrect\`: An array of exactly 5 booleans that state whether each test case was correctly met. The array must be in the same order as the test cases above (index 0 = testCaseNumber 1, index 1 = testCaseNumber 2, etc.). Each boolean should be true if userOutput exactly matches expectedOutput (accounting for minor formatting differences), false otherwise.

      Keep in mind problems that expect an iterable as an output may not care about the order of items in the iterable.
      If the problem cares about the order, ensure you grade based on order. If it does not care about order, then you shouldn't either when grading.`
    })
  );
  if (objectError instanceof Error) {
    return objectError;
  }
  if (objectData === null) {
    return new Error("No object returned from gradeSolutionOutput");
  }
  return objectData.object;
}

/**
 * Uses AI to fix potential runtime/compilation errors in executable code before submission to Judge0
 * This handles issues like trying to print complex types (vectors, pointers) directly,
 * undefined variables, void return types, etc.
 */
export async function fixExecutableCode(
  executableCode: string,
  language: string,
  returnType?: string
): Promise<string | Error> {
  const { data, error } = await tryCatch(
    generateText({
      model: google("gemini-2.5-pro"),
      system:
        "You are a code fixer that corrects compilation and runtime errors in executable code. Fix issues like trying to print complex types directly, undefined variables, missing imports, and other compilation errors.",
      prompt: `Fix the following ${language} code to ensure it compiles and runs correctly. The code is meant to execute test cases and print the results.

Language: ${language}
${returnType ? `Return Type: ${returnType}` : ""}

Common issues to fix:
- If trying to print std::vector directly, create a helper function to print it as [1,2,3]
- If trying to print void return types, modify to return and print a value instead
- Replace undefined variables with appropriate null/None/nil values for the language
- Ensure all variables are properly declared
- Fix any syntax errors
- Ensure the output format is comma-separated values that can be parsed

Return ONLY the fixed code, no explanations or markdown formatting. The code should be ready to compile and run.

Original code:
\`\`\`${language}
${executableCode}
\`\`\`

Fixed code:`
    })
  );

  if (error) {
    return error instanceof Error ? error : new Error(String(error));
  }

  if (!data || !data.text) {
    return new Error(`No fixed code returned from AI for ${language}`);
  }

  // Extract code from markdown code blocks if present
  let fixedCode = data.text.trim();
  const codeBlockMatch = fixedCode.match(
    /```(?:${language}|[\s\S]*?)?\n([\s\S]*?)```/
  );
  if (codeBlockMatch) {
    fixedCode = codeBlockMatch[1].trim();
  }

  return fixedCode;
}
