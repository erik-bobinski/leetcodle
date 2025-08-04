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
    boilerplate: `class Solution {
public:
{{indent}}{{returns}} {{functionName}}({{args}}) {
{{indent}}{{indent}}// write all code within this function
{{indent}}{{indent}}
{{indent}}}
};`
  },
  go: {
    name: "Go",
    version: "1.21",
    extension: go,
    language_id: 60,
    boilerplate: `func {{functionName}}({{args}}) {{returns}} {
{{indent}}// write all code within this function
{{indent}}
}`
  },
  java: {
    name: "Java",
    version: "13.0.1",
    extension: java,
    language_id: 62,
    boilerplate: `class Solution {
{{indent}}public {{returns}} {{functionName}}({{args}}) {
{{indent}}{{indent}}
{{indent}}}
}`
  },
  javascript: {
    name: "JavaScript",
    version: "Node.js 18.15",
    extension: javascript,
    language_id: 63,
    boilerplate: `function {{functionName}}({{args}}) {
    // write all code within this function
}`
  },
  typescript: {
    name: "TypeScript",
    version: "5.0",
    extension: () => javascript({ typescript: true }),
    language_id: 74,
    boilerplate: `function {{functionName}}({{args}}): {{returns}} {
{{indent}}// write all code within this function
{{indent}}
}`
  },
  python: {
    name: "Python",
    version: "3.11",
    extension: python,
    language_id: 71,
    boilerplate: `class Solution:
{{indent}}def {{functionName}}(self, {{args}}) -> {{returns}}:
{{indent}}{{indent}}# write all code within this function
{{indent}}{{indent}}`
  },
  rust: {
    name: "Rust",
    version: "1.70",
    extension: rust,
    language_id: 73,
    boilerplate: `impl Solution {
{{indent}}pub fn {{functionName}}({{args}}) -> {{returns}} {
{{indent}}{{indent}}// write all code within this function
{{indent}}{{indent}}
{{indent}}}
}`
  }
};
