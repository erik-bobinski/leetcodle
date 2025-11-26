/**
 * Converts Python-style test inputs to other programming languages
 * This ensures consistency and correctness across all languages
 */

export function convertTestInputs(
  pythonInputs: string[],
  targetLanguage: string,
  hasTreeNode: boolean = false,
  hasListNode: boolean = false,
  typedArgs?: string[]
): string[] {
  return pythonInputs.map((input, index) => {
    if (input.trim() === "None" || input.trim() === "null") {
      return getNullValue(targetLanguage);
    }

    // Handle TreeNode/ListNode constructors
    if (hasTreeNode && input.includes("TreeNode")) {
      return convertTreeNode(input, targetLanguage);
    }
    if (hasListNode && input.includes("ListNode")) {
      return convertListNode(input, targetLanguage);
    }

    // Handle arrays/lists
    if (input.trim().startsWith("[") && input.trim().endsWith("]")) {
      return convertArray(input, targetLanguage);
    }

    // Handle strings
    if (
      (input.startsWith('"') && input.endsWith('"')) ||
      (input.startsWith("'") && input.endsWith("'"))
    ) {
      // Get the corresponding parameter type if available
      const paramType = typedArgs?.[index];
      return convertString(input, targetLanguage, paramType);
    }

    // Handle booleans
    if (input.trim() === "True") {
      return getTrueValue(targetLanguage);
    }
    if (input.trim() === "False") {
      return getFalseValue(targetLanguage);
    }

    // Numbers and other primitives - mostly the same
    return input;
  });
}

function getNullValue(language: string): string {
  switch (language) {
    case "cpp":
      return "nullptr";
    case "java":
      return "null";
    case "javascript":
    case "typescript":
      return "null";
    case "python":
      return "None";
    case "go":
      return "nil";
    case "rust":
      return "None";
    default:
      return "null";
  }
}

function getTrueValue(language: string): string {
  switch (language) {
    case "python":
      return "True";
    case "javascript":
    case "typescript":
    case "java":
    case "cpp":
    case "go":
    case "rust":
      return "true";
    default:
      return "true";
  }
}

function getFalseValue(language: string): string {
  switch (language) {
    case "python":
      return "False";
    case "javascript":
    case "typescript":
    case "java":
    case "cpp":
    case "go":
    case "rust":
      return "false";
    default:
      return "false";
  }
}

function convertArray(input: string, language: string): string {
  // Remove brackets and parse
  const content = input.slice(1, -1).trim();

  switch (language) {
    case "cpp":
      // C++ vector syntax: {1, 2, 3}
      return `{${content.replace(/None/g, "nullptr").replace(/True/g, "true").replace(/False/g, "false")}}`;
    case "java":
      // Java array syntax: new int[]{1, 2, 3} or List.of(1, 2, 3)
      // For simplicity, use array literal if it's simple numbers
      if (/^[\d,\s]+$/.test(content)) {
        return `new int[]{${content}}`;
      }
      // For mixed types, use List.of
      return `List.of(${content.replace(/None/g, "null").replace(/True/g, "true").replace(/False/g, "false")})`;
    case "javascript":
    case "typescript":
      // JavaScript array syntax: [1, 2, 3]
      return `[${content.replace(/None/g, "null").replace(/True/g, "true").replace(/False/g, "false")}]`;
    case "python":
      // Already in Python format
      return input;
    case "go":
      // Go slice syntax: []int{1, 2, 3}
      if (/^[\d,\s]+$/.test(content)) {
        return `[]int{${content}}`;
      }
      return `[]interface{}{${content.replace(/None/g, "nil").replace(/True/g, "true").replace(/False/g, "false")}}`;
    case "rust":
      // Rust vec! macro: vec![1, 2, 3]
      return `vec![${content.replace(/None/g, "None").replace(/True/g, "true").replace(/False/g, "false")}]`;
    default:
      return input;
  }
}

