export interface ProblemDetails {
  title: string;
  description: string;
  example_input: string;
  example_output: string;
  starter_code: {
    [lang: string]: string;
  };
}

export interface ReferenceSolution {
  [languageName: string]: string;
}

export interface Problem {
  title: string;
  description: string;
  example_input: string;
  example_output: string;
  [languageName: string]: string;
  activeDate: string;
}
