"use client";

import { createTheme } from "thememirror";
import { tags as t } from "@lezer/highlight";
import { EditorState } from "@codemirror/state";
import {
  EditorView,
  keymap,
  highlightSpecialChars,
  drawSelection,
  highlightActiveLine,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  lineNumbers,
  highlightActiveLineGutter
} from "@codemirror/view";
import {
  indentOnInput,
  bracketMatching,
  foldGutter,
  foldKeymap
} from "@codemirror/language";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import {
  autocompletion,
  completionKeymap,
  closeBrackets,
  closeBracketsKeymap
} from "@codemirror/autocomplete";
import { lintKeymap } from "@codemirror/lint";
import { languages } from "@/types/editor-languages";
import { useState, useEffect, useRef } from "react";

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
  const [currentLang, setCurrentLang] = useState<keyof typeof languages>("cpp");
  const lang = languages[currentLang].extension();

  const getLangName = () => languages[currentLang].name;

  useEffect(() => {
    if (!editorRef.current) return;

    const view = new EditorView({
      doc: languages[currentLang].boilerplate,
      parent: editorRef.current,
      extensions: [
        lang,
        // A line number gutter
        lineNumbers(),
        // A gutter with code folding markers
        foldGutter(),
        // Replace non-printable characters with placeholders
        highlightSpecialChars(),
        // The undo history
        history(),
        // Replace native cursor/selection with our own
        drawSelection(),
        // Show a drop cursor when dragging over the editor
        dropCursor(),
        // Allow multiple cursors/selections
        EditorState.allowMultipleSelections.of(true),
        // Re-indent lines when typing specific input
        indentOnInput(),
        // Use our custom theme
        leetcodleTheme,
        // Highlight matching brackets near cursor
        bracketMatching(),
        // Automatically close brackets
        closeBrackets(),
        // Load the autocompletion system
        autocompletion(),
        // Allow alt-drag to select rectangular regions
        rectangularSelection(),
        // Change the cursor to a crosshair when holding alt
        crosshairCursor(),
        // Style the current line specially
        highlightActiveLine(),
        // Style the gutter for current line specially
        highlightActiveLineGutter(),
        // Highlight text that matches the selected text
        highlightSelectionMatches(),
        keymap.of([
          // Closed-brackets aware backspace
          ...closeBracketsKeymap,
          // A large set of basic bindings
          ...defaultKeymap,
          // Search-related keys
          ...searchKeymap,
          // Redo/undo keys
          ...historyKeymap,
          // Code folding bindings
          ...foldKeymap,
          // Autocompletion keys
          ...completionKeymap,
          // Keys related to the linter system
          ...lintKeymap
        ]),
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
      ]
    });

    view.focus(); // Focus the editor on mount

    return () => {
      view.destroy();
    };
  }, [lang]);

  return (
    <div className="w-full">
      <select
        value={currentLang}
        onChange={(e) =>
          setCurrentLang(e.target.value as keyof typeof languages)
        }
        className="mb-2 p-1 rounded bg-[#1b222c] text-[#a6accd] border border-[#2d3a4e]"
      >
        {Object.entries(languages).map(([key, lang]) => (
          <option key={key} value={key}>
            {lang.name}
          </option>
        ))}
      </select>
      <div ref={editorRef} />
    </div>
  );
}
