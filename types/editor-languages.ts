import { javascript } from "@codemirror/lang-javascript";
import { rust } from "@codemirror/lang-rust";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { go } from "@codemirror/lang-go";

interface Language {
  name: string;
  extension: () => any;
  boilerplate: string;
}

export const languages: Record<string, Language> = {
  cpp: {
    name: "C++",
    extension: cpp,
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
    boilerplate: `function solution() {
  // Your code here
}`
  },
  typescript: {
    name: "TypeScript",
    extension: () => javascript({ typescript: true }),
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
    boilerplate: `def solution():
    # Your code here
    pass

if __name__ == "__main__":
    solution()`
  },
  rust: {
    name: "Rust",
    extension: rust,
    boilerplate: `fn solution() {
    // Your code here
}

fn main() {
    solution();
}`
  }
};
