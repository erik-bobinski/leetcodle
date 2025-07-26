export interface ProblemDetails {
  title: string;
  description: string;
  example_input: string;
  example_output: string;
}

export interface ReferenceSolution {
  [languageName: string]: string;
}

export interface Problem {
  problemDetails: ProblemDetails;
  referenceSolution: ReferenceSolution;
  activeDate: string;
}
