CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid,
	"vendor" varchar(120) NOT NULL,
	"category" varchar(60) NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"currency" char(3) NOT NULL,
	"expense_date" date NOT NULL,
	"project_id" uuid,
	"approval_status" varchar(12) DEFAULT 'pending' NOT NULL,
	"approver_id" uuid,
	"receipt_document_id" uuid,
	CONSTRAINT "expense_amount_check" CHECK ("expenses"."amount" >= 0),
	CONSTRAINT "expense_approval_check" CHECK ("expenses"."approval_status" IN ('pending', 'approved', 'rejected', 'reimbursed'))
);
--> statement-breakpoint
CREATE TABLE "invoice_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"description" varchar(200) NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit_price" numeric(14, 2) NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "line_item_qty_check" CHECK ("invoice_line_items"."quantity" > 0),
	CONSTRAINT "line_item_price_check" CHECK ("invoice_line_items"."unit_price" >= 0),
	CONSTRAINT "line_item_amount_check" CHECK ("invoice_line_items"."amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid,
	"invoice_number" varchar(20) NOT NULL,
	"account_id" uuid NOT NULL,
	"project_id" uuid,
	"deal_id" uuid,
	"payment_milestone_id" uuid,
	"issue_date" date,
	"due_date" date,
	"subtotal" numeric(14, 2) NOT NULL,
	"tax" numeric(14, 2) DEFAULT '0' NOT NULL,
	"total" numeric(14, 2) NOT NULL,
	"currency" char(3) NOT NULL,
	"status" varchar(12) DEFAULT 'draft' NOT NULL,
	"paid_at" timestamp with time zone,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number"),
	CONSTRAINT "invoice_due_date_check" CHECK ("invoices"."due_date" >= "invoices"."issue_date" OR "invoices"."issue_date" IS NULL),
	CONSTRAINT "invoice_subtotal_check" CHECK ("invoices"."subtotal" >= 0),
	CONSTRAINT "invoice_tax_check" CHECK ("invoices"."tax" >= 0),
	CONSTRAINT "invoice_total_check" CHECK ("invoices"."total" >= 0),
	CONSTRAINT "invoice_status_check" CHECK ("invoices"."status" IN ('draft', 'sent', 'paid', 'overdue', 'void'))
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid,
	"invoice_id" uuid,
	"expense_id" uuid,
	"amount" numeric(14, 2) NOT NULL,
	"currency" char(3) NOT NULL,
	"method" varchar(15) NOT NULL,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reference" varchar(80),
	"exchange_rate" numeric(14, 6),
	CONSTRAINT "payment_link_check" CHECK ("payments"."invoice_id" IS NOT NULL OR "payments"."expense_id" IS NOT NULL),
	CONSTRAINT "payment_amount_check" CHECK ("payments"."amount" > 0),
	CONSTRAINT "payment_method_check" CHECK ("payments"."method" IN ('bank_transfer', 'card', 'cash', 'cheque', 'online'))
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid,
	"account_id" uuid NOT NULL,
	"product_name" varchar(80) NOT NULL,
	"plan" varchar(60),
	"amount" numeric(14, 2) NOT NULL,
	"currency" char(3) NOT NULL,
	"interval" varchar(10) NOT NULL,
	"status" varchar(12) DEFAULT 'active' NOT NULL,
	"started_at" date NOT NULL,
	"current_period_end" date,
	"mrr" numeric(14, 2),
	CONSTRAINT "subscription_amount_check" CHECK ("subscriptions"."amount" >= 0),
	CONSTRAINT "subscription_interval_check" CHECK ("subscriptions"."interval" IN ('monthly', 'quarterly', 'annual')),
	CONSTRAINT "subscription_status_check" CHECK ("subscriptions"."status" IN ('trialing', 'active', 'past_due', 'cancelled'))
);
--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_approver_id_employees_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_payment_milestone_id_payment_milestones_id_fk" FOREIGN KEY ("payment_milestone_id") REFERENCES "public"."payment_milestones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "expense_project_idx" ON "expenses" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "expense_approval_idx" ON "expenses" USING btree ("approval_status");--> statement-breakpoint
CREATE INDEX "line_item_invoice_idx" ON "invoice_line_items" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "invoice_account_idx" ON "invoices" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "invoice_project_idx" ON "invoices" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "invoice_deal_idx" ON "invoices" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "invoice_payment_milestone_idx" ON "invoices" USING btree ("payment_milestone_id");--> statement-breakpoint
CREATE INDEX "invoice_status_due_idx" ON "invoices" USING btree ("status","due_date");--> statement-breakpoint
CREATE INDEX "invoice_active_idx" ON "invoices" USING btree ("status") WHERE "invoices"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "payment_invoice_idx" ON "payments" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "payment_expense_idx" ON "payments" USING btree ("expense_id");--> statement-breakpoint
CREATE INDEX "subscription_account_idx" ON "subscriptions" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "subscription_status_idx" ON "subscriptions" USING btree ("status");