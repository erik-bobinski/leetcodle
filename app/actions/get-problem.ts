"use server";

import { db } from "@/drizzle";
import { eq } from "drizzle-orm";
import {
  PrerequisiteDataStructuresTable,
  ProblemsTable,
  TemplateArgsTable,
  TemplatesTable
} from "@/drizzle/schema";
import { tryCatch } from "@/lib/try-catch";

export async function getProblem(date?: string) {
  const targetDate = date?.trim() || new Date().toISOString().split("T")[0];

  const { data: problemDataArray, error: problemError } = await tryCatch(
    db
      .select()
      .from(ProblemsTable)
      .where(eq(ProblemsTable.active_date, targetDate))
      .limit(1)
  );
  if (problemError) {
    return { error: `${problemError.message}` };
  }
  if (problemDataArray === null || problemDataArray.length === 0) {
    return { error: `No problem found for the date: ${targetDate}` };
  }
  const problemData = problemDataArray[0];

  const { data: dataStructure, error: dataStructureError } = await tryCatch(
    db
      .select()
      .from(PrerequisiteDataStructuresTable)
      .where(eq(PrerequisiteDataStructuresTable.problem_id, problemData.id))
  );
  if (dataStructureError) {
    return {
      error: `There was an error getting prerequisiteDataStructure from database: ${dataStructureError.message}`
    };
  }

  const { data: templateData, error: templateError } = await tryCatch(
    db
      .select()
      .from(TemplatesTable)
      .where(eq(TemplatesTable.problem_id, problemData.id))
  );
  if (templateError) {
    return {
      error: `There was an error getting the template for the problem: ${templateError.message}`
    };
  }
  if (templateData === null || templateData.length === 0) {
    return { error: `No template found for the problem` };
  }

  const { data: templateArgsData, error: templateArgsError } = await tryCatch(
    db
      .select()
      .from(TemplateArgsTable)
      .where(eq(TemplateArgsTable.template_id, templateData[0].id))
  );
  if (templateArgsError) {
    return {
      error: `There was an error getting the template for the problem: ${templateArgsError.message}`
    };
  }
  if (templateArgsData === null || templateArgsData.length === 0) {
    return { error: `No template arguments found for the problem` };
  }
  const templateArgs = templateArgsData;

  // Build template obj with static template data and nested language-specific typed_args
  const template = {
    ...templateData[0],
    typed_args: templateArgs.reduce(
      (acc, templateArg) => ({
        ...acc,
        [templateArg.language]: {
          id: templateArg.id,
          template_id: templateArg.template_id,
          typed_args: templateArg.typed_args,
          return_type: templateArg.return_type
        }
      }),
      {}
    )
  };

  const problem = {
    ...problemData,
    prerequisite_data_structure: dataStructure,
    template
  };

  return problem;
}
