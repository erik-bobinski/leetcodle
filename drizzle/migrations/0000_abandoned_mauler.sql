CREATE TABLE "prerequisite_data_structures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"problem_id" uuid NOT NULL,
	"language" text NOT NULL,
	"data_structure_code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "prerequisite_data_structures_problem_language_unique" UNIQUE("problem_id","language")
);
--> statement-breakpoint
CREATE TABLE "problems" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"problem_number" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"example_input" text NOT NULL,
	"example_output" text NOT NULL,
	"active_date" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "problems_problem_number_unique" UNIQUE("problem_number")
);
--> statement-breakpoint
CREATE TABLE "template_args" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"language" text NOT NULL,
	"typed_args" text NOT NULL,
	"test_args" text NOT NULL,
	"return_type" text NOT NULL,
	CONSTRAINT "template_args_template_language_unique" UNIQUE("template_id","language")
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"problem_id" uuid NOT NULL,
	"function_name" text NOT NULL,
	"arg_names" text NOT NULL,
	"js_doc_string" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "templates_problem_id_unique" UNIQUE("problem_id")
);
--> statement-breakpoint
CREATE TABLE "test_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"problem_id" uuid NOT NULL,
	"input" text NOT NULL,
	"expected_output" text NOT NULL,
	"test_case_number" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "test_cases_problem_number_unique" UNIQUE("problem_id","test_case_number")
);
--> statement-breakpoint
CREATE TABLE "user_submission_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"attempt_number" integer NOT NULL,
	"test_case_results" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_submission_code" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"language" text NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_submission_code_submission_language_unique" UNIQUE("submission_id","language")
);
--> statement-breakpoint
CREATE TABLE "user_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"problem_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_submissions_user_problem_unique" UNIQUE("user_id","problem_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"user_id" text PRIMARY KEY NOT NULL,
	"theme" text,
	"font_size" integer,
	"tab_size" integer,
	"line_numbers" boolean,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"vim_mode" boolean,
	"language" text,
	"username" text,
	"email" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "prerequisite_data_structures" ADD CONSTRAINT "prerequisite_data_structures_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_args" ADD CONSTRAINT "template_args_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_submission_attempts" ADD CONSTRAINT "user_submission_attempts_submission_id_user_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."user_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_submission_code" ADD CONSTRAINT "user_submission_code_submission_id_user_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."user_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_submissions" ADD CONSTRAINT "user_submissions_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_submissions" ADD CONSTRAINT "user_submissions_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "prerequisite_data_structures_problem_id_idx" ON "prerequisite_data_structures" USING btree ("problem_id");--> statement-breakpoint
CREATE INDEX "prerequisite_data_structures_language_idx" ON "prerequisite_data_structures" USING btree ("language");--> statement-breakpoint
CREATE INDEX "problems_active_date_idx" ON "problems" USING btree ("active_date");--> statement-breakpoint
CREATE INDEX "problems_title_idx" ON "problems" USING btree ("title");--> statement-breakpoint
CREATE INDEX "problems_problem_number_idx" ON "problems" USING btree ("problem_number");--> statement-breakpoint
CREATE INDEX "template_args_template_id_idx" ON "template_args" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "template_args_language_idx" ON "template_args" USING btree ("language");--> statement-breakpoint
CREATE INDEX "templates_problem_id_idx" ON "templates" USING btree ("problem_id");--> statement-breakpoint
CREATE INDEX "test_cases_problem_id_idx" ON "test_cases" USING btree ("problem_id");--> statement-breakpoint
CREATE INDEX "user_submission_attempts_submission_id_idx" ON "user_submission_attempts" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "user_submission_attempts_attempt_number_idx" ON "user_submission_attempts" USING btree ("attempt_number");--> statement-breakpoint
CREATE INDEX "user_submission_code_submission_id_idx" ON "user_submission_code" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "user_submission_code_language_idx" ON "user_submission_code" USING btree ("language");--> statement-breakpoint
CREATE INDEX "user_submissions_user_id_idx" ON "user_submissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_submissions_problem_id_idx" ON "user_submissions" USING btree ("problem_id");