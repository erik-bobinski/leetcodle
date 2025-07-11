import { GoogleGenAI } from "@google/genai";
import { languages } from "@/types/editor-languages";
import type {
  ProblemDetails,
  ReferenceSolution
} from "@/types/problem-generation";

export async function generateProblemDetails(): Promise<ProblemDetails> {
  const ai = new GoogleGenAI({});
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `You are creating a daily coding problem in the style of leetcode
    with easy to medium difficulty. Generate the problem's title, description, an example input, 
    and its corresponding example output. For all code terms, use inline markdown code formatting 
    (wrap the term in backticks, etc). Return your response in JSON format as follows: {
    title: "Title goes here",
    description: "Description goes here",
    exampleInput: "Example input goes here",
    exampleOutput: "Example output goes here"
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

  return JSON.parse(content) as ProblemDetails;
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
      )}. Preferrably write the solution within a solution function unless otherwise 
      is necessary. Return the solutions in the following JSON format: {
      Python: "Solution goes here",
      Go: "Solution goes here",
      etc...
      }
    `
  });

  const content = response.text;
  if (!content) {
    console.error("No content received from AI model");
    throw new Error("No content received from AI model");
  }
  return JSON.parse(content) as ReferenceSolution;
}

export async function generateTestCasesInputs(
  problemDescription: string,
  referenceSolution: ReferenceSolution
) {
  const ai = new GoogleGenAI({});
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `You are writing 5 test cases for the following coding problem: ${problemDescription}
    Here is an efficient solution to the problem in Python: \`${referenceSolution.Python}\`
    Provide 5 test case inputs to a solution that capture the unique edge-cases of this problem to 
    ensure a solution is correct. Respond with JSON in the following structure, where the key is an 
    index for the input, and the value is the test input itself: {
    0: "nums = [1, 3, 5, 7], n = 3",
    1: ""
    }`
  });
  const content = response.text;
  if (!content) {
    console.error("No content received from AI model");
    throw new Error("No content received from AI model");
  }
  return content;
}

export async function generateHints() {
  const ai = new GoogleGenAI({});
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Gotta come up with a prompt to put here..."
  });
  return response;
}
