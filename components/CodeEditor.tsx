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
import { indentUnit } from "@codemirror/language";
import { languages } from "@/types/editor-languages";
import { useState, useEffect, useRef } from "react";
import { vim } from "@replit/codemirror-vim";
import { LanguageSupport } from "@codemirror/language";
import type { User } from "@/lib/supabase";
import { getUser } from "../app/actions/get-preferences";

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

const defaultPreferences = {
  user_id: null,
  theme: null,
  font_size: null,
  tab_size: null,
  line_numbers: true,
  vim_mode: false,
  language: "cpp"
};

export default function CodeEditor() {
  // ref to codemirror view's container
  const editorRef = useRef<HTMLDivElement>(null);

  // ref to the codemirror view object
  const viewRef = useRef<EditorView | null>(null);

  const [langKeyState, setLangKeyState] =
    useState<keyof typeof languages>("cpp");
  const [vimState, setVimState] = useState(false);
  const [preferencesState, setPreferencesState] = useState<User | null>(null);
  const languageExtension = languages[langKeyState].extension();
  const [tabState, setTabState] = useState(indentUnit.of("  "));

  // work to do after initial render
  useEffect(() => {
    async function fetchPreferences() {
      const prefsFromDB = await getUser();

      // update react state to reflect any stored prefs
      if (prefsFromDB) {
        setPreferencesState(prefsFromDB);

        if (prefsFromDB.language && prefsFromDB.language in languages) {
          setLangKeyState(prefsFromDB.language as keyof typeof languages);
        }
        if (prefsFromDB.vim_mode !== null) {
          setVimState(prefsFromDB.vim_mode);
        }
        if (prefsFromDB.tab_size !== null && prefsFromDB.tab_size !== 2) {
          setTabState(indentUnit.of(" ".repeat(prefsFromDB.tab_size)));
        }
        // Font size is handled directly in the theme configuration
      } else {
        setPreferencesState(defaultPreferences);
      }
    }

    fetchPreferences();
  }, []);

  // Listen for storage events to sync settings changes
  useEffect(() => {
    const handleStorageChange = async () => {
      const prefsFromDB = await getUser();
      if (prefsFromDB) {
        setPreferencesState(prefsFromDB);

        if (prefsFromDB.language && prefsFromDB.language in languages) {
          setLangKeyState(prefsFromDB.language as keyof typeof languages);
        }
        if (prefsFromDB.vim_mode !== null) {
          setVimState(prefsFromDB.vim_mode);
        }
        if (prefsFromDB.tab_size !== null) {
          setTabState(indentUnit.of(" ".repeat(prefsFromDB.tab_size)));
        }
        // Font size is handled directly in the theme configuration
      }
    };

    // // Check for settings updates every 2 seconds when on the main page
    // const interval = setInterval(handleStorageChange, 2000);

    // return () => clearInterval(interval);
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
      tabState,
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
          height: "400px",
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
  }, [preferencesState !== null]); // re-init when prefs are set

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
  }, [langKeyState, vimState, tabState]);

  // initial loading state
  if (preferencesState === null) {
    return (
      <div className="flex w-full flex-col gap-2">
        <div className="mb-2 flex gap-2">
          <div
            className="shimmer h-8 w-32 rounded"
            style={{ backgroundColor: "#1b222c" }}
          />
          <div
            className="shimmer h-8 w-24 rounded"
            style={{ backgroundColor: "#1b222c" }}
          />
        </div>
        <div
          className="shimmer h-[300px] w-full rounded border border-[#222b3c]"
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
      <div className="mb-2 flex gap-2">
        <select
          value={langKeyState}
          onChange={(e) =>
            setLangKeyState(e.target.value as keyof typeof languages)
          }
          className="cursor-pointer rounded border border-[#2d3a4e] bg-[#1b222c] p-1 text-[#a6accd] transition-colors hover:border-[#4b526d] hover:bg-[#222b3c]"
        >
          {Object.entries(languages).map(([key, lang]) => (
            <option key={key} value={key}>
              {lang.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => setVimState(!vimState)}
          className={`cursor-pointer rounded border px-2 py-1 transition-colors ${
            vimState
              ? "border-[#4b526d] bg-[#2d3a4e] text-[#a6accd] hover:border-[#5c6370] hover:bg-[#364458]"
              : "border-[#2d3a4e] bg-[#1b222c] text-[#a6accd] hover:border-[#4b526d] hover:bg-[#222b3c]"
          }`}
        >
          {vimState ? "Vim: On" : "Vim: Off"}
        </button>
      </div>
      <div ref={editorRef} />
    </div>
  );
}
