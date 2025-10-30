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
{{indent}}print(
{{indent}}{{indent}}solution.${functionName}(${testArgs[0]}),
{{indent}}{{indent}}solution.${functionName}(${testArgs[1]}),
{{indent}}{{indent}}solution.${functionName}(${testArgs[2]}),
{{indent}}{{indent}}solution.${functionName}(${testArgs[3]}),
{{indent}}{{indent}}solution.${functionName}(${testArgs[4]}),
{{indent}}{{indent}}sep=", "
{{indent}})
`);

    case "cpp":
      return replaceIndent(`#include <iostream>

${sourceCode}

int main() {
{{indent}}Solution solution;
{{indent}}std::cout << solution.${functionName}(${testArgs[0]})
{{indent}}          << ", " << solution.${functionName}(${testArgs[1]})
{{indent}}          << ", " << solution.${functionName}(${testArgs[2]})
{{indent}}          << ", " << solution.${functionName}(${testArgs[3]})
{{indent}}          << ", " << solution.${functionName}(${testArgs[4]})
{{indent}}          << std::endl;
{{indent}}return 0;
}`);

    case "go":
      return replaceIndent(`${sourceCode}

func main() {
{{indent}}solution := Solution{}
{{indent}}fmt.Printf("%v, %v, %v, %v, %v\n",
{{indent}}{{indent}}solution.${functionName}(${testArgs[0]}),
{{indent}}{{indent}}solution.${functionName}(${testArgs[1]}),
{{indent}}{{indent}}solution.${functionName}(${testArgs[2]}),
{{indent}}{{indent}}solution.${functionName}(${testArgs[3]}),
{{indent}}{{indent}}solution.${functionName}(${testArgs[4]})
{{indent}})
}`);

    case "java":
      return replaceIndent(`${sourceCode}

public static void main(String[] args) {
{{indent}}Solution solution = new Solution();
{{indent}}System.out.println(
{{indent}}{{indent}}solution.${functionName}(${testArgs[0]}) + ", " +
{{indent}}{{indent}}solution.${functionName}(${testArgs[1]}) + ", " +
{{indent}}{{indent}}solution.${functionName}(${testArgs[2]}) + ", " +
{{indent}}{{indent}}solution.${functionName}(${testArgs[3]}) + ", " +
{{indent}}{{indent}}solution.${functionName}(${testArgs[4]})
{{indent}});
}`);

    case "javascript":
      return replaceIndent(`${sourceCode}

console.log([${functionName}(${testArgs[0]}), ${functionName}(${testArgs[1]}), ${functionName}(${testArgs[2]}), ${functionName}(${testArgs[3]}), ${functionName}(${testArgs[4]})].join(", "));`);

    case "typescript":
      return replaceIndent(`${sourceCode}

console.log([${functionName}(${testArgs[0]}), ${functionName}(${testArgs[1]}), ${functionName}(${testArgs[2]}), ${functionName}(${testArgs[3]}), ${functionName}(${testArgs[4]})].join(", "));`);

    case "rust":
      return replaceIndent(`${sourceCode}

fn main() {
{{indent}}let solution = Solution;
{{indent}}println!(
{{indent}}{{indent}}"{:?}, {:?}, {:?}, {:?}, {:?}",
{{indent}}{{indent}}solution.${functionName}(${testArgs[0]}),
{{indent}}{{indent}}solution.${functionName}(${testArgs[1]}),
{{indent}}{{indent}}solution.${functionName}(${testArgs[2]}),
{{indent}}{{indent}}solution.${functionName}(${testArgs[3]}),
{{indent}}{{indent}}solution.${functionName}(${testArgs[4]})
{{indent}});
}`);

    default:
      throw new Error(`Unsupported language: ${langKey}`);
  }
}
