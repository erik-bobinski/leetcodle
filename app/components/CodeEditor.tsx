/*TODO: 
  add accessibility warning about editor's tab key 
  interfering with its normal function of page navigation
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
import type { EditorPreferences } from "@/lib/supabase";
import { getPreferences } from "../actions/get-preferences";
import { getDeviceId } from "@/lib/editor-preferences";

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
  const viewRef = useRef<EditorView | null>(null);
  const [langKeyState, setLangKeyState] =
    useState<keyof typeof languages>("cpp");
  const [vimState, setVimState] = useState(false);
  const [preferencesState, setPreferencesState] =
    useState<EditorPreferences | null>(null);
  const languageExtension = languages[langKeyState].extension();

  // work to do after initial render
  useEffect(() => {
    async function fetchPreferences() {
      const deviceId = getDeviceId();
      const prefsFromDB = await getPreferences(deviceId);

      // update react state to reflect any stored prefs
      if (prefsFromDB) {
        setPreferencesState(prefsFromDB);

        if (prefsFromDB.language && prefsFromDB.language in languages) {
          setLangKeyState(prefsFromDB.language as keyof typeof languages);
        }
        if (prefsFromDB.vim_mode !== null) {
          setVimState(prefsFromDB.vim_mode);
        }
      }
    }

    fetchPreferences();
  }, []);

  // helper to update editor config
  function refreshExtensions(lang: LanguageSupport) {
    return [
      lang,
      ...(vimState ? [vim()] : []),
      // Only add lineNumbers if enabled in preferences
      ...(preferencesState?.line_numbers !== false ? [lineNumbers()] : []),
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
          fontFamily: "var(--font-mono)",
          fontSize: preferencesState?.font_size
            ? `${preferencesState.font_size}px`
            : null
        },
        ".cm-tab": {
          // Set tab size based on preferences
          width: preferencesState?.tab_size
            ? `${preferencesState.tab_size}ch`
            : null
        }
      })
    ];
  }

  // init the editor
  useEffect(() => {
    if (!editorRef.current || viewRef.current) return;

    const view = new EditorView({
      doc: languages[langKeyState].boilerplate,
      parent: editorRef.current,
      extensions: refreshExtensions(languageExtension)
    });

    viewRef.current = view;
    view.focus();

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [preferencesState]); // Re-initialize when preferences change

  // handle client-side editor config changes
  // i.e. lang selector, vim toggle
  useEffect(() => {
    if (!viewRef.current) return;

    const view = viewRef.current;
    const newDoc = languages[langKeyState].boilerplate;

    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: newDoc
      }
    });

    view.dispatch({
      effects: StateEffect.reconfigure.of(refreshExtensions(languageExtension))
    });

    view.focus();
  }, [langKeyState, vimState]);

  if (preferencesState === null) {
    return (
      <div className="w-full flex flex-col gap-2">
        <div className="flex gap-2 mb-2">
          <div
            className="h-8 w-32 rounded shimmer"
            style={{ backgroundColor: "#1b222c" }}
          />
          <div
            className="h-8 w-24 rounded shimmer"
            style={{ backgroundColor: "#1b222c" }}
          />
        </div>
        <div
          className="w-full h-[300px] rounded border border-[#222b3c] shimmer"
          style={{
            backgroundColor: "#1b222c",
            boxShadow: "0 2px 8px 0 rgba(0,0,0,0.04)"
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex gap-2 mb-2">
        <select
          value={langKeyState}
          onChange={(e) =>
            setLangKeyState(e.target.value as keyof typeof languages)
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
          onClick={() => setVimState(!vimState)}
          className={`px-2 py-1 rounded border cursor-pointer transition-colors ${
            vimState
              ? "bg-[#2d3a4e] text-[#a6accd] border-[#4b526d] hover:bg-[#364458] hover:border-[#5c6370]"
              : "bg-[#1b222c] text-[#a6accd] border-[#2d3a4e] hover:bg-[#222b3c] hover:border-[#4b526d]"
          }`}
        >
          {vimState ? "Vim Mode: On" : "Vim Mode: Off"}
        </button>
      </div>
      <div ref={editorRef} />
    </div>
  );
}
