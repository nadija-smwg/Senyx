-- Enable RLS for all HR tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE designations ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;

-- departments, designations, skills, leave_types
-- Authenticated → read; Admin → write
CREATE POLICY hr_lookups_select ON departments FOR SELECT TO authenticated USING (true);
CREATE POLICY hr_lookups_all_admin ON departments TO authenticated USING (
  EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = auth.uid() AND r.name = 'Admin')
);

CREATE POLICY des_lookups_select ON designations FOR SELECT TO authenticated USING (true);
CREATE POLICY des_lookups_all_admin ON designations TO authenticated USING (
  EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = auth.uid() AND r.name = 'Admin')
);

CREATE POLICY skills_lookups_select ON skills FOR SELECT TO authenticated USING (true);
CREATE POLICY skills_lookups_all_admin ON skills TO authenticated USING (
  EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = auth.uid() AND r.name = 'Admin')
);

CREATE POLICY lt_lookups_select ON leave_types FOR SELECT TO authenticated USING (true);
CREATE POLICY lt_lookups_all_admin ON leave_types TO authenticated USING (
  EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = auth.uid() AND r.name = 'Admin')
);

-- employees: HR/Admin → full access; Others → own record only (we'll enforce the public view in application logic, but RLS protects direct DB reads)
CREATE POLICY employees_select_own ON employees FOR SELECT USING (
  id = (SELECT employee_id FROM users WHERE id = auth.uid())
);
CREATE POLICY employees_all_admin_hr ON employees TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    JOIN roles r ON ur.role_id = r.id 
    WHERE ur.user_id = auth.uid() AND r.name IN ('Admin', 'HR Manager')
  )
);

-- employee_skills: own read/write, Admin read/write
CREATE POLICY es_select_own ON employee_skills FOR SELECT USING (
  employee_id = (SELECT employee_id FROM users WHERE id = auth.uid())
);
CREATE POLICY es_all_admin ON employee_skills TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    JOIN roles r ON ur.role_id = r.id 
    WHERE ur.user_id = auth.uid() AND r.name IN ('Admin', 'HR Manager')
  )
);

-- leave_balances: Own → read; HR/Admin → full
CREATE POLICY lb_select_own ON leave_balances FOR SELECT USING (
  employee_id = (SELECT employee_id FROM users WHERE id = auth.uid())
);
CREATE POLICY lb_all_admin ON leave_balances TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    JOIN roles r ON ur.role_id = r.id 
    WHERE ur.user_id = auth.uid() AND r.name IN ('Admin', 'HR Manager')
  )
);

-- leave_requests: Own → create/read own; Manager → read/decide; HR → full
CREATE POLICY lr_all_own ON leave_requests FOR ALL USING (
  employee_id = (SELECT employee_id FROM users WHERE id = auth.uid())
);
CREATE POLICY lr_select_manager ON leave_requests FOR SELECT USING (
  employee_id IN (SELECT id FROM employees WHERE manager_id = (SELECT employee_id FROM users WHERE id = auth.uid()))
);
CREATE POLICY lr_update_manager ON leave_requests FOR UPDATE USING (
  employee_id IN (SELECT id FROM employees WHERE manager_id = (SELECT employee_id FROM users WHERE id = auth.uid()))
);
CREATE POLICY lr_all_admin ON leave_requests TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    JOIN roles r ON ur.role_id = r.id 
    WHERE ur.user_id = auth.uid() AND r.name IN ('Admin', 'HR Manager')
  )
);

-- payroll_records: HR/Admin only (every access audited at app level)
CREATE POLICY pr_select_own ON payroll_records FOR SELECT USING (
  employee_id = (SELECT employee_id FROM users WHERE id = auth.uid())
);
CREATE POLICY pr_all_admin ON payroll_records TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    JOIN roles r ON ur.role_id = r.id 
    WHERE ur.user_id = auth.uid() AND r.name IN ('Admin', 'HR Manager', 'Finance')
  )
);

-- performance_reviews: Own → read own; Manager/HR → full
CREATE POLICY perf_select_own ON performance_reviews FOR SELECT USING (
  employee_id = (SELECT employee_id FROM users WHERE id = auth.uid())
);
CREATE POLICY perf_all_manager ON performance_reviews FOR ALL USING (
  reviewer_id = (SELECT employee_id FROM users WHERE id = auth.uid())
);
CREATE POLICY perf_all_admin ON performance_reviews TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    JOIN roles r ON ur.role_id = r.id 
    WHERE ur.user_id = auth.uid() AND r.name IN ('Admin', 'HR Manager')
  )
);
