import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  index,
  unique,
  pgPolicy
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { serviceRole } from "drizzle-orm/supabase";

export const UsersTable = pgTable(
  "users",
  {
    user_id: text("user_id").primaryKey(),
    theme: text("theme"),
    font_size: integer("font_size"),
    tab_size: integer("tab_size"),
    line_numbers: boolean("line_numbers"),
    created_at: timestamp("created_at", { withTimezone: true }).default(
      sql`now()`
    ),
    updated_at: timestamp("updated_at", { withTimezone: true }).default(
      sql`now()`
    ),
    vim_mode: boolean("vim_mode"),
    language: text("language"),
    username: text("username"),
    email: text("email").notNull().unique()
  },
  () => [
    // Enable RLS
    sql`ALTER TABLE users ENABLE ROW LEVEL SECURITY`,
    // Only service role has access
    pgPolicy("users_service_role_only", {
      for: "all",
      to: serviceRole,
      using: sql`true`
    })
  ]
);

// Problems table - main table without JSON fields
export const ProblemsTable = pgTable(
  "problems",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    problem_number: integer("problem_number").notNull().unique(), // Human-readable problem number (1, 2, 3, etc.)
    title: text("title").notNull(),
    description: text("description").notNull(),
    example_input: text("example_input").notNull(),
    example_output: text("example_output").notNull(),
    active_date: text("active_date").notNull(), // YYYY-MM-DD format
    created_at: timestamp("created_at", { withTimezone: true }).default(
      sql`now()`
    )
  },
  (table) => [
    index("problems_active_date_idx").on(table.active_date),
    index("problems_title_idx").on(table.title),
    index("problems_problem_number_idx").on(table.problem_number),
    // Enable RLS
    sql`ALTER TABLE problems ENABLE ROW LEVEL SECURITY`,
    // Only service role has access
    pgPolicy("problems_service_role_only", {
      for: "all",
      to: serviceRole,
      using: sql`true`
    })
  ]
);

// Templates table - replaces JSON template field (language-agnostic parts)
export const TemplatesTable = pgTable(
  "templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    problem_id: uuid("problem_id")
      .notNull()
      .references(() => ProblemsTable.id, { onDelete: "cascade" }),
    function_name: text("function_name").notNull(),
    arg_names: text("arg_names").notNull(), // JSON array as text: ["s", "nums"]
    js_doc_string: text("js_doc_string"),
    created_at: timestamp("created_at", { withTimezone: true }).default(
      sql`now()`
    )
  },
  (table) => [
    index("templates_problem_id_idx").on(table.problem_id),
    unique("templates_problem_id_unique").on(table.problem_id), // One template per problem
    // Enable RLS
    sql`ALTER TABLE templates ENABLE ROW LEVEL SECURITY`,
    // Only service role has access
    pgPolicy("templates_service_role_only", {
      for: "all",
      to: serviceRole,
      using: sql`true`
    })
  ]
);

// Template arguments by language - replaces JSON typedArgs, testArgs, returnType
export const TemplateArgsTable = pgTable(
  "template_args",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    template_id: uuid("template_id")
      .notNull()
      .references(() => TemplatesTable.id, { onDelete: "cascade" }),
    language: text("language").notNull(), // 'cpp', 'python', 'javascript', etc.
    typed_args: text("typed_args").notNull(), // JSON array as text: ["string s", "Array<number> nums"]
    return_type: text("return_type").notNull() // "number", "string", etc.
  },
  (table) => [
    index("template_args_template_id_idx").on(table.template_id),
    index("template_args_language_idx").on(table.language),
    unique("template_args_template_language_unique").on(
      table.template_id,
      table.language
    ),
    // Enable RLS
    sql`ALTER TABLE template_args ENABLE ROW LEVEL SECURITY`,
    // Only service role has access
    pgPolicy("template_args_service_role_only", {
      for: "all",
      to: serviceRole,
      using: sql`true`
    })
  ]
);

