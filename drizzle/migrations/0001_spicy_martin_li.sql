ALTER TABLE "prerequisite_data_structures" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "problems" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "template_args" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "templates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "test_cases" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_submission_attempts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_submission_code" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_submissions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "prerequisite_data_structures_service_role_only" ON "prerequisite_data_structures" AS PERMISSIVE FOR ALL TO "service_role" USING (true);--> statement-breakpoint
CREATE POLICY "problems_service_role_only" ON "problems" AS PERMISSIVE FOR ALL TO "service_role" USING (true);--> statement-breakpoint
CREATE POLICY "template_args_service_role_only" ON "template_args" AS PERMISSIVE FOR ALL TO "service_role" USING (true);--> statement-breakpoint
CREATE POLICY "templates_service_role_only" ON "templates" AS PERMISSIVE FOR ALL TO "service_role" USING (true);--> statement-breakpoint
CREATE POLICY "test_cases_service_role_only" ON "test_cases" AS PERMISSIVE FOR ALL TO "service_role" USING (true);--> statement-breakpoint
CREATE POLICY "user_submission_attempts_service_role_only" ON "user_submission_attempts" AS PERMISSIVE FOR ALL TO "service_role" USING (true);--> statement-breakpoint
CREATE POLICY "user_submission_code_service_role_only" ON "user_submission_code" AS PERMISSIVE FOR ALL TO "service_role" USING (true);--> statement-breakpoint
CREATE POLICY "user_submissions_service_role_only" ON "user_submissions" AS PERMISSIVE FOR ALL TO "service_role" USING (true);--> statement-breakpoint
CREATE POLICY "users_service_role_only" ON "users" AS PERMISSIVE FOR ALL TO "service_role" USING (true);