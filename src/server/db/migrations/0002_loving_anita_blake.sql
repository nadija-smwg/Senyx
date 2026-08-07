CREATE TABLE "board_columns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid,
	"project_id" uuid NOT NULL,
	"name" varchar(40) NOT NULL,
	"position" smallint NOT NULL,
	"wip_limit" smallint,
	CONSTRAINT "unique_column_position" UNIQUE("project_id","position"),
	CONSTRAINT "board_wip_check" CHECK ("board_columns"."wip_limit" >= 0)
);
--> statement-breakpoint
CREATE TABLE "clock_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid,
	"project_id" uuid NOT NULL,
	"task_id" uuid,
	"employee_id" uuid NOT NULL,
	"clock_in_at" timestamp with time zone DEFAULT now() NOT NULL,
	"clock_out_at" timestamp with time zone,
	"duration_seconds" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "clock_out_check" CHECK ("clock_sessions"."clock_out_at" > "clock_sessions"."clock_in_at"),
	CONSTRAINT "clock_duration_check" CHECK ("clock_sessions"."duration_seconds" >= 0)
);
--> statement-breakpoint
CREATE TABLE "milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid,
	"project_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text,
	"due_date" date,
	"status" varchar(12) DEFAULT 'pending' NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "milestone_status_check" CHECK ("milestones"."status" IN ('pending', 'in_progress', 'completed'))
);
--> statement-breakpoint
CREATE TABLE "payment_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid,
	"project_id" uuid NOT NULL,
	"name" varchar(80) NOT NULL,
	"phase" varchar(60),
	"sequence" smallint NOT NULL,
	"percentage" numeric(5, 2),
	"amount" numeric(14, 2),
	"currency" varchar(3) NOT NULL,
	"status" varchar(10) DEFAULT 'pending' NOT NULL,
	"expected_date" date,
	"invoice_id" uuid,
	"completed_at" timestamp with time zone,
	CONSTRAINT "unique_payment_sequence" UNIQUE("project_id","sequence"),
	CONSTRAINT "payment_pct_check" CHECK ("payment_milestones"."percentage" >= 0 AND "payment_milestones"."percentage" <= 100),
	CONSTRAINT "payment_amount_check" CHECK ("payment_milestones"."amount" >= 0),
	CONSTRAINT "payment_status_check" CHECK ("payment_milestones"."status" IN ('pending', 'due', 'invoiced', 'paid'))
);
--> statement-breakpoint
CREATE TABLE "project_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid,
	"project_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"role_on_project" varchar(40),
	"allocation_pct" numeric(5, 2),
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"unassigned_at" timestamp with time zone,
	CONSTRAINT "assignment_allocation_check" CHECK ("project_assignments"."allocation_pct" >= 0 AND "project_assignments"."allocation_pct" <= 100)
);
--> statement-breakpoint
CREATE TABLE "project_risks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid,
	"project_id" uuid NOT NULL,
	"title" varchar(160) NOT NULL,
	"description" text,
	"severity" varchar(8),
	"status" varchar(10) DEFAULT 'open' NOT NULL,
	"owner_id" uuid,
	CONSTRAINT "risk_severity_check" CHECK ("project_risks"."severity" IN ('low', 'medium', 'high', 'critical')),
	CONSTRAINT "risk_status_check" CHECK ("project_risks"."status" IN ('open', 'mitigating', 'closed'))
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid,
	"code" varchar(20) NOT NULL,
	"name" varchar(140) NOT NULL,
	"type" varchar(10),
	"account_id" uuid,
	"deal_id" uuid,
	"owner_id" uuid NOT NULL,
	"billing_type" varchar(15),
	"status" varchar(12) DEFAULT 'planning' NOT NULL,
	"start_date" date,
	"end_date" date,
	"budget" numeric(14, 2),
	"currency" varchar(3) NOT NULL,
	CONSTRAINT "projects_code_unique" UNIQUE("code"),
	CONSTRAINT "project_type_check" CHECK ("projects"."type" IN ('solution', 'product')),
	CONSTRAINT "project_billing_check" CHECK ("projects"."billing_type" IN ('fixed', 'time_materials', 'retainer')),
	CONSTRAINT "project_status_check" CHECK ("projects"."status" IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
	CONSTRAINT "project_dates_check" CHECK ("projects"."end_date" >= "projects"."start_date"),
	CONSTRAINT "project_budget_check" CHECK ("projects"."budget" >= 0),
	CONSTRAINT "project_account_required_check" CHECK ("projects"."type" = 'product' OR "projects"."account_id" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid,
	"project_id" uuid NOT NULL,
	"column_id" uuid NOT NULL,
	"parent_task_id" uuid,
	"title" varchar(200) NOT NULL,
	"description" text,
	"assignee_id" uuid,
	"priority" varchar(8) DEFAULT 'medium' NOT NULL,
	"status" varchar(12) DEFAULT 'todo' NOT NULL,
	"estimate_hours" numeric(6, 2),
	"due_date" date,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "task_priority_check" CHECK ("tasks"."priority" IN ('low', 'medium', 'high', 'urgent')),
	CONSTRAINT "task_status_check" CHECK ("tasks"."status" IN ('todo', 'in_progress', 'review', 'done', 'blocked')),
	CONSTRAINT "task_estimate_check" CHECK ("tasks"."estimate_hours" >= 0)
);
--> statement-breakpoint
CREATE TABLE "time_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid,
	"project_id" uuid NOT NULL,
	"task_id" uuid,
	"employee_id" uuid NOT NULL,
	"work_date" date NOT NULL,
	"hours" numeric(6, 2) NOT NULL,
	"description" text,
	"billable" boolean DEFAULT true NOT NULL,
	"source" varchar(6) DEFAULT 'manual' NOT NULL,
	"clock_session_id" uuid,
	CONSTRAINT "time_hours_check" CHECK ("time_entries"."hours" > 0 AND "time_entries"."hours" <= 24),
	CONSTRAINT "time_source_check" CHECK ("time_entries"."source" IN ('manual', 'clock'))
);
--> statement-breakpoint
ALTER TABLE "board_columns" ADD CONSTRAINT "board_columns_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clock_sessions" ADD CONSTRAINT "clock_sessions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clock_sessions" ADD CONSTRAINT "clock_sessions_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clock_sessions" ADD CONSTRAINT "clock_sessions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_milestones" ADD CONSTRAINT "payment_milestones_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_risks" ADD CONSTRAINT "project_risks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_risks" ADD CONSTRAINT "project_risks_owner_id_employees_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_employees_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_column_id_board_columns_id_fk" FOREIGN KEY ("column_id") REFERENCES "public"."board_columns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_employees_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_clock_session_id_clock_sessions_id_fk" FOREIGN KEY ("clock_session_id") REFERENCES "public"."clock_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "column_project_pos_idx" ON "board_columns" USING btree ("project_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_active_clock" ON "clock_sessions" USING btree ("employee_id") WHERE "clock_sessions"."is_active" = true;--> statement-breakpoint
CREATE INDEX "milestone_project_status_idx" ON "milestones" USING btree ("project_id","status");--> statement-breakpoint
CREATE INDEX "payment_project_status_idx" ON "payment_milestones" USING btree ("project_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_active_assignment" ON "project_assignments" USING btree ("project_id","employee_id") WHERE "project_assignments"."unassigned_at" IS NULL;--> statement-breakpoint
CREATE INDEX "assignment_project_idx" ON "project_assignments" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "assignment_employee_idx" ON "project_assignments" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "risk_project_idx" ON "project_risks" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_account_idx" ON "projects" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "project_deal_idx" ON "projects" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "project_owner_idx" ON "projects" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "project_status_idx" ON "projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "task_board_idx" ON "tasks" USING btree ("project_id","column_id","position");--> statement-breakpoint
CREATE INDEX "task_assignee_idx" ON "tasks" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX "task_duedate_idx" ON "tasks" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "time_project_employee_idx" ON "time_entries" USING btree ("project_id","employee_id");--> statement-breakpoint
CREATE INDEX "time_workdate_idx" ON "time_entries" USING btree ("work_date");