// Test cases table - replaces JSON test_cases field
export const TestCasesTable = pgTable(
  "test_cases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    problem_id: uuid("problem_id")
      .notNull()
      .references(() => ProblemsTable.id, { onDelete: "cascade" }),
    language: text("language").notNull(), // e.g., 'cpp', 'python', 'javascript'
    input: text("input").notNull(), // The function input (e.g., "[1,2,3]" or '"hello"')
    expected_output: text("expected_output").notNull(), // The expected output (e.g., "6" or '"olleh"')
    test_case_number: integer("test_case_number").notNull(), // 1, 2, 3, etc. for ordering
    created_at: timestamp("created_at", { withTimezone: true }).default(
      sql`now()`
    )
  },
  (table) => [
    index("test_cases_problem_id_idx").on(table.problem_id),
    index("test_cases_language_idx").on(table.language),
    unique("test_cases_problem_number_language_unique").on(
      table.problem_id,
      table.test_case_number,
      table.language
    ),
    // Enable RLS
    sql`ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY`,
    // Only service role has access
    pgPolicy("test_cases_service_role_only", {
      for: "all",
      to: serviceRole,
      using: sql`true`
    })
  ]
);

// Prerequisite data structures by language - replaces JSON prerequisite_data_structure
export const PrerequisiteDataStructuresTable = pgTable(
  "prerequisite_data_structures",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    problem_id: uuid("problem_id")
      .notNull()
      .references(() => ProblemsTable.id, { onDelete: "cascade" }),
    language: text("language").notNull(), // 'cpp', 'python', 'javascript', etc.
    data_structure_code: text("data_structure_code").notNull(), // The prerequisite code for this language
    created_at: timestamp("created_at", { withTimezone: true }).default(
      sql`now()`
    )
  },
  (table) => [
    index("prerequisite_data_structures_problem_id_idx").on(table.problem_id),
    index("prerequisite_data_structures_language_idx").on(table.language),
    unique("prerequisite_data_structures_problem_language_unique").on(
      table.problem_id,
      table.language
    ),
    // Enable RLS
    sql`ALTER TABLE prerequisite_data_structures ENABLE ROW LEVEL SECURITY`,
    // Only service role has access
    pgPolicy("prerequisite_data_structures_service_role_only", {
      for: "all",
      to: serviceRole,
      using: sql`true`
    })
  ]
);

// Relations for type-safe queries
export const problemsRelations = relations(ProblemsTable, ({ one, many }) => ({
  template: one(TemplatesTable),
  testCases: many(TestCasesTable),
  prerequisiteDataStructures: many(PrerequisiteDataStructuresTable),
  userSubmissions: many(UserSubmissionsTable)
}));

export const usersRelations = relations(UsersTable, ({ many }) => ({
  userSubmissions: many(UserSubmissionsTable)
}));

export const templatesRelations = relations(
  TemplatesTable,
  ({ one, many }) => ({
    problem: one(ProblemsTable, {
      fields: [TemplatesTable.problem_id],
      references: [ProblemsTable.id]
    }),
    templateArgs: many(TemplateArgsTable)
  })
);

export const templateArgsRelations = relations(
  TemplateArgsTable,
  ({ one }) => ({
    template: one(TemplatesTable, {
      fields: [TemplateArgsTable.template_id],
      references: [TemplatesTable.id]
    })
  })
);

export const testCasesRelations = relations(TestCasesTable, ({ one }) => ({
  problem: one(ProblemsTable, {
    fields: [TestCasesTable.problem_id],
    references: [ProblemsTable.id]
  })
}));

export const prerequisiteDataStructuresRelations = relations(
  PrerequisiteDataStructuresTable,
  ({ one }) => ({
    problem: one(ProblemsTable, {
      fields: [PrerequisiteDataStructuresTable.problem_id],
      references: [ProblemsTable.id]
    })
  })
);

