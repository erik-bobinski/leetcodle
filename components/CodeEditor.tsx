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
import { useCallback, useEffect, useMemo, useState } from "react";
import { vim } from "@replit/codemirror-vim";
import { getUser } from "../app/actions/get-preferences";
import CodeMirror from "@uiw/react-codemirror";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PlayIcon } from "@radix-ui/react-icons";

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

interface TemplateData {
  typedArgs: Record<string, string[]>;
  returnType: Record<string, string>;
  functionName: string;
  jsDocString?: string | Record<string, string>;
}

export default function CodeEditor({ template }: { template?: string }) {
  const [langKey, setLangKey] = useState<keyof typeof languages>("cpp");

  const processBoilerplate = useCallback(
    (boilerplate: string, tabSize: number = 4, templateData?: TemplateData) => {
      let processed = boilerplate.replace(
        /\{\{indent\}\}/g,
        " ".repeat(tabSize)
      );

      if (templateData) {
        // Replace template variables with actual values
        processed = processed.replace(
          /\{\{functionName\}\}/g,
          templateData.functionName
        );

        // Handle args - join them with commas for the current language
        const currentLangArgs = templateData.typedArgs[langKey] || [];
        const argsString = currentLangArgs.join(", ");
        processed = processed.replace(/\{\{args\}\}/g, argsString);

        // Handle return type based on current language
        const returnType = templateData.returnType[langKey] || "void";
        processed = processed.replace(/\{\{returns\}\}/g, returnType);

        // Handle JavaScript JSDoc generation
        if (langKey === "javascript" && templateData.jsDocString) {
          // Generate JSDoc comments
          const jsDocLines: string[] = [];

          // Parse the JSON-formatted jsDocString
          let jsDocData: Record<string, string>;
          try {
            jsDocData =
              typeof templateData.jsDocString === "string"
                ? JSON.parse(templateData.jsDocString)
                : templateData.jsDocString;
          } catch (error) {
            console.error("Failed to parse jsDocString JSON:", error);
            return processed;
          }

          // Add @param lines for each parameter
          Object.entries(jsDocData).forEach(([key, type]) => {
            if (key !== "returns") {
              jsDocLines.push(` * @param {${type}} ${key}`);
            }
          });

          // Add @returns line
          if (jsDocData.returns) {
            jsDocLines.push(` * @returns {${jsDocData.returns}}`);
          }

          // Insert JSDoc block at the top of the file
          const jsDocBlock = `/**\n${jsDocLines.join("\n")}\n */\n`;
          processed = jsDocBlock + processed;
        }
      }

      return processed;
    },
    [langKey]
  );
  const [isVim, setIsVim] = useState(false);
  const [tabSizeValue, setTabSizeValue] = useState(2);

  // Parse template JSON if provided
  const templateData: TemplateData | undefined = template
    ? (() => {
        try {
          // Check if template is already an object
          const parsed =
            typeof template === "string" ? JSON.parse(template) : template;
          return parsed;
        } catch (error) {
          console.error("Failed to parse template JSON:", error);
          return undefined;
        }
      })()
    : undefined;

  const [code, setCode] = useState(
    processBoilerplate(
      languages[langKey].boilerplate,
      tabSizeValue,
      templateData
    )
  );
  const [tabSize, setTabSize] = useState(indentUnit.of("  "));
  const [fontSize, setFontSize] = useState<number | null>(null);
  const [isLineNumbers, setIsLineNumbers] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function fetchPreferences() {
    // 1. check for prefs in local storage
    const localPrefs = localStorage.getItem("userPreferences");
    if (localPrefs !== null) {
      try {
        const parsedPrefs = JSON.parse(localPrefs);
        if (parsedPrefs.language && parsedPrefs.language in languages) {
          setLangKey(parsedPrefs.language);
        }
        if (parsedPrefs.vim_mode !== null) {
          setIsVim(parsedPrefs.vim_mode);
        }
        if (parsedPrefs.tab_size !== null) {
          setTabSizeValue(parsedPrefs.tab_size);
          setTabSize(indentUnit.of(" ".repeat(parsedPrefs.tab_size)));
        }
        if (parsedPrefs.font_size !== null) {
          setFontSize(parsedPrefs.font_size);
        }
        if (parsedPrefs.line_numbers !== null) {
          setIsLineNumbers(parsedPrefs.line_numbers);
        }
        return {
          ...parsedPrefs
        };
      } catch (e) {
        console.error("Failed to parse local userPrefernces: ", e);
      }
    }

    // 2. resort to DB fetch
    try {
      const prefsFromDB = await getUser();
      if (prefsFromDB) {
        if (prefsFromDB.language && prefsFromDB.language in languages) {
          setLangKey(prefsFromDB.language as keyof typeof languages);
        }
        if (prefsFromDB.vim_mode !== null) {
          setIsVim(prefsFromDB.vim_mode);
        }
        if (prefsFromDB.tab_size !== null) {
          setTabSizeValue(prefsFromDB.tab_size);
          setTabSize(indentUnit.of(" ".repeat(prefsFromDB.tab_size)));
        }
        if (prefsFromDB.font_size !== null) {
          setFontSize(prefsFromDB.font_size);
        }
        if (prefsFromDB.line_numbers !== null) {
          setIsLineNumbers(prefsFromDB.line_numbers);
        }
        localStorage.setItem(
          "userPreferences",
          JSON.stringify({
            language: prefsFromDB.language,
            vim_mode: prefsFromDB.vim_mode,
            font_size: prefsFromDB.font_size,
            tab_size: prefsFromDB.tab_size,
            line_numbers: prefsFromDB.line_numbers
          })
        );
        return {
          ...prefsFromDB
        };
      }
    } catch (e) {
      console.error("Failed to get preferences from database: ", e);
    }
  }

  const { isLoading, error } = useQuery({
    queryKey: ["fetchPreferences"],
    queryFn: fetchPreferences,
    refetchOnMount: "always",
    staleTime: Infinity
  });

  useEffect(() => {
    // Re-parse template data when template changes
    const currentTemplateData: TemplateData | undefined = template
      ? (() => {
          try {
            // Check if template is already an object
            return typeof template === "string"
              ? JSON.parse(template)
              : template;
          } catch (error) {
            console.error("Failed to parse template JSON:", error);
            return undefined;
          }
        })()
      : undefined;

    setCode(
      processBoilerplate(
        languages[langKey].boilerplate,
        tabSizeValue,
        currentTemplateData
      )
    );
  }, [langKey, tabSizeValue, template, processBoilerplate]);

  const extensions = useMemo(() => {
    return [
      languages[langKey].extension(),
      ...(isVim ? [vim()] : []),
      lineNumbers(),
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
      tabSize,
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
          fontSize: fontSize ? `${fontSize}px` : null
        },
        ...(isLineNumbers
          ? {}
          : {
              ".cm-gutters": {
                display: "none"
              }
            })
      })
    ];
  }, [isVim, langKey, fontSize, isLineNumbers, tabSize]);

  async function handleSubmit() {
    if (!code.trim() || code === languages[langKey].boilerplate) {
      alert("Write your program before submitting!");
      return;
    }

    setIsSubmitting(true);

    // submit code for grading
    try {
      setIsSubmitting(true);
      // const languageId = languages[langKey].language_id;
      // const token = await submitCode(currentCode, languageId);
    } catch (e) {
      alert(e);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
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
  } else if (error) {
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
          className="flex h-[500px] w-full items-center justify-center rounded border border-red-500/20 bg-[#1b222c] p-6"
          style={{
            boxShadow: "0 2px 8px 0 rgba(0,0,0,0.04)"
          }}
        >
          <div className="text-center">
            <div className="mb-4 text-red-400">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-[#a6accd]">
              Failed to Load Editor Preferences
            </h3>
            <p className="mb-4 text-sm text-[#4b526d]">
              Unable to load your editor settings. Please try refreshing the
              page.
            </p>
            {error && (
              <div className="mb-4 rounded border border-red-500/20 bg-red-500/5 p-3">
                <p className="mb-2 text-xs font-medium text-red-400">
                  Error Details:
                </p>
                <pre className="text-xs break-words whitespace-pre-wrap text-[#4b526d]">
                  {error instanceof Error ? error.message : String(error)}
                </pre>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="rounded border border-[#2d3a4e] bg-[#1b222c] px-4 py-2 text-sm text-[#a6accd] transition-colors hover:border-[#4b526d] hover:bg-[#222b3c]"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="w-full">
        <div className="mb-2 flex gap-2">
          <select
            value={langKey}
            onChange={(e) => {
              const newLang = e.target.value as keyof typeof languages;
              setLangKey(newLang);
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
            onClick={() => setIsVim(!isVim)}
            className={`cursor-pointer rounded border px-2 py-1 transition-colors ${
              isVim
                ? "border-[#4b526d] bg-[#2d3a4e] text-[#a6accd] hover:border-[#5c6370] hover:bg-[#364458]"
                : "border-[#2d3a4e] bg-[#1b222c] text-[#a6accd] hover:border-[#4b526d] hover:bg-[#222b3c]"
            }`}
          >
            {isVim ? "Vim: On" : "Vim: Off"}
          </button>
        </div>
        <CodeMirror
          extensions={extensions}
          value={code}
          onChange={(value) => {
            setCode(value);
          }}
          theme={leetcodleTheme}
          tabIndex={tabSizeValue}
        />
      </div>
      <div className="flex justify-start pt-2">
        <Button
          type="button"
          className="flex cursor-pointer items-center gap-2"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          <PlayIcon className="h-5 w-5" />
          {isSubmitting ? "Running..." : "Submit"}
        </Button>
      </div>
    </div>
  );
}
