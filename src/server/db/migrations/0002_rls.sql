-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- users: own user can SELECT own record; Admin can SELECT/UPDATE all
CREATE POLICY users_select_own ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_all_admin ON users TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    JOIN roles r ON ur.role_id = r.id 
    WHERE ur.user_id = auth.uid() AND r.name = 'Admin'
  )
);

-- roles: Admin only for modification; authenticated for read
CREATE POLICY roles_select_auth ON roles FOR SELECT TO authenticated USING (true);
CREATE POLICY roles_all_admin ON roles TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    JOIN roles r ON ur.role_id = r.id 
    WHERE ur.user_id = auth.uid() AND r.name = 'Admin'
  )
);

-- permissions & role_permissions: authenticated for read, Admin for write
CREATE POLICY permissions_select_auth ON permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY role_permissions_select_auth ON role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY permissions_all_admin ON permissions TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    JOIN roles r ON ur.role_id = r.id 
    WHERE ur.user_id = auth.uid() AND r.name = 'Admin'
  )
);
CREATE POLICY role_permissions_all_admin ON role_permissions TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    JOIN roles r ON ur.role_id = r.id 
    WHERE ur.user_id = auth.uid() AND r.name = 'Admin'
  )
);
CREATE POLICY user_roles_all_admin ON user_roles TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    JOIN roles r ON ur.role_id = r.id 
    WHERE ur.user_id = auth.uid() AND r.name = 'Admin'
  )
);

-- sessions: Admin can view all; users see own sessions
CREATE POLICY sessions_select_own ON sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY sessions_all_admin ON sessions TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    JOIN roles r ON ur.role_id = r.id 
    WHERE ur.user_id = auth.uid() AND r.name = 'Admin'
  )
);

-- audit_logs: Admin/Auditor only (no modifications allowed due to trigger, but restrict SELECT)
CREATE POLICY audit_logs_select ON audit_logs FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    JOIN roles r ON ur.role_id = r.id 
    WHERE ur.user_id = auth.uid() AND r.name IN ('Admin', 'Auditor')
  )
);

-- settings: Admin only for write; authenticated for read
CREATE POLICY settings_select_auth ON settings FOR SELECT TO authenticated USING (true);
CREATE POLICY settings_all_admin ON settings TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    JOIN roles r ON ur.role_id = r.id 
    WHERE ur.user_id = auth.uid() AND r.name = 'Admin'
  )
);
