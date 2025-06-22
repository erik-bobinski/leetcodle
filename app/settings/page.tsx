"use client";

import { useState, useEffect } from "react";
import { getUser } from "../actions/get-preferences";
import { updatePreferences } from "../actions/update-preferences";
import { languages } from "@/types/editor-languages";
import type { User } from "@/lib/supabase";
import Navigation from "@/components/Navigation";

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    language: "cpp",
    vim_mode: false,
    tab_size: 2,
    line_numbers: true,
    font_size: 14
  });

  useEffect(() => {
    async function loadPreferences() {
      try {
        const userPrefs = await getUser();
        if (userPrefs) {
          setPreferences(userPrefs);
          setFormData({
            language: userPrefs.language || "cpp",
            vim_mode: userPrefs.vim_mode ?? false,
            tab_size: userPrefs.tab_size || 2,
            line_numbers: userPrefs.line_numbers ?? true,
            font_size: userPrefs.font_size || 14
          });
        }
      } catch (error) {
        console.error("Failed to load preferences:", error);
      } finally {
        setLoading(false);
      }
    }

    loadPreferences();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const result = await updatePreferences(formData);

      if (result.success) {
        setMessage({ type: "success", text: "Settings saved successfully!" });
        setPreferences(result.data);
      } else {
        setMessage({
          type: "error",
          text: result.error || "Failed to save settings"
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An unexpected error occurred" });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <main className="min-h-screen w-full px-4 py-4 md:px-6 lg:px-8">
        <Navigation />
        <div className="mx-auto max-w-2xl">
          <div className="shimmer mb-8 h-9 w-48 rounded bg-[#2d3a4e]" />
          <div className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="shimmer h-24 w-full rounded-lg bg-[#222b3c]"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full px-4 py-4 md:px-6 lg:px-8">
      <Navigation />

      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold text-[#a6accd]">
          Editor Settings
        </h1>

        {message && (
          <div
            className={`mb-6 rounded-lg p-4 ${
              message.type === "success"
                ? "border border-green-700 bg-green-900/20 text-green-300"
                : "border border-red-700 bg-red-900/20 text-red-300"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Programming Language */}
          <div className="rounded-lg border border-[#2d3a4e] bg-[#222b3c] p-6">
            <label className="mb-3 block text-sm font-medium text-[#a6accd]">
              Programming Language
            </label>
            <select
              value={formData.language}
              onChange={(e) => handleInputChange("language", e.target.value)}
              className="w-full rounded border border-[#4b526d] bg-[#1b222c] p-3 text-[#a6accd] transition-colors focus:border-[#89ddff] focus:outline-none"
            >
              {Object.entries(languages).map(([key, lang]) => (
                <option key={key} value={key}>
                  {lang.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-[#5c6370]">
              Choose your preferred programming language for coding challenges
            </p>
          </div>

          {/* Vim Mode */}
          <div className="rounded-lg border border-[#2d3a4e] bg-[#222b3c] p-6">
            <label className="flex items-center justify-between">
              <div>
                <span className="mb-1 block text-sm font-medium text-[#a6accd]">
                  Vim Mode
                </span>
                <p className="text-sm text-[#5c6370]">
                  Enable Vim keybindings for advanced text editing
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleInputChange("vim_mode", !formData.vim_mode)
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.vim_mode ? "bg-[#89ddff]" : "bg-[#4b526d]"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.vim_mode ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </label>
          </div>

          {/* Tab Width */}
          <div className="rounded-lg border border-[#2d3a4e] bg-[#222b3c] p-6">
            <label className="mb-3 block text-sm font-medium text-[#a6accd]">
              Tab Width: {formData.tab_size} spaces
            </label>
            <input
              type="range"
              min="2"
              max="8"
              step="1"
              value={formData.tab_size}
              onChange={(e) =>
                handleInputChange("tab_size", parseInt(e.target.value))
              }
              className="slider h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#4b526d]"
            />
            <div className="mt-1 flex justify-between text-xs text-[#5c6370]">
              <span>2</span>
              <span>4</span>
              <span>6</span>
              <span>8</span>
            </div>
            <p className="mt-2 text-sm text-[#5c6370]">
              Set the number of spaces that a tab character represents
            </p>
          </div>

          {/* Line Numbers */}
          <div className="rounded-lg border border-[#2d3a4e] bg-[#222b3c] p-6">
            <label className="flex items-center justify-between">
              <div>
                <span className="mb-1 block text-sm font-medium text-[#a6accd]">
                  Show Line Numbers
                </span>
                <p className="text-sm text-[#5c6370]">
                  Display line numbers in the code editor
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleInputChange("line_numbers", !formData.line_numbers)
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.line_numbers ? "bg-[#89ddff]" : "bg-[#4b526d]"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.line_numbers ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </label>
          </div>

          {/* Font Size */}
          <div className="rounded-lg border border-[#2d3a4e] bg-[#222b3c] p-6">
            <label className="mb-3 block text-sm font-medium text-[#a6accd]">
              Font Size: {formData.font_size}px
            </label>
            <input
              type="range"
              min="12"
              max="20"
              step="1"
              value={formData.font_size}
              onChange={(e) =>
                handleInputChange("font_size", parseInt(e.target.value))
              }
              className="slider h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#4b526d]"
            />
            <div className="mt-1 flex justify-between text-xs text-[#5c6370]">
              <span>12</span>
              <span>14</span>
              <span>16</span>
              <span>18</span>
              <span>20</span>
            </div>
            <p className="mt-2 text-sm text-[#5c6370]">
              Set the font size for the code editor
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#89ddff] px-6 py-3 font-medium text-[#1b222c] transition-colors hover:cursor-pointer hover:bg-[#82aaff] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #89ddff;
          cursor: pointer;
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #89ddff;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </main>
  );
}
