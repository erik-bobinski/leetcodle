"use server";

import { supabase } from "@/lib/supabase";

export async function getTodaysProblem() {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("problems")
    .select("*")
    .eq("active_date", today)
    .single();
  if (error) {
    console.error(`Database Error: ${error.message}`);
  }

  // Filter out testArgs from template to prevent exposing test cases
  if (data && data.template) {
    try {
      // Check if template is already an object (Supabase might auto-parse JSON columns)
      const templateData =
        typeof data.template === "string"
          ? JSON.parse(data.template)
          : data.template;

      const safeTemplateData = { ...templateData };
      delete safeTemplateData.testArgs;
      data.template = safeTemplateData;
    } catch (error) {
      console.error("Failed to parse template JSON:", error);
      // If template is invalid JSON, keep it as is
    }
  }

  // Parse prerequisite_data_structure JSON if it's a string
  if (data && data.prerequisite_data_structure) {
    try {
      // Check if prerequisite_data_structure is already an object (Supabase might auto-parse JSON columns)
      data.prerequisite_data_structure =
        typeof data.prerequisite_data_structure === "string"
          ? JSON.parse(data.prerequisite_data_structure)
          : data.prerequisite_data_structure;
    } catch (error) {
      console.error("Failed to parse prerequisite_data_structure JSON:", error);
      // If prerequisite_data_structure is invalid JSON, keep it as is
    }
  }

  return data;
}
