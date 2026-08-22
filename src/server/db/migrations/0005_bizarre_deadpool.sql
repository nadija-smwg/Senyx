CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"storage_key" text NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"size_bytes" integer NOT NULL,
	"owner_type" varchar(50) NOT NULL,
	"owner_id" uuid NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
ALTER TABLE "permissions" DROP CONSTRAINT "module_action_scope_idx";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_employee_id_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
ALTER TABLE "projects" DROP CONSTRAINT "project_type_check";--> statement-breakpoint
ALTER TABLE "designations" ADD COLUMN "annual_leave_days" numeric(5, 2) DEFAULT '30.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN "approver_comment" text;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "documents_owner_idx" ON "documents" USING btree ("owner_type","owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "module_action_scope_idx" ON "permissions" USING btree ("module","action","scope");--> statement-breakpoint
CREATE UNIQUE INDEX "users_employee_id_unique" ON "users" USING btree ("employee_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email") WHERE deleted_at IS NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "project_type_check" CHECK ("projects"."type" IN ('solution', 'product', 'internal'));