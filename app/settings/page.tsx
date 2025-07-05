"use client";

import { getUser } from "../actions/get-preferences";
import { useEffect, useState } from "react";
import { User } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { updatePreferences } from "../actions/update-preferences";
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { languages } from "@/types/editor-languages";

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<User>({
    theme: null,
    font_size: 14,
    tab_size: 4,
    line_numbers: true,
    vim_mode: false,
    language: "cpp"
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    async function fetchPreferences() {
      try {
        setLoading(true);
        const prefsFromDB = await getUser();

        if (prefsFromDB) {
          setPreferences({
            theme: prefsFromDB.theme ?? null,
            font_size: prefsFromDB.font_size ?? 14,
            tab_size: prefsFromDB.tab_size ?? 4,
            line_numbers: prefsFromDB.line_numbers ?? true,
            vim_mode: prefsFromDB.vim_mode ?? false,
            language: prefsFromDB.language ?? "cpp"
          });
        }
      } catch (error) {
        console.error("Error fetching preferences:", error);
        setMessage({ type: "error", text: "Sign in to save preferences ;)" });
      } finally {
        setLoading(false);
      }
    }

    fetchPreferences();
  }, []);

  async function handleSubmit(formData: FormData) {
    try {
      setSaving(true);
      setMessage(null);
      console.log("Before save - language:", preferences.language);
      await updatePreferences(formData);
      console.log("After save - language:", preferences.language);
      setMessage({ type: "success", text: "Preferences saved successfully!" });
    } catch (error) {
      console.error("Error saving preferences:", error);
      setMessage({ type: "error", text: "Sign in to save preferences ;)" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
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
          }`}
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
        <div>
          <label htmlFor="language" className="mb-1 block text-sm font-medium">
            Preferred Language
          </label>
          <select
            id="language"
            name="language"
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={preferences.language ?? "cpp"}
            style={{ borderColor: "var(--primary)" }}
            onChange={(e) =>
              setPreferences({ ...preferences, language: e.target.value })
            }
          >
            {Object.entries(languages).map(([key, lang]) => (
              <option key={key} value={key}>
                {lang.name} ({lang.version})
              </option>
            ))}
          </select>
        </div>

        {/* Vim Mode */}
        <div className="flex items-center justify-between">
          <label htmlFor="vim_mode" className="text-sm font-medium">
            Vim Mode
          </label>
          <input
            id="vim_mode"
            name="vim_mode"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300"
            checked={preferences.vim_mode ?? false}
            style={{ borderColor: "var(--primary)" }}
            onChange={(e) =>
              setPreferences({ ...preferences, vim_mode: e.target.checked })
            }
          />
        </div>

        {/* Font Size */}
        <div>
          <label htmlFor="font_size" className="mb-1 block text-sm font-medium">
            Font Size
          </label>
          <input
            id="font_size"
            name="font_size"
            type="number"
            min="10"
            max="32"
            step="1"
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={preferences.font_size ?? 14}
            style={{ borderColor: "var(--primary)" }}
            onChange={(e) =>
              setPreferences({
                ...preferences,
                font_size: Number(e.target.value)
              })
            }
          />
        </div>

        {/* Tab Size */}
        <div>
          <label htmlFor="tab_size" className="mb-1 block text-sm font-medium">
            Tab Size
          </label>
          <input
            id="tab_size"
            name="tab_size"
            type="number"
            min="2"
            max="8"
            step="1"
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={preferences.tab_size ?? 4}
            style={{ borderColor: "var(--primary)" }}
            onChange={(e) =>
              setPreferences({
                ...preferences,
                tab_size: Number(e.target.value)
              })
            }
          />
        </div>

        {/* Line Numbers */}
        <div className="flex items-center justify-between">
          <label htmlFor="line_numbers" className="text-sm font-medium">
            Show Line Numbers
          </label>
          <input
            id="line_numbers"
            name="line_numbers"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300"
            checked={preferences.line_numbers ?? true}
            style={{ borderColor: "var(--primary)" }}
            onChange={(e) =>
              setPreferences({ ...preferences, line_numbers: e.target.checked })
            }
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
