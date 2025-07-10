export interface ProblemDetails {
  title: string;
  description: string;
  exampleInput: string;
  exampleOutput: string;
}

export interface ReferenceSolution {
  [languageName: string]: string;
}
