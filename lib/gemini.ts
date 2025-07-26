import { GoogleGenAI } from "@google/genai";
import { languages } from "@/types/editor-languages";
import type {
  ProblemDetails,
  ReferenceSolution
} from "@/types/problem-generation";

// Helper function to clean AI response and extract JSON
function extractJsonFromResponse(content: string): string {
  // Remove markdown code blocks if present
  let cleaned = content.trim();

  // Remove ```json and ``` markers
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "");
  }
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "");
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.replace(/\s*```$/, "");
  }

  return cleaned.trim();
}

export async function generateProblemDetails(): Promise<ProblemDetails> {
  const ai = new GoogleGenAI({});
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `You are creating a daily coding problem in the style of leetcode
    with easy to medium difficulty. Generate the problem's title, description, an example input, 
    and its corresponding example output. For all code terms, use inline markdown code formatting 
    (wrap the term in backticks, etc). 

    IMPORTANT: Return ONLY valid JSON without any markdown formatting, code blocks, or extra text.
    Return your response in this exact JSON format:
    {
      "title": "Title goes here",
      "description": "Description goes here", 
      "exampleInput": "Example input goes here",
      "exampleOutput": "Example output goes here"
    }`,
    config: {
      temperature: 1.5
    }
  });

  const content = response.text;
  if (!content) {
    console.error("No content received from AI model");
    throw new Error("No content received from AI model");
  }

  const cleanedContent = extractJsonFromResponse(content);
  return JSON.parse(cleanedContent) as ProblemDetails;
}

export async function generateReferenceSolution(
  problem: string
): Promise<ReferenceSolution> {
  const ai = new GoogleGenAI({});
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Here is a programming problem: \`${problem}\`
    Solve this problem in the following programming languages: ${Object.values(
      languages
    )
      .map((lang) => lang.name)
      .join(
        ", "
      )}. Write the solution within a function called solution. Ensure the code 
      can be run if I were to copy and paste it into a blank file. 

      IMPORTANT NOTES:
      - For Python: Use Python 3.8 compatible syntax. Use 'List' instead of 'list' for type hints, 
        and import 'List' from 'typing' if needed. Avoid using 'list[str]' syntax.
      - For all languages: Ensure the code is complete and runnable.

      IMPORTANT: Return ONLY valid JSON without any markdown formatting, code blocks, or extra text.
      Return the solutions in this exact JSON format:
      {
        "python": "Solution goes here",
        "go": "Solution goes here",
        "javascript": "Solution goes here",
        "java": "Solution goes here",
        "cpp": "Solution goes here",
        "rust": "Solution goes here"
      }
    `
  });

  const content = response.text;
  if (!content) {
    console.error("No content received from AI model");
    throw new Error("No content received from AI model");
  }

  const cleanedContent = extractJsonFromResponse(content);
  return JSON.parse(cleanedContent) as ReferenceSolution;
}

export async function generateTestCasesSolutions(
  problemDescription: string,
  referenceSolution: string
): Promise<Record<string, string>> {
  const ai = new GoogleGenAI({});
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `You are writing 5 test cases for the following coding problem: ${problemDescription}
    Here is an efficient solution to the problem in Python: \`${referenceSolution}\`
    Provide 5 test case inputs to the solution that captures the unique edge-cases of this problem to 
    ensure a solution is correct. Respond with JSON where the key is the test case and the value is the 
    source code for the efficient solution with the test case passed into it as input, so the code is ready 
    to be run when I receive it. IMPORTANT: You MUST print the result of calling the solution function 
    so that the output can be captured. There should be 5 test cases in the JSON response. 

    IMPORTANT NOTES:
    - For Python: Use Python 3.8 compatible syntax. Use 'List' instead of 'list' for type hints, 
      and import 'List' from 'typing' if needed. Avoid using 'list[str]' syntax.
    - Ensure all code is complete and runnable.

    IMPORTANT: Return ONLY valid JSON without any markdown formatting, code blocks, or extra text.
    Here is an example JSON response:
    {
      "world": "def solution(str):\\n    return 'hello ' + str\\nprint(solution('world'))",
      "python": "def solution(nums):\\n    return 'hello ' + str(nums)\\nprint(solution('python'))"
    }`
  });

  const content = response.text;
  if (!content) {
    console.error("No content received from AI model");
    throw new Error("No content received from AI model");
  }

  const cleanedContent = extractJsonFromResponse(content);
  return JSON.parse(cleanedContent) as Record<string, string>;
}
