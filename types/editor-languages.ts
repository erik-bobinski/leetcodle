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
    version: "17, GCC 9.2.0",
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
    version: "1.23.5",
    extension: go,
    language_id: 107,
    boilerplate: `func {{functionName}}({{args}}) {{returns}} {
{{indent}}// write all code within this function
{{indent}}
}`
  },
  java: {
    name: "Java",
    version: "JDK 17.0.6",
    extension: java,
    language_id: 91,
    boilerplate: `class Solution {
{{indent}}public {{returns}} {{functionName}}({{args}}) {
{{indent}}{{indent}}
{{indent}}}
}`
  },
  javascript: {
    name: "JavaScript",
    version: "Node.js 22.08.0",
    extension: javascript,
    language_id: 102,
    boilerplate: `function {{functionName}}({{args}}) {
    // write all code within this function
}`
  },
  typescript: {
    name: "TypeScript",
    version: "5.6.2",
    extension: () => javascript({ typescript: true }),
    language_id: 94,
    boilerplate: `function {{functionName}}({{args}}): {{returns}} {
{{indent}}// write all code within this function
{{indent}}
}`
  },
  python: {
    name: "Python",
    version: "3.13.2",
    extension: python,
    language_id: 109,
    boilerplate: `class Solution:
{{indent}}def {{functionName}}(self, {{args}}) -> {{returns}}:
{{indent}}{{indent}}# write all code within this function
{{indent}}{{indent}}`
  },
  rust: {
    name: "Rust",
    version: "1.85.0",
    extension: rust,
    language_id: 108,
    boilerplate: `impl Solution {
{{indent}}pub fn {{functionName}}({{args}}) -> {{returns}} {
{{indent}}{{indent}}// write all code within this function
{{indent}}{{indent}}
{{indent}}}
}`
  }
};
