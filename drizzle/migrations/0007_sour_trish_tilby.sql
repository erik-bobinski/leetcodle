CREATE TABLE "reference_solutions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"problem_id" uuid NOT NULL,
	"language" text NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "reference_solutions_problem_language_unique" UNIQUE("problem_id","language")
);
--> statement-breakpoint
ALTER TABLE "reference_solutions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "reference_solutions" ADD CONSTRAINT "reference_solutions_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reference_solutions_problem_id_idx" ON "reference_solutions" USING btree ("problem_id");--> statement-breakpoint
CREATE INDEX "reference_solutions_language_idx" ON "reference_solutions" USING btree ("language");--> statement-breakpoint
CREATE POLICY "reference_solutions_service_role_only" ON "reference_solutions" AS PERMISSIVE FOR ALL TO "service_role" USING (true);