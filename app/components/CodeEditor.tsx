"use client";

import { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { createTheme } from "thememirror";
import { tags as t } from "@lezer/highlight";

const leetcodleTheme = createTheme({
  variant: "dark",
  settings: {
    background: "#1b222c",
    foreground: "#a6accd",
    caret: "#f8f8f0",
    selection: "#2d3a4e",
    lineHighlight: "#222b3c",
    gutterBackground: "#1b222c",
    gutterForeground: "#4b526d"
  },
  styles: [
    { tag: t.comment, color: "#5c6370", fontStyle: "italic" },
    { tag: t.variableName, color: "#82aaff" },
    { tag: [t.string, t.special(t.brace)], color: "#ecc48d" },
    { tag: t.number, color: "#f78c6c" },
    { tag: t.bool, color: "#ff5370" },
    { tag: t.null, color: "#ff5370" },
    { tag: t.keyword, color: "#c792ea" },
    { tag: t.operator, color: "#89ddff" },
    { tag: t.className, color: "#ffcb8b" },
    { tag: t.definition(t.typeName), color: "#82aaff" },
    { tag: t.typeName, color: "#82aaff" },
    { tag: t.angleBracket, color: "#89ddff" },
    { tag: t.tagName, color: "#ff5370" },
    { tag: t.attributeName, color: "#c792ea" }
  ]
});

export default function CodeEditor() {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const view = new EditorView({
      doc: "// Write your code here\n",
      extensions: [
        basicSetup,
        javascript(),
        leetcodleTheme,
        EditorView.theme({
          "&": {
            height: "300px",
            border: "1px solid #ddd",
            borderRadius: "4px"
          },
          ".cm-content": {
            fontFamily: "var(--font-mono)"
          }
        })
      ],
      parent: editorRef.current
    });

    return () => {
      view.destroy();
    };
  }, []);

  return (
    <div className="w-full">
      <div ref={editorRef} className="w-full" />
    </div>
  );
}
