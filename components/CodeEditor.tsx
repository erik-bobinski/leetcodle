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
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { vim } from "@replit/codemirror-vim";
import { getUser } from "../app/actions/get-preferences";
import { tryCatch } from "@/lib/try-catch";
import CodeMirror from "@uiw/react-codemirror";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PlayIcon } from "@radix-ui/react-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import { gradeSolution } from "@/app/actions/grade-solution";
import type { GetProblem, UserSubmissionCode } from "@/types/database";
import { addUserSubmission } from "@/app/actions/add-user-submission";
import { useAuth } from "@clerk/nextjs";
import { saveLocalSubmission } from "@/lib/local-submissions";

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

export default function CodeEditor({
  template,
  prerequisiteDataStructure,
  problemTitle,
  problemDescription,
  onSubmissionResult,
  latestCode,
  date
}: {
  template: GetProblem["template"];
  prerequisiteDataStructure: GetProblem["prerequisite_data_structure"];
  problemTitle: GetProblem["title"];
  problemDescription: GetProblem["description"];
  onSubmissionResult?: (result: {
    graded: boolean;
    hint: string | null;
    userAttempts: boolean[];
    time: string;
    memory: number;
    error: string | null;
    stdout: string | null;
  }) => void;
  latestCode?: UserSubmissionCode | null;
  date?: string;
}) {
  const [langKey, setLangKey] = useState<keyof typeof languages>(
    (latestCode?.language as keyof typeof languages) || "cpp"
  );

  // Store code per language to preserve work when switching
  const codePerLanguageRef = useRef<Map<string, string>>(new Map());

  const processBoilerplate = useCallback(
    (
      boilerplate: string,
      tabSize: number = 4,
      templateData?: GetProblem["template"]
    ) => {
      let processed = boilerplate.replace(
        /\{\{indent\}\}/g,
        " ".repeat(tabSize)
      );

      if (templateData) {
        // Replace template variables with actual values
        processed = processed.replace(
          /\{\{functionName\}\}/g,
          templateData.function_name
        );

        // Handle args - parse JSON and join them with commas for the current language
        const currentLangArgs = templateData.typed_args[langKey];
        let argsString = "";
        if (currentLangArgs) {
          try {
            const parsedArgs = JSON.parse(currentLangArgs.typed_args);
            argsString = parsedArgs.join(", ");
          } catch {
            argsString = "";
          }
        }
        processed = processed.replace(/\{\{args\}\}/g, argsString);

        // Handle return type based on current language
        const returnType = currentLangArgs?.return_type || "void";
        processed = processed.replace(/\{\{returns\}\}/g, returnType);

        // Handle JavaScript JSDoc generation
        if (langKey === "javascript" && templateData.js_doc_string) {
          // Generate JSDoc comments
          const jsDocLines: string[] = [];

          // Parse the JSON-formatted jsDocString
          let jsDocData: Record<string, string>;
          try {
            jsDocData = JSON.parse(templateData.js_doc_string);
          } catch (error) {
            console.error("Failed to parse jsDocString JSON:", error);
            alert(`Failed to parse jsDocString JSON:, ${error}`);
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

      // For Go, package main must be at the very top, before everything else
      if (langKey === "go") {
        const prerequisiteCode = prerequisiteDataStructure?.find(
          (obj) => obj.language === langKey
        );
        if (prerequisiteCode) {
          // package main, then prerequisite, then function
          return `package main\n\n${prerequisiteCode.data_structure_code}\n\n${processed}`;
        } else {
          // Just package main, then function
          return `package main\n\n${processed}`;
        }
      }

      // Add prerequisiteDataStructure at the very top (after JSDoc if present)
      const prerequisiteCode = prerequisiteDataStructure?.find(
        (obj) => obj.language === langKey
      );
      if (prerequisiteCode) {
        processed = `${prerequisiteCode.data_structure_code}\n\n${processed}`;
      }

      return processed;
    },
    [langKey, prerequisiteDataStructure]
  );
  const [isVim, setIsVim] = useState(false);
  const [tabSizeValue, setTabSizeValue] = useState(2);

  // Initialize code: use latestCode if it exists and matches the current language, otherwise use boilerplate
  const [code, setCode] = useState(() => {
    if (latestCode && latestCode.language === langKey) {
      return latestCode.code;
    }
    return processBoilerplate(
      languages[langKey].boilerplate,
      tabSizeValue,
      template ?? undefined
    );
  });
  const [tabSize, setTabSize] = useState(indentUnit.of("  "));
  const [fontSize, setFontSize] = useState<number | null>(null);
  const [isLineNumbers, setIsLineNumbers] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isSignedIn } = useAuth();
  const editorRef = useRef<HTMLDivElement>(null);

  // Handle language change: save current code before switching
  const handleLanguageChange = useCallback(
    (newLangKey: keyof typeof languages) => {
      if (newLangKey !== langKey) {
        // Save current code for the current language
        codePerLanguageRef.current.set(langKey, code);
        setLangKey(newLangKey);
      }
    },
    [langKey, code]
  );

  async function fetchPreferences() {
    // 1. check for prefs in local storage
    const { data: localPrefs, error: getItemError } = await tryCatch(
      Promise.resolve(localStorage.getItem("userPreferences"))
    );
    if (getItemError) {
      console.error(
        "Failed to get preferences from localStorage:",
        getItemError
      );
      alert(`Failed to access local storage: ${getItemError.message}`);
    }
    if (localPrefs !== null) {
      const { data: parsedPrefs, error: jsonParseError } = await tryCatch(
        Promise.resolve(JSON.parse(localPrefs))
      );
      if (!jsonParseError && parsedPrefs) {
        // Successfully parsed, set state and return
        // Only set language from preferences if there's no latestCode
        if (
          !latestCode &&
          "language" in parsedPrefs &&
          parsedPrefs.language in languages
        ) {
          setLangKey(parsedPrefs.language);
        }
        if ("vim_mode" in parsedPrefs && parsedPrefs.vim_mode !== null) {
          setIsVim(parsedPrefs.vim_mode);
        }
        if ("tab_size" in parsedPrefs && parsedPrefs.tab_size !== null) {
          setTabSizeValue(parsedPrefs.tab_size);
          setTabSize(indentUnit.of(" ".repeat(parsedPrefs.tab_size)));
        }
        if ("font_size" in parsedPrefs && parsedPrefs.font_size !== null) {
          setFontSize(parsedPrefs.font_size);
        }
        if (
          "line_numbers" in parsedPrefs &&
          parsedPrefs.line_numbers !== null
        ) {
          setIsLineNumbers(parsedPrefs.line_numbers);
        }
        return {
          ...parsedPrefs
        };
      } else if (jsonParseError) {
        console.error("Failed to parse local userPreferences:", jsonParseError);
        alert(`Failed to parse saved preferences: ${jsonParseError.message}`);
        // Fall through to DB fetch
      }
    }

    // 2. resort to DB fetch
    const result = await getUser();
    if (result === null) {
      // Return default preferences
      return {
        language: "cpp",
        vim_mode: false,
        font_size: null,
        tab_size: 2,
        line_numbers: true
      };
    }
    if ("error" in result) {
      console.error("Failed to get preferences from database:", result.error);
      alert(`Failed to load preferences from server: ${result.error}`);
      // Return default preferences
      return {
        language: "cpp",
        vim_mode: false,
        font_size: null,
        tab_size: 2,
        line_numbers: true
      };
    }

    const prefsFromDB = { ...result };
    // Only set language from preferences if there's no latestCode
    if (
      !latestCode &&
      "language" in prefsFromDB &&
      prefsFromDB.language !== null &&
      prefsFromDB.language in languages
    ) {
      setLangKey(prefsFromDB.language as keyof typeof languages);
    }
    if ("vim_mode" in prefsFromDB && prefsFromDB.vim_mode !== null) {
      setIsVim(prefsFromDB.vim_mode);
    }
    if ("tab_size" in prefsFromDB && prefsFromDB.tab_size !== null) {
      setTabSizeValue(prefsFromDB.tab_size);
      setTabSize(indentUnit.of(" ".repeat(prefsFromDB.tab_size)));
    }
    if ("font_size" in prefsFromDB && prefsFromDB.font_size !== null) {
      setFontSize(prefsFromDB.font_size);
    }
    if ("line_numbers" in prefsFromDB && prefsFromDB.line_numbers !== null) {
      setIsLineNumbers(prefsFromDB.line_numbers);
    }

    const { error: localStorageError } = await tryCatch(
      Promise.resolve(
        localStorage.setItem(
          "userPreferences",
          JSON.stringify({
            language: prefsFromDB.language,
            vim_mode: prefsFromDB.vim_mode,
            font_size: prefsFromDB.font_size,
            tab_size: prefsFromDB.tab_size,
            line_numbers: prefsFromDB.line_numbers
          })
        )
      )
    );
    if (localStorageError) {
      console.error("Error saving to localStorage:", localStorageError);
      alert(`Failed to save preferences locally: ${localStorageError.message}`);
    }

    // Return DB preferences, or default if missing
    return {
      language:
        prefsFromDB.language && prefsFromDB.language in languages
          ? prefsFromDB.language
          : "cpp",
      vim_mode: prefsFromDB.vim_mode ?? false,
      font_size: prefsFromDB.font_size ?? null,
      tab_size: prefsFromDB.tab_size ?? 2,
      line_numbers: prefsFromDB.line_numbers ?? true
    };
  }
  const { isLoading, error } = useQuery({
    queryKey: ["fetchPreferences"],
    queryFn: fetchPreferences,
    refetchOnMount: "always",
    staleTime: 5 * 60 * 1000
  });

  useEffect(() => {
    // First, check if we have saved code for this language from a previous switch
    const savedCode = codePerLanguageRef.current.get(langKey);
    if (savedCode !== undefined) {
      setCode(savedCode);
      return;
    }

    // Only set boilerplate if we don't have latestCode for the current language
    // or if latestCode is for a different language
    if (!latestCode || latestCode.language !== langKey) {
      setCode(
        processBoilerplate(
          languages[langKey].boilerplate,
          tabSizeValue,
          template ?? undefined
        )
      );
    } else if (latestCode && latestCode.language === langKey) {
      // Use latestCode if it matches the current language
      setCode(latestCode.code);
    }
  }, [langKey, tabSizeValue, processBoilerplate, template, latestCode]);

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
    setIsSubmitting(true);
    if (
      !code.trim() ||
      code ===
        processBoilerplate(
          languages[langKey].boilerplate,
          tabSizeValue,
          template ?? undefined
        )
    ) {
      alert("Write your program before submitting!");
      setIsSubmitting(false);
      return;
    }
    const grade = await gradeSolution(
      langKey,
      code,
      template?.function_name ?? "",
      tabSizeValue,
      problemTitle,
      problemDescription,
      date
    );
    if (grade instanceof Error) {
      alert(grade);
      setIsSubmitting(false);
      return;
    }

    // Only save submission if the code was actually graded (not a runtime error)
    if (grade.graded && "isCorrect" in grade && grade.isCorrect) {
      const targetDate = date || new Date().toISOString().split("T")[0];

      if (isSignedIn) {
        // User is logged in - save to database
        const addSubmissionResult = await addUserSubmission(
          langKey,
          code,
          grade.isCorrect,
          date ?? undefined
        );
        if (addSubmissionResult instanceof Error) {
          alert(`Failed to save submission: ${addSubmissionResult}`);
          console.error("Failed to save submission:", addSubmissionResult);
        } else {
          // Dispatch event to refresh Wordle grid
          window.dispatchEvent(new Event("wordle-refresh"));
        }
      } else {
        // User is not logged in - save to localStorage
        const { error: saveLocalError } = await tryCatch(
          Promise.resolve(
            saveLocalSubmission(targetDate, langKey, code, grade.isCorrect)
          )
        );
        if (saveLocalError) {
          alert(`Failed to save submission locally: ${saveLocalError}`);
          console.error("Failed to save submission locally:", saveLocalError);
        } else {
          // Dispatch event to refresh Wordle grid
          window.dispatchEvent(new Event("wordle-refresh"));
        }
      }
    }

    // update react state in output component
    if (onSubmissionResult) {
      onSubmissionResult({
        graded: grade.graded,
        hint: grade.graded && "hint" in grade ? grade.hint : null,
        userAttempts:
          grade.graded && "isCorrect" in grade ? grade.isCorrect : [],
        time: grade.time,
        memory: grade.memory,
        error: grade.error,
        stdout: grade.stdout
      });
    }

    setIsSubmitting(false);
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex w-56 cursor-pointer items-center rounded border"
              >
                <span className="flex-grow text-left">
                  {languages[langKey]?.name} ({languages[langKey]?.version})
                </span>
                <ChevronDownIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {Object.entries(languages).map(([key, lang]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() =>
                    handleLanguageChange(key as keyof typeof languages)
                  }
                  className="cursor-pointer"
                >
                  {lang.name} ({lang.version})
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            onClick={() => {
              setIsVim(!isVim);
              // Focus the editor after toggling Vim mode
              const editorElement = editorRef.current?.querySelector(
                ".cm-content"
              ) as HTMLElement;
              if (editorElement) {
                editorElement.focus();
              }
            }}
            data-slot="dropdown-menu-trigger"
            className="cursor-pointer"
          >
            {isVim ? "Vim: On" : "Vim: Off"}
          </Button>
        </div>
        <div ref={editorRef}>
          <CodeMirror
            key={langKey}
            extensions={extensions}
            value={code}
            onChange={(value) => {
              setCode(value);
            }}
            theme={leetcodleTheme}
            tabIndex={tabSizeValue}
          />
        </div>
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
