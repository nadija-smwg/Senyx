CREATE TABLE "project_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid,
	"project_id" uuid NOT NULL,
	"name" varchar(80) NOT NULL,
	"url" text NOT NULL,
	"description" text,
	"position" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" DROP CONSTRAINT "project_account_required_check";--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "company_name" varchar(140);--> statement-breakpoint
ALTER TABLE "project_links" ADD CONSTRAINT "project_links_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "link_project_idx" ON "project_links" USING btree ("project_id");--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "project_account_required_check" CHECK ("projects"."type" IN ('product', 'internal') OR "projects"."account_id" IS NOT NULL);