function convertTreeNode(input: string, language: string): string {
  // Parse TreeNode constructor calls
  // Example: TreeNode(1, TreeNode(2), None)

  switch (language) {
    case "cpp":
      // C++: new TreeNode(1, new TreeNode(2), nullptr)
      return input
        .replace(/TreeNode\(/g, "new TreeNode(")
        .replace(/None/g, "nullptr");
    case "java":
      // Java: new TreeNode(1, new TreeNode(2), null)
      return input.replace(/None/g, "null");
    case "javascript":
    case "typescript":
      // JavaScript: new TreeNode(1, new TreeNode(2), null)
      return input.replace(/None/g, "null");
    case "python":
      // Already in Python format
      return input;
    case "go":
      // Go: &TreeNode{Val: 1, Left: &TreeNode{Val: 2}, Right: nil}
      // This is more complex - would need proper parsing
      // For now, return as-is and let the AI handle it
      return input.replace(/None/g, "nil");
    case "rust":
      // Rust: Rc::new(RefCell::new(TreeNode { val: 1, left: ..., right: ... }))
      // This is very complex - would need proper parsing
      // For now, return as-is
      return input.replace(/None/g, "None");
    default:
      return input;
  }
}

function convertListNode(input: string, language: string): string {
  // Similar to TreeNode but for linked lists
  switch (language) {
    case "cpp":
      return input
        .replace(/ListNode\(/g, "new ListNode(")
        .replace(/None/g, "nullptr");
    case "java":
      return input.replace(/None/g, "null");
    case "javascript":
    case "typescript":
      return input.replace(/None/g, "null");
    case "python":
      return input;
    case "go":
      return input.replace(/None/g, "nil");
    case "rust":
      return input.replace(/None/g, "None");
    default:
      return input;
  }
}

function convertString(
  input: string,
  language: string,
  paramType?: string
): string {
  // Extract the string content (remove quotes)
  const quoteChar = input[0];
  const stringContent = input.slice(1, -1);

  switch (language) {
    case "cpp":
      // C++: "hello" works for const char* or std::string
      // For std::string explicitly: std::string("hello")
      if (paramType?.includes("std::string") || paramType?.includes("string")) {
        return `std::string("${stringContent}")`;
      }
      return `"${stringContent}"`;
    case "java":
      // Java: "hello" (strings are objects)
      return `"${stringContent}"`;
    case "javascript":
    case "typescript":
      // JavaScript/TypeScript: "hello" or 'hello'
      return `${quoteChar}${stringContent}${quoteChar}`;
    case "python":
      // Already in Python format
      return input;
    case "go":
      // Go: "hello" (strings are primitives)
      return `"${stringContent}"`;
    case "rust":
      // Rust: For &str use "hello", for String use String::from("hello")
      if (paramType?.includes("String") && !paramType?.includes("&str")) {
        return `String::from("${stringContent}")`;
      }
      // Default to &str (string literal)
      return `"${stringContent}"`;
    default:
      return input;
  }
}

/**
 * Converts Python test inputs to all languages
 */
export function convertTestInputsToAllLanguages(
  pythonInputs: string[],
  prerequisiteDataStructure?: Record<string, string>,
  typedArgs?: Record<string, string[]>
): Record<string, string[]> {
  const hasTreeNode = Object.values(prerequisiteDataStructure || {}).some(
    (code) => code.includes("TreeNode") || code.includes("struct TreeNode")
  );
  const hasListNode = Object.values(prerequisiteDataStructure || {}).some(
    (code) => code.includes("ListNode") || code.includes("struct ListNode")
  );

  return {
    python: pythonInputs,
    cpp: convertTestInputs(
      pythonInputs,
      "cpp",
      hasTreeNode,
      hasListNode,
      typedArgs?.cpp
    ),
    go: convertTestInputs(
      pythonInputs,
      "go",
      hasTreeNode,
      hasListNode,
      typedArgs?.go
    ),
    java: convertTestInputs(
      pythonInputs,
      "java",
      hasTreeNode,
      hasListNode,
      typedArgs?.java
    ),
    javascript: convertTestInputs(
      pythonInputs,
      "javascript",
      hasTreeNode,
      hasListNode,
      typedArgs?.javascript
    ),
    rust: convertTestInputs(
      pythonInputs,
      "rust",
      hasTreeNode,
      hasListNode,
      typedArgs?.rust
    ),
    typescript: convertTestInputs(
      pythonInputs,
      "typescript",
      hasTreeNode,
      hasListNode,
      typedArgs?.typescript
    )
  };
}
