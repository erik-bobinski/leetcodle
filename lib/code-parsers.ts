/**
 * Inserts a print of user's solution with test-case passed in
 * @param langKey The programming language of the code
 * @param sourceCode The source code to parse
 * @param functionName The name of the function to test
 * @param testInputs The test case argument(s) to pass to the function
 * @param indent The number of spaces to use for indentation
 * @returns User's solution with an appended print statement of testArg passed into solution
 */
export default function parseCodeForSubmission(
  langKey: string,
  sourceCode: string,
  functionName: string,
  testInputs: string[],
  indent: number,
  returnType?: string
) {
  if (!testInputs || testInputs.length !== 5) {
    return new Error(
      `Expected exactly 5 test inputs, got ${testInputs?.length || 0}`
    );
  }

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
{{indent}}print(" | ".join([str(${functionName}(${testInputs[0]})), str(${functionName}(${testInputs[1]})), str(${functionName}(${testInputs[2]})), str(${functionName}(${testInputs[3]})), str(${functionName}(${testInputs[4]}))]))
`);

    case "cpp": {
      // Check if return type is a pointer to a custom type (needs toString() call)
      const isCppCustomType =
        returnType &&
        (returnType.includes("TreeNode") ||
          returnType.includes("ListNode") ||
          returnType.includes("Node"));

      if (isCppCustomType) {
        // For custom types, store results and call ->toString() with null check
        return replaceIndent(`#include <iostream>

${sourceCode}

int main() {
{{indent}}auto result0 = ${functionName}(${testInputs[0]});
{{indent}}auto result1 = ${functionName}(${testInputs[1]});
{{indent}}auto result2 = ${functionName}(${testInputs[2]});
{{indent}}auto result3 = ${functionName}(${testInputs[3]});
{{indent}}auto result4 = ${functionName}(${testInputs[4]});
{{indent}}std::cout << (result0 ? result0->toString() : "null")
{{indent}}          << " | " << (result1 ? result1->toString() : "null")
{{indent}}          << " | " << (result2 ? result2->toString() : "null")
{{indent}}          << " | " << (result3 ? result3->toString() : "null")
{{indent}}          << " | " << (result4 ? result4->toString() : "null")
{{indent}}          << std::endl;
{{indent}}return 0;
}`);
      }

      return replaceIndent(`#include <iostream>

${sourceCode}

int main() {
{{indent}}std::cout << ${functionName}(${testInputs[0]})
{{indent}}          << " | " << ${functionName}(${testInputs[1]})
{{indent}}          << " | " << ${functionName}(${testInputs[2]})
{{indent}}          << " | " << ${functionName}(${testInputs[3]})
{{indent}}          << " | " << ${functionName}(${testInputs[4]})
{{indent}}          << std::endl;
{{indent}}return 0;
}`);
    }

    case "go": {
      // Check if return type is a pointer to a custom type (needs String() call)
      const isGoCustomType =
        returnType &&
        (returnType.includes("TreeNode") ||
          returnType.includes("ListNode") ||
          returnType.includes("Node"));

      if (isGoCustomType) {
        // For custom types, call String() directly
        // The String() method should handle nil receiver internally
        return replaceIndent(`${sourceCode}

func main() {
{{indent}}fmt.Printf("%s | %s | %s | %s | %s\\n",
{{indent}}{{indent}}${functionName}(${testInputs[0]}).String(),
{{indent}}{{indent}}${functionName}(${testInputs[1]}).String(),
{{indent}}{{indent}}${functionName}(${testInputs[2]}).String(),
{{indent}}{{indent}}${functionName}(${testInputs[3]}).String(),
{{indent}}{{indent}}${functionName}(${testInputs[4]}).String(),
{{indent}})
}`);
      }

      return replaceIndent(`${sourceCode}

func main() {
{{indent}}fmt.Printf("%v | %v | %v | %v | %v\\n",
{{indent}}{{indent}}${functionName}(${testInputs[0]}),
{{indent}}{{indent}}${functionName}(${testInputs[1]}),
{{indent}}{{indent}}${functionName}(${testInputs[2]}),
{{indent}}{{indent}}${functionName}(${testInputs[3]}),
{{indent}}{{indent}}${functionName}(${testInputs[4]}),
{{indent}})
}`);
    }

    case "java":
      // For Java, the sourceCode should already contain the function in a Main class
      // We need to insert the main method before the closing brace of the class
      const mainMethod = replaceIndent(`
{{indent}}public static void main(String[] args) {
{{indent}}{{indent}}System.out.println(
{{indent}}{{indent}}{{indent}}${functionName}(${testInputs[0]}) + " | " +
{{indent}}{{indent}}{{indent}}${functionName}(${testInputs[1]}) + " | " +
{{indent}}{{indent}}{{indent}}${functionName}(${testInputs[2]}) + " | " +
{{indent}}{{indent}}{{indent}}${functionName}(${testInputs[3]}) + " | " +
{{indent}}{{indent}}{{indent}}${functionName}(${testInputs[4]})
{{indent}}{{indent}});
{{indent}}}
`);
      // Insert main method before the last closing brace (class closing)
      const lastBraceIndex = sourceCode.lastIndexOf("}");
      if (lastBraceIndex !== -1) {
        return sourceCode.slice(0, lastBraceIndex) + mainMethod + "\n}";
      }
      // Fallback: just append if we can't find the closing brace
      return sourceCode + mainMethod;

    case "javascript":
      // Check if return type is a custom type (needs explicit toString() call)
      const isJsCustomType =
        returnType &&
        (returnType.includes("TreeNode") ||
          returnType.includes("ListNode") ||
          returnType.includes("Node"));

      if (isJsCustomType) {
        // For custom types, store results and call toString() with null check
        return replaceIndent(`${sourceCode}

const result0 = ${functionName}(${testInputs[0]});
const result1 = ${functionName}(${testInputs[1]});
const result2 = ${functionName}(${testInputs[2]});
const result3 = ${functionName}(${testInputs[3]});
const result4 = ${functionName}(${testInputs[4]});
console.log([(result0 ? result0.toString() : "null"), (result1 ? result1.toString() : "null"), (result2 ? result2.toString() : "null"), (result3 ? result3.toString() : "null"), (result4 ? result4.toString() : "null")].join(" | "));`);
      }

      return replaceIndent(`${sourceCode}

console.log([${functionName}(${testInputs[0]}), ${functionName}(${testInputs[1]}), ${functionName}(${testInputs[2]}), ${functionName}(${testInputs[3]}), ${functionName}(${testInputs[4]})].join(" | "));`);

    case "typescript":
      // Check if return type is a custom type (needs explicit toString() call)
      const isTsCustomType =
        returnType &&
        (returnType.includes("TreeNode") ||
          returnType.includes("ListNode") ||
          returnType.includes("Node"));

      if (isTsCustomType) {
        // For custom types, store results and call toString() with null check
        return replaceIndent(`${sourceCode}

const result0 = ${functionName}(${testInputs[0]});
const result1 = ${functionName}(${testInputs[1]});
const result2 = ${functionName}(${testInputs[2]});
const result3 = ${functionName}(${testInputs[3]});
const result4 = ${functionName}(${testInputs[4]});
console.log([(result0 ? result0.toString() : "null"), (result1 ? result1.toString() : "null"), (result2 ? result2.toString() : "null"), (result3 ? result3.toString() : "null"), (result4 ? result4.toString() : "null")].join(" | "));`);
      }

      return replaceIndent(`${sourceCode}

console.log([${functionName}(${testInputs[0]}), ${functionName}(${testInputs[1]}), ${functionName}(${testInputs[2]}), ${functionName}(${testInputs[3]}), ${functionName}(${testInputs[4]})].join(" | "));`);

    case "rust":
      // Check if return type is a custom type (needs Display trait, not Debug)
      // Also check if it's wrapped in Option
      const isCustomType =
        returnType &&
        (returnType.includes("TreeNode") ||
          returnType.includes("ListNode") ||
          returnType.includes("Node"));

      const isOptionType = returnType && returnType.includes("Option");

      if (isCustomType && isOptionType) {
        // For Option<CustomType>, we need to unwrap and call Display on the inner value
        // Store results and handle None case
        return replaceIndent(`#![allow(non_snake_case)]

${sourceCode}

fn main() {
{{indent}}let result0 = ${functionName}(${testInputs[0]});
{{indent}}let result1 = ${functionName}(${testInputs[1]});
{{indent}}let result2 = ${functionName}(${testInputs[2]});
{{indent}}let result3 = ${functionName}(${testInputs[3]});
{{indent}}let result4 = ${functionName}(${testInputs[4]});
{{indent}}println!(
{{indent}}{{indent}}"{} | {} | {} | {} | {}",
{{indent}}{{indent}}match &result0 {
{{indent}}{{indent}}{{indent}}Some(node) => format!("{}", node),
{{indent}}{{indent}}{{indent}}None => "None".to_string(),
{{indent}}{{indent}}},
{{indent}}{{indent}}match &result1 {
{{indent}}{{indent}}{{indent}}Some(node) => format!("{}", node),
{{indent}}{{indent}}{{indent}}None => "None".to_string(),
{{indent}}{{indent}}},
{{indent}}{{indent}}match &result2 {
{{indent}}{{indent}}{{indent}}Some(node) => format!("{}", node),
{{indent}}{{indent}}{{indent}}None => "None".to_string(),
{{indent}}{{indent}}},
{{indent}}{{indent}}match &result3 {
{{indent}}{{indent}}{{indent}}Some(node) => format!("{}", node),
{{indent}}{{indent}}{{indent}}None => "None".to_string(),
{{indent}}{{indent}}},
{{indent}}{{indent}}match &result4 {
{{indent}}{{indent}}{{indent}}Some(node) => format!("{}", node),
{{indent}}{{indent}}{{indent}}None => "None".to_string(),
{{indent}}{{indent}}}
{{indent}});
}`);
      } else if (isCustomType) {
        // For custom types without Option, use {} format specifier
        return replaceIndent(`#![allow(non_snake_case)]

${sourceCode}

fn main() {
{{indent}}println!(
{{indent}}{{indent}}"{} | {} | {} | {} | {}",
{{indent}}{{indent}}${functionName}(${testInputs[0]}),
{{indent}}{{indent}}${functionName}(${testInputs[1]}),
{{indent}}{{indent}}${functionName}(${testInputs[2]}),
{{indent}}{{indent}}${functionName}(${testInputs[3]}),
{{indent}}{{indent}}${functionName}(${testInputs[4]})
{{indent}});
}`);
      }

      // For non-custom types, use {:?} format specifier
      return replaceIndent(`#![allow(non_snake_case)]

${sourceCode}

fn main() {
{{indent}}println!(
{{indent}}{{indent}}"{:?} | {:?} | {:?} | {:?} | {:?}",
{{indent}}{{indent}}${functionName}(${testInputs[0]}),
{{indent}}{{indent}}${functionName}(${testInputs[1]}),
{{indent}}{{indent}}${functionName}(${testInputs[2]}),
{{indent}}{{indent}}${functionName}(${testInputs[3]}),
{{indent}}{{indent}}${functionName}(${testInputs[4]})
{{indent}});
}`);

    default:
      throw new Error(`Unsupported language: ${langKey}`);
  }
}
