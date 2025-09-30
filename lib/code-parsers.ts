/**
 * Inserts a print of user's solution with test-case passed in
 * @param langKey The programming language of the code
 * @param sourceCode The source code to parse
 * @param functionName The name of the function to test
 * @param testArgs The test case argument(s) to pass to the function
 * @param indent The number of spaces to use for indentation
 * @returns User's solution with an appended print statement of testArg passed into solution
 */
export default function parseUserCodeForSubmission(
  langKey: string,
  sourceCode: string,
  functionName: string,
  testArgs: string[],
  indent: number
) {
  // Helper function to replace {{indent}} placeholders with spaces
  function replaceIndent(code: string): string {
    const spaces = " ".repeat(indent);
    return code.replace(/\{\{indent\}\}/g, spaces);
  }

  switch (langKey) {
    case "python":
      return replaceIndent(`from typing import (List, Tuple, Dict, Set, Optional, Union, Callable, Any, Iterable, TypeVar, Generic)

${sourceCode}

if __name__ == "__main__":
{{indent}}solution = Solution()
{{indent}}print(solution.${functionName}(${testArgs}))`);

    case "cpp":
      return replaceIndent(`${sourceCode}

int main() {
{{indent}}Solution solution;
{{indent}}std::cout << solution.${functionName}(${testArgs}) << std::endl;
{{indent}}return 0;
}`);

    case "go":
      return replaceIndent(`${sourceCode}

func main() {
{{indent}}solution := Solution{}
{{indent}}fmt.Println(solution.${functionName}(${testArgs}))
}`);

    case "java":
      return replaceIndent(`${sourceCode}

public static void main(String[] args) {
{{indent}}Solution solution = new Solution();
{{indent}}System.out.println(solution.${functionName}(${testArgs}));
}`);

    case "javascript":
      return replaceIndent(`${sourceCode}

console.log(${functionName}(${testArgs}));`);

    case "typescript":
      return replaceIndent(`${sourceCode}

console.log(${functionName}(${testArgs}));`);

    case "rust":
      return replaceIndent(`${sourceCode}

fn main() {
{{indent}}let solution = Solution;
{{indent}}println!("{:?}", solution.${functionName}(${testArgs}));
}`);

    default:
      throw new Error(`Unsupported language: ${langKey}`);
  }
}
