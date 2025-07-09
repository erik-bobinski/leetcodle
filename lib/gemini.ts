import { GoogleGenAI } from "@google/genai";

export async function generateProblemDetails() {
  const ai = new GoogleGenAI({});
  const response = await ai.models.generateContent({
    model: "gemini-2.5.flash",
    contents: `You are creating a daily coding problem in the style of leetcode, 
    with easy to medium difficulty. Generate the problem's title, description, an example input, 
    and its corresponding example output. For all code terms, use inline markdown code formatting 
    (wrap the term in backticks, etc). Return your response in JSON format as follows: {
    title: "Title goes here",
    description: "Description goes here.",
    exampleInput: "Example input goes here",
    exampleOutput: "Example output goes here"
    }`,
    config: {
      temperature: 1.5
    }
  });
  return response;
}

export async function generateReferenceSolution() {
  const ai = new GoogleGenAI({});
  const response = await ai.models.generateContent({
    model: "gemini-2.5.flash",
    contents: "Gotta come up with a prompt to put here..."
  });
  return response;
}

export async function generateTestCases() {
  const ai = new GoogleGenAI({});
  const response = await ai.models.generateContent({
    model: "gemini-2.5.flash",
    contents: "Gotta come up with a prompt to put here..."
  });
  return response;
}

export async function generateHints() {
  const ai = new GoogleGenAI({});
  const response = await ai.models.generateContent({
    model: "gemini-2.5.flash",
    contents: "Gotta come up with a prompt to put here..."
  });
  return response;
}
