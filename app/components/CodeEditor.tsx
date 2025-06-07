/*TODO: 
  add accessibility warning about editor's tab key interfering
  with its normal function of page navigation
  https://codemirror.net/examples/tab/
*/

"use client";

import { createTheme } from "thememirror";
import { tags as t } from "@lezer/highlight";
import { EditorState, StateEffect } from "@codemirror/state";
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
import { indentWithTab } from "@codemirror/commands";
import { languages } from "@/types/editor-languages";
import { useState, useEffect, useRef } from "react";
import { vim } from "@replit/codemirror-vim";
import { LanguageSupport } from "@codemirror/language";

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

const getExtensions = (lang: LanguageSupport, vimEnabled: boolean) => [
  lang,
  ...(vimEnabled ? [vim()] : []),
  lineNumbers(),
  foldGutter(),
  highlightSpecialChars(),
  history(),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  leetcodleTheme,
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  rectangularSelection(),
  crosshairCursor(),
  highlightActiveLine(),
  highlightActiveLineGutter(),
  highlightSelectionMatches(),
  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...searchKeymap,
    ...historyKeymap,
    ...foldKeymap,
    ...completionKeymap,
    ...lintKeymap,
    indentWithTab
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
];

export default function CodeEditor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [currentLang, setCurrentLang] = useState<keyof typeof languages>("cpp");
  const [vimMode, setVimMode] = useState(false);
  const lang = languages[currentLang].extension();

  // init the editor
  useEffect(() => {
    if (!editorRef.current || viewRef.current) return;

    const view = new EditorView({
      doc: languages[currentLang].boilerplate,
      parent: editorRef.current,
      extensions: getExtensions(lang, vimMode)
    });

    viewRef.current = view;
    view.focus();

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []); // only run on mount

  // handle language changes
  useEffect(() => {
    if (!viewRef.current) return;

    const view = viewRef.current;
    const newDoc = languages[currentLang].boilerplate;

    // update the document content
    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: newDoc
      }
    });

    // update language support
    view.dispatch({
      effects: StateEffect.reconfigure.of(getExtensions(lang, vimMode))
    });
  }, [currentLang, lang]);

  // handle vim mode changes
  useEffect(() => {
    if (!viewRef.current) return;

    const view = viewRef.current;
    view.dispatch({
      effects: StateEffect.reconfigure.of(getExtensions(lang, vimMode))
    });

    view.focus();
  }, [vimMode, lang]);

  return (
    <div className="w-full">
      <div className="flex gap-2 mb-2">
        <select
          value={currentLang}
          onChange={(e) =>
            setCurrentLang(e.target.value as keyof typeof languages)
          }
          className="p-1 rounded bg-[#1b222c] text-[#a6accd] border border-[#2d3a4e] cursor-pointer hover:bg-[#222b3c] hover:border-[#4b526d] transition-colors"
        >
          {Object.entries(languages).map(([key, lang]) => (
            <option key={key} value={key}>
              {lang.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => setVimMode(!vimMode)}
          className={`px-2 py-1 rounded border cursor-pointer transition-colors ${
            vimMode
              ? "bg-[#2d3a4e] text-[#a6accd] border-[#4b526d] hover:bg-[#364458] hover:border-[#5c6370]"
              : "bg-[#1b222c] text-[#a6accd] border-[#2d3a4e] hover:bg-[#222b3c] hover:border-[#4b526d]"
          }`}
        >
          {vimMode ? "Vim Mode: On" : "Vim Mode: Off"}
        </button>
      </div>
      <div ref={editorRef} />
    </div>
  );
}