// User submissions table - main submission record
export const UserSubmissionsTable = pgTable(
  "user_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: text("user_id")
      .notNull()
      .references(() => UsersTable.user_id, { onDelete: "cascade" }),
    problem_id: uuid("problem_id")
      .notNull()
      .references(() => ProblemsTable.id, { onDelete: "cascade" }),
    created_at: timestamp("created_at", { withTimezone: true }).default(
      sql`now()`
    ),
    updated_at: timestamp("updated_at", { withTimezone: true }).default(
      sql`now()`
    )
  },
  (table) => [
    index("user_submissions_user_id_idx").on(table.user_id),
    index("user_submissions_problem_id_idx").on(table.problem_id),
    unique("user_submissions_user_problem_unique").on(
      table.user_id,
      table.problem_id
    ),
    // Enable RLS
    sql`ALTER TABLE user_submissions ENABLE ROW LEVEL SECURITY`,
    // Only service role has access
    pgPolicy("user_submissions_service_role_only", {
      for: "all",
      to: serviceRole,
      using: sql`true`
    })
  ]
);

// User submission code by language - replaces JSON latest_code field
export const UserSubmissionCodeTable = pgTable(
  "user_submission_code",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    submission_id: uuid("submission_id")
      .notNull()
      .references(() => UserSubmissionsTable.id, { onDelete: "cascade" }),
    language: text("language").notNull(), // 'cpp', 'python', 'javascript', etc.
    code: text("code").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).default(
      sql`now()`
    ),
    updated_at: timestamp("updated_at", { withTimezone: true }).default(
      sql`now()`
    )
  },
  (table) => [
    index("user_submission_code_submission_id_idx").on(table.submission_id),
    index("user_submission_code_language_idx").on(table.language),
    unique("user_submission_code_submission_language_unique").on(
      table.submission_id,
      table.language
    ),
    // Enable RLS
    sql`ALTER TABLE user_submission_code ENABLE ROW LEVEL SECURITY`,
    // Only service role has access
    pgPolicy("user_submission_code_service_role_only", {
      for: "all",
      to: serviceRole,
      using: sql`true`
    })
  ]
);

// User submission attempts - replaces JSON attempts array
export const UserSubmissionAttemptsTable = pgTable(
  "user_submission_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    submission_id: uuid("submission_id")
      .notNull()
      .references(() => UserSubmissionsTable.id, { onDelete: "cascade" }),
    attempt_number: integer("attempt_number").notNull(), // 1, 2, 3, etc.
    test_case_results: text("test_case_results").notNull(), // JSON array of booleans: "[true, false, true]"
    created_at: timestamp("created_at", { withTimezone: true }).default(
      sql`now()`
    )
  },
  (table) => [
    index("user_submission_attempts_submission_id_idx").on(table.submission_id),
    index("user_submission_attempts_attempt_number_idx").on(
      table.attempt_number
    ),
    // Enable RLS
    sql`ALTER TABLE user_submission_attempts ENABLE ROW LEVEL SECURITY`,
    // Only service role has access
    pgPolicy("user_submission_attempts_service_role_only", {
      for: "all",
      to: serviceRole,
      using: sql`true`
    })
  ]
);

// Additional relations for user submission tables
export const userSubmissionsRelations = relations(
  UserSubmissionsTable,
  ({ one, many }) => ({
    user: one(UsersTable, {
      fields: [UserSubmissionsTable.user_id],
      references: [UsersTable.user_id]
    }),
    problem: one(ProblemsTable, {
      fields: [UserSubmissionsTable.problem_id],
      references: [ProblemsTable.id]
    }),
    submissionCode: many(UserSubmissionCodeTable),
    attempts: many(UserSubmissionAttemptsTable)
  })
);

export const userSubmissionCodeRelations = relations(
  UserSubmissionCodeTable,
  ({ one }) => ({
    submission: one(UserSubmissionsTable, {
      fields: [UserSubmissionCodeTable.submission_id],
      references: [UserSubmissionsTable.id]
    })
  })
);

export const userSubmissionAttemptsRelations = relations(
  UserSubmissionAttemptsTable,
  ({ one }) => ({
    submission: one(UserSubmissionsTable, {
      fields: [UserSubmissionAttemptsTable.submission_id],
      references: [UserSubmissionsTable.id]
    })
  })
);
