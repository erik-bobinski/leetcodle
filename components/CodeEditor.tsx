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

interface CodeEditorProps {
  onCodeChange?: (code: string) => void;
  onLanguageChange?: (language: string) => void;
}

export default function CodeEditor({
  onCodeChange,
  onLanguageChange
}: CodeEditorProps) {
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
      // 1. check for prefs in local storage
      const localPrefs = localStorage.getItem("userPreferences");
      if (localPrefs !== null) {
        try {
          const parsedPrefs = JSON.parse(localPrefs);
          setPreferencesState(parsedPrefs);
          if (parsedPrefs.language && parsedPrefs.language in languages) {
            setLangKeyState(parsedPrefs.language);
          }
          if (parsedPrefs.vim_mode !== null) {
            setVimState(parsedPrefs.vim_mode);
          }
          if (parsedPrefs.tab_size !== null) {
            setTabState(indentUnit.of(" ".repeat(parsedPrefs.tab_size)));
          }
          return;
        } catch (e) {
          console.error("Failed to parse local userPrefernces: ", e);
        }
      }

      // 2. resort to DB fetch
      try {
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
          // save to local storage for future
          localStorage.setItem("userPreferences", JSON.stringify(prefsFromDB));

          // font size is handled directly in the theme configuration
        } else {
          setPreferencesState(defaultPreferences);
        }
      } catch (e) {
        console.error("Failed to get preferences from database");
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
          height: "500px",
          border: "2px solid var(--primary)",
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

    const indent = " ".repeat(preferencesState?.tab_size || 2);
    const boilerplate = languages[langKeyState].boilerplate.replace(
      /{{indent}}/g,
      indent
    );

    const view = new EditorView({
      doc: boilerplate,
      parent: editorRef.current,
      extensions: refreshExtensions(languageExtension)
    });
    viewRef.current = view;
    view.focus();

    // Call onCodeChange with initial content
    if (onCodeChange) {
      onCodeChange(boilerplate);
    }
    if (onLanguageChange) {
      onLanguageChange(langKeyState);
    }
  }, [preferencesState !== null]); // re-init when prefs are set

  // Listen for code changes
  useEffect(() => {
    if (!viewRef.current || !onCodeChange) return;

    const view = viewRef.current;
    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onCodeChange(update.state.doc.toString());
      }
    });

    view.dispatch({
      effects: StateEffect.reconfigure.of([
        ...refreshExtensions(languageExtension),
        updateListener
      ])
    });
  }, [onCodeChange, languageExtension]);

  // handle client-side editor config changes
  // i.e. lang selector, vim toggle
  useEffect(() => {
    if (!viewRef.current) return;

    const view = viewRef.current;
    const indent = " ".repeat(preferencesState?.tab_size || 2);
    const newDoc = languages[langKeyState].boilerplate.replace(
      /{{indent}}/g,
      indent
    );

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
          className="shimmer h-[500px] w-full rounded border border-[#222b3c]"
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
          onChange={(e) => {
            const newLang = e.target.value as keyof typeof languages;
            setLangKeyState(newLang);
            if (onLanguageChange) {
              onLanguageChange(newLang);
            }
          }}
          className="cursor-pointer rounded border border-[#2d3a4e] bg-[#1b222c] p-1 text-[#a6accd] transition-colors hover:border-[#4b526d] hover:bg-[#222b3c]"
        >
          {Object.entries(languages).map(([key, lang]) => (
            <option key={key} value={key}>
              {lang.name} ({lang.version})
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
