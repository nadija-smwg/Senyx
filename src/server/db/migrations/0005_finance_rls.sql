-- Enable RLS
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoice_line_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "expenses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;

-- 1) Invoices
-- Finance/Admin -> full access
CREATE POLICY "Finance and Admin full access to invoices" ON "invoices"
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'finance')
        )
    );

-- Project Owner -> view own project invoices
CREATE POLICY "Project Owner view own project invoices" ON "invoices"
    FOR SELECT
    TO authenticated
    USING (
        project_id IN (
            SELECT p.id FROM projects p
            WHERE p.owner_id = (SELECT u.employee_id FROM users u WHERE u.id = auth.uid())
        )
    );

-- 2) Invoice Line Items
-- Inherit from invoices implicitly for viewing if we do it via app logic, but let's add basic policies
CREATE POLICY "Finance and Admin full access to invoice_line_items" ON "invoice_line_items"
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'finance')
        )
    );

CREATE POLICY "Project Owner view own project invoice line items" ON "invoice_line_items"
    FOR SELECT
    TO authenticated
    USING (
        invoice_id IN (
            SELECT i.id FROM invoices i
            JOIN projects p ON i.project_id = p.id
            WHERE p.owner_id = (SELECT u.employee_id FROM users u WHERE u.id = auth.uid())
        )
    );

-- 3) Expenses
-- Finance/Admin -> full access
CREATE POLICY "Finance and Admin full access to expenses" ON "expenses"
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'finance')
        )
    );

-- Employee -> own expenses
CREATE POLICY "Employee full access to own expenses" ON "expenses"
    FOR ALL
    TO authenticated
    USING (
        created_by = auth.uid()
    );

-- Project Owner -> view own project expenses
CREATE POLICY "Project Owner view own project expenses" ON "expenses"
    FOR SELECT
    TO authenticated
    USING (
        project_id IN (
            SELECT p.id FROM projects p
            WHERE p.owner_id = (SELECT u.employee_id FROM users u WHERE u.id = auth.uid())
        )
    );

-- 4) Payments
-- Finance/Admin -> full access
CREATE POLICY "Finance and Admin full access to payments" ON "payments"
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'finance')
        )
    );

-- 5) Subscriptions
-- Finance/Admin -> full access
CREATE POLICY "Finance and Admin full access to subscriptions" ON "subscriptions"
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'finance')
        )
    );
