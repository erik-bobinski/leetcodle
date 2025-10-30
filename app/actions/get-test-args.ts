// TODO: migrate all server actions to drizzle, update corresponding client logic, and use tryCatch() wrapper

"use server";

import { supabase } from "@/lib/supabase";

export async function getTestArgs() {
  // TODO: this will have to access URL params when the REST problem page is implemented
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("problems")
    .select("template")
    .eq("active_date", today)
    .single();

  if (error) {
    console.error(`Database Error: ${error.message}`);
    return null;
  }

  if (!data || data.template == null) return null;

  try {
    const templateData =
      typeof data.template === "string"
        ? JSON.parse(data.template)
        : data.template;

    return (templateData ?? {}).testArgs ?? null;
  } catch (e) {
    console.error("Failed to parse template JSON:", e);
    return null;
  }
}
