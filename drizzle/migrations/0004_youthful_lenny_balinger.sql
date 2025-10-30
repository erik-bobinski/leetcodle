ALTER TABLE "test_cases" DROP CONSTRAINT "test_cases_problem_number_unique";--> statement-breakpoint
ALTER TABLE "test_cases" ADD COLUMN "language" text NOT NULL;--> statement-breakpoint
CREATE INDEX "test_cases_language_idx" ON "test_cases" USING btree ("language");--> statement-breakpoint
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_problem_number_language_unique" UNIQUE("problem_id","test_case_number","language");