import { javascript } from "@codemirror/lang-javascript";
import { rust } from "@codemirror/lang-rust";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { go } from "@codemirror/lang-go";
import { LanguageSupport } from "@codemirror/language";

interface Language {
  name: string;
  extension: () => LanguageSupport;
  boilerplate: string;
  language_id: number; // Judge0 language ID
}

export const languages: Record<string, Language> = {
  cpp: {
    name: "C++",
    extension: cpp,
    language_id: 54, // Judge0 C++17 language ID
    boilerplate: `#include <iostream>
#include <vector>

class Solution {
public:
    // Your code here
};

int main() {
    Solution solution;
    return 0;
}`
  },
  go: {
    name: "Go",
    extension: go,
    language_id: 60, // Judge0 Go language ID
    boilerplate: `package main

func solution() {
    // Your code here
}

func main() {
    solution()
}`
  },
  javascript: {
    name: "JavaScript",
    extension: javascript,
    language_id: 63, // Judge0 Node.js language ID
    boilerplate: `function solution() {
  // Your code here
}`
  },
  typescript: {
    name: "TypeScript",
    extension: () => javascript({ typescript: true }),
    language_id: 74, // Judge0 TypeScript language ID
    boilerplate: `function solution(): void {
  // Your code here
}

// TypeScript-specific features
interface Example {
  name: string;
  value: number;
}

const example: Example = {
  name: "test",
  value: 42
};`
  },
  python: {
    name: "Python",
    extension: python,
    language_id: 71, // Judge0 Python3 language ID
    boilerplate: `def solution():
    # Your code here
    pass

if __name__ == "__main__":
    solution()`
  },
  rust: {
    name: "Rust",
    extension: rust,
    language_id: 73, // Judge0 Rust language ID
    boilerplate: `fn solution() {
    // Your code here
}

fn main() {
    solution();
}`
  }
};
