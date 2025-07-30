import { javascript } from "@codemirror/lang-javascript";
import { rust } from "@codemirror/lang-rust";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { go } from "@codemirror/lang-go";
import { java } from "@codemirror/lang-java";
import { LanguageSupport } from "@codemirror/language";

interface Language {
  name: string;
  version: string;
  extension: () => LanguageSupport;
  boilerplate: string;
  language_id: number;
}

export const languages: Record<string, Language> = {
  cpp: {
    name: "C++",
    version: "17",
    extension: cpp,
    language_id: 54,
    boilerplate: `int main() {
{{indent}}// Your code here
{{indent}}return 0;
}`
  },
  go: {
    name: "Go",
    version: "1.21",
    extension: go,
    language_id: 60,
    boilerplate: `package main

import "fmt"

func main() {
{{indent}}// Your code here
}`
  },
  java: {
    name: "Java",
    version: "13.0.1",
    extension: java,
    language_id: 62,
    boilerplate: `public class Main {
{{indent}}public static void main(String[] args) {
{{indent}}{{indent}}// Your code here
{{indent}}}
}`
  },
  javascript: {
    name: "JavaScript",
    version: "Node.js 18.15",
    extension: javascript,
    language_id: 63,
    boilerplate: `function solution() {
{{indent}}// Your code here
}

solution();`
  },
  typescript: {
    name: "TypeScript",
    version: "5.0",
    extension: () => javascript({ typescript: true }),
    language_id: 74,
    boilerplate: `function solution(): void {
{{indent}}// Your code here
}

solution();`
  },
  python: {
    name: "Python",
    version: "3.11",
    extension: python,
    language_id: 71,
    boilerplate: `def solution():
{{indent}}# Your code here

solution()`
  },
  rust: {
    name: "Rust",
    version: "1.70",
    extension: rust,
    language_id: 73,
    boilerplate: `fn main() {
{{indent}}// Your code here
}`
  }
};
