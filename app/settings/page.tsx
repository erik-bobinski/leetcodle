"use client";

import Navigation from "@/components/Navigation";
import { getUser } from "../actions/get-preferences";
import { useEffect, useState } from "react";
import { User } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
// import { updatePreferences } from "../actions/update-preferences";
// import { useActionState } from "react";

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

  useEffect(() => {
    async function fetchPreferences() {
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
    }
    setLoading(true);
    fetchPreferences();
    setLoading(false);
  }, []);

  if (loading) {
    return <div>Fetching your latest preferences...</div>;
  }

  return (
    <main className="min-h-screen w-full px-4 py-4 md:px-6 lg:px-8">
      <Navigation />
      <h1 className="mb-6 text-center text-2xl font-bold">Editor Settings</h1>
      <form className="mx-auto mt-8 w-full max-w-md space-y-6">
        {/* Preferred Coding Language */}
        <div>
          <label htmlFor="language" className="mb-1 block text-sm font-medium">
            Preferred Language
          </label>
          <select
            id="language"
            name="language"
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={preferences.language || "cpp"}
            onChange={(e) =>
              setPreferences({ ...preferences, language: e.target.value })
            }
          >
            <option value="cpp">C++</option>
            <option value="go">Go</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="rust">Rust</option>
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
            onChange={(e) =>
              setPreferences({ ...preferences, line_numbers: e.target.checked })
            }
          />
        </div>
        <Button type="submit" className="mt-8 w-full hover:cursor-pointer">
          Save Preferences
        </Button>
      </form>
    </main>
  );
}
