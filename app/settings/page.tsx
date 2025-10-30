"use client";

import { getUser } from "../actions/get-preferences";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updatePreferences } from "../actions/update-preferences";
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { languages } from "@/types/editor-languages";
import { useQuery } from "@tanstack/react-query";
import { tryCatch } from "@/lib/try-catch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ChevronDownIcon } from "@radix-ui/react-icons";

export default function SettingsPage() {
  const [langKey, setLangKey] = useState<keyof typeof languages>("cpp");
  const [isVim, setIsVim] = useState(false);
  const [tabSizeValue, setTabSizeValue] = useState(2);
  const [fontSize, setFontSize] = useState<number | null>(null);
  const [isLineNumbers, setIsLineNumbers] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function fetchPreferences() {
    // 1. check for prefs in local storage
    const { data: localPrefs, error: getItemError } = await tryCatch(
      Promise.resolve(localStorage.getItem("userPreferences"))
    );
    if (getItemError) {
      setMessage({ type: "error", text: `${getItemError.message}` });
    }

    if (localPrefs !== null) {
      const { data: parsedPrefs, error: jsonParseError } = await tryCatch(
        Promise.resolve(JSON.parse(localPrefs))
      );
      if (jsonParseError) {
        setMessage({ type: "error", text: `${jsonParseError}` });
      }

      // safely update react state
      if ("language" in parsedPrefs && parsedPrefs.language in languages) {
        setLangKey(parsedPrefs.language);
      }
      if ("vim_mode" in parsedPrefs && parsedPrefs.vim_mode !== null) {
        setIsVim(parsedPrefs.vim_mode);
      }
      if ("tab_size" in parsedPrefs && parsedPrefs.tab_size !== null) {
        setTabSizeValue(parsedPrefs.tab_size);
      }
      if ("font_size" in parsedPrefs && parsedPrefs.font_size !== null) {
        setFontSize(parsedPrefs.font_size);
      }
      if ("line_numbers" in parsedPrefs && parsedPrefs.line_numbers !== null) {
        setIsLineNumbers(parsedPrefs.line_numbers);
      }
      return {
        ...parsedPrefs
      };
    }

    // 2. resort to DB fetch
    const result = await getUser();
    if (result === null) {
      setMessage({
        type: "error",
        text: "No current user was found, this shouldn't be possible since settings route is auth protected"
      });
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
      setMessage({ type: "error", text: `${result.error}` });
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
    if (prefsFromDB.language && prefsFromDB.language in languages) {
      setLangKey(prefsFromDB.language as keyof typeof languages);
    }
    if (prefsFromDB.vim_mode !== null) {
      setIsVim(prefsFromDB.vim_mode);
    }
    if (prefsFromDB.tab_size !== null) {
      setTabSizeValue(prefsFromDB.tab_size);
    }
    if (prefsFromDB.font_size !== null) {
      setFontSize(prefsFromDB.font_size);
    }
    if (prefsFromDB.line_numbers !== null) {
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
      setMessage({
        type: "error",
        text: `Failed to save preferences locally, try again: ${localStorageError.message}`
      });
    }

    // Return DB preferences, or default if missing
    return {
      language:
        "language" in prefsFromDB &&
        prefsFromDB.language &&
        prefsFromDB.language in languages
          ? prefsFromDB.language
          : "cpp",
      vim_mode:
        "vim_mode" in prefsFromDB && prefsFromDB.vim_mode
          ? prefsFromDB.vim_mode
          : false,
      font_size:
        "font_size" in prefsFromDB && prefsFromDB.font_size
          ? prefsFromDB.font_size
          : null,
      tab_size:
        "tab_size" in prefsFromDB && prefsFromDB.tab_size
          ? prefsFromDB.tab_size
          : 2,
      line_numbers:
        "line_numbers" in prefsFromDB && prefsFromDB.line_numbers
          ? prefsFromDB.line_numbers
          : true
    };
  }

  const { isLoading, error } = useQuery({
    queryKey: ["fetchPreferences"],
    queryFn: fetchPreferences,
    refetchOnMount: "always",
    staleTime: Infinity
  });
  if (error) {
    if (error instanceof Error) {
      setMessage({ type: "error", text: `${error.message}` });
    }
    setMessage({ type: "error", text: `${error}` });
  }

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    setMessage(null);

    const result = await updatePreferences(formData);
    if ("error" in result) {
      setMessage({ type: "error", text: result.error });
      setSaving(false);
      return;
    }

    const { error: localStorageError } = await tryCatch(
      Promise.resolve(
        localStorage.setItem(
          "userPreferences",
          JSON.stringify({
            ...result
          })
        )
      )
    );
    if (localStorageError) {
      console.error("Error saving to localStorage:", localStorageError);
      if (
        localStorageError instanceof DOMException &&
        localStorageError.name === "QuotaExceededError"
      ) {
        setMessage({
          type: "error",
          text: "Failed to save preferences in your browser, storage may be disabled for this site in your settings"
        });
      } else {
        setMessage({
          type: "error",
          text: `Failed to save preferences locally, ${localStorageError.message}`
        });
      }
      setSaving(false);
      return;
    }

    setMessage({ type: "success", text: "Preferences saved successfully!" });
    setSaving(false);
  }

  if (isLoading) {
    return (
      <main className="min-h-screen w-full px-4 py-4 md:px-6 lg:px-8">
        <div className="relative mx-auto mb-6 flex w-full max-w-md items-center justify-center">
          <Link href="/">
            <ArrowLeftIcon className="absolute left-0 h-6 w-6" />
          </Link>
          <h1 className="w-full text-center text-2xl font-bold">
            Editor Settings
          </h1>
        </div>

        <div className="mx-auto mt-8 w-full max-w-md space-y-6">
          {/* Form fields shimmer */}
          <div className="space-y-6">
            {/* Language selector shimmer */}
            <div>
              <div
                className="shimmer mb-2 h-4 w-32 rounded"
                style={{ backgroundColor: "#1b222c" }}
              />
              <div
                className="shimmer h-10 w-full rounded border"
                style={{ backgroundColor: "#1b222c" }}
              />
            </div>

            {/* Vim mode toggle shimmer */}
            <div className="flex items-center justify-between">
              <div
                className="shimmer h-4 w-20 rounded"
                style={{ backgroundColor: "#1b222c" }}
              />
              <div
                className="shimmer h-4 w-4 rounded"
                style={{ backgroundColor: "#1b222c" }}
              />
            </div>

            {/* Font size shimmer */}
            <div>
              <div
                className="shimmer mb-2 h-4 w-20 rounded"
                style={{ backgroundColor: "#1b222c" }}
              />
              <div
                className="shimmer h-10 w-full rounded border"
                style={{ backgroundColor: "#1b222c" }}
              />
            </div>

            {/* Tab size shimmer */}
            <div>
              <div
                className="shimmer mb-2 h-4 w-16 rounded"
                style={{ backgroundColor: "#1b222c" }}
              />
              <div
                className="shimmer h-10 w-full rounded border"
                style={{ backgroundColor: "#1b222c" }}
              />
            </div>

            {/* Line numbers toggle shimmer */}
            <div className="flex items-center justify-between">
              <div
                className="shimmer h-4 w-28 rounded"
                style={{ backgroundColor: "#1b222c" }}
              />
              <div
                className="shimmer h-4 w-4 rounded"
                style={{ backgroundColor: "#1b222c" }}
              />
            </div>

            {/* Save button shimmer */}
            <div
              className="shimmer mt-8 h-10 w-full rounded"
              style={{ backgroundColor: "#1b222c" }}
            />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full px-4 py-4 md:px-6 lg:px-8">
      <div className="relative mx-auto mb-6 flex w-full max-w-md items-center justify-center">
        <Link href="/">
          <ArrowLeftIcon className="absolute left-0 h-6 w-6 cursor-pointer transition-opacity hover:opacity-50" />
        </Link>
        <h1 className="w-full text-center text-2xl font-bold">
          Editor Settings
        </h1>
      </div>

      {message && (
        <div
          className={`mx-auto mb-4 max-w-md rounded-md p-3 text-sm ${
            message.type === "success"
              ? "border border-green-200 bg-green-100 text-green-800"
              : "border border-red-200 bg-red-100 text-red-800"
          } text-center`}
        >
          {message.text}
        </div>
      )}

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const formData = new window.FormData(e.currentTarget);
          await handleSubmit(formData);
        }}
        className="mx-auto mt-8 w-full max-w-md space-y-6"
      >
        {/* Preferred Coding Language */}
        <div className="flex flex-col items-center">
          <label
            htmlFor="language"
            className="mb-1 block text-center text-sm font-medium"
          >
            Preferred Language
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-56 justify-between"
                type="button"
              >
                {languages[langKey ?? "cpp"]?.name} (
                {languages[langKey ?? "cpp"]?.version})
                <ChevronDownIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {Object.entries(languages).map(([key, lang]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => setLangKey(key as keyof typeof languages)}
                  className="cursor-pointer"
                >
                  {lang.name} ({lang.version})
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Hidden input for form submission */}
          <input type="hidden" name="language" value={langKey ?? "cpp"} />
        </div>

        {/* Vim Mode */}
        <div className="flex items-center justify-center gap-2">
          <label htmlFor="vim_mode" className="text-center text-sm font-medium">
            Vim Mode
          </label>
          <input
            id="vim_mode"
            name="vim_mode"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300"
            checked={isVim ?? false}
            style={{ borderColor: "var(--primary)" }}
            onChange={(e) => setIsVim(e.target.checked)}
          />
        </div>

        {/* Font Size */}
        <div className="flex flex-col items-center">
          <label
            htmlFor="font_size"
            className="mb-1 block text-center text-sm font-medium"
          >
            Font Size
          </label>
          <input
            id="font_size"
            name="font_size"
            type="number"
            min="10"
            max="32"
            step="1"
            className="w-32 rounded-md border px-3 py-2 text-center text-sm"
            value={fontSize ?? 14}
            style={{ borderColor: "var(--primary)" }}
            onChange={(e) => setFontSize(Number(e.target.value))}
          />
        </div>

        {/* Tab Size */}
        <div className="flex flex-col items-center">
          <label
            htmlFor="tab_size"
            className="mb-1 block text-center text-sm font-medium"
          >
            Tab Size
          </label>
          <input
            id="tab_size"
            name="tab_size"
            type="number"
            min="2"
            max="8"
            step="1"
            className="w-32 rounded-md border px-3 py-2 text-center text-sm"
            value={tabSizeValue ?? 4}
            style={{ borderColor: "var(--primary)" }}
            onChange={(e) => setTabSizeValue(Number(e.target.value))}
          />
        </div>

        {/* Line Numbers */}
        <div className="flex items-center justify-center gap-2">
          <label
            htmlFor="line_numbers"
            className="text-center text-sm font-medium"
          >
            Show Line Numbers
          </label>
          <input
            id="line_numbers"
            name="line_numbers"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300"
            checked={isLineNumbers ?? true}
            style={{ borderColor: "var(--primary)" }}
            onChange={(e) => setIsLineNumbers(e.target.checked)}
          />
        </div>
        <Button
          type="submit"
          className="mt-8 w-full hover:cursor-pointer"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Preferences"}
        </Button>
      </form>
    </main>
  );
}
