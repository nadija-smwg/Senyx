import { db } from '../db/client';
import { employees, employeeSkills, leaveBalances, leaveTypes, departments, designations } from '../db/schema/hr';
import { users, userRoles, roles } from '../db/schema/identity';
import { eq, and, desc } from 'drizzle-orm';
import { auditLogs } from '../db/schema/platform';
import { encrypt, decrypt } from '../lib/crypto';
import { getSupabaseAdmin } from '../lib/supabase-admin';
import { generateEmployeeCode } from '../lib/code-generator';
import { AppError, ConflictError, NotFoundError } from '../types/errors';

async function auditAction(data: any) {
  try {
    await db.insert(auditLogs).values({
      actorId: data.userId || null,
      action: data.action,
      apiRoute: '/api/employees',
      entityType: data.module,
      entityId: data.targetId || null,
      result: 'success',
      after: data.details,
      ipAddress: data.ipAddress,
    });
  } catch (e) {
    console.error('Failed to insert audit log', e);
  }
}

export async function listEmployees(scope: 'all' | 'own', userId: string, employeeId?: string) {
  const allEmpsData = await db.select({
    employee: employees,
    departmentName: departments.name,
    designationTitle: designations.title
  })
  .from(employees)
  .leftJoin(departments, eq(employees.departmentId, departments.id))
  .leftJoin(designations, eq(employees.designationId, designations.id))
  .orderBy(desc(employees.createdAt));
  
  const allEmps = allEmpsData.map(row => ({
    ...row.employee,
    departmentName: row.departmentName,
    designationTitle: row.designationTitle
  }));

  if (scope === 'own' && employeeId) {
    const ownEmp = allEmps.find(e => e.id === employeeId);
    return ownEmp ? [ownEmp] : [];
  }
  
  // Return all but mask sensitive fields for standard lists
  return allEmps.map(e => ({
    ...e,
    salary: scope === 'all' ? decrypt(e.salary) : null,
    bankDetails: scope === 'all' ? decrypt(e.bankDetails) : null,
    nationalId: scope === 'all' ? decrypt(e.nationalId) : null,
  }));
}

export async function createEmployee(input: any, actorUserId: string) {
  const supabaseAdmin = getSupabaseAdmin();

  // ── 1. Duplicate email check (employees table) ─────────────────────────────
  const [existingEmp] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.email, input.email))
    .limit(1);

  if (existingEmp) {
    throw new ConflictError('An employee with this email already exists.');
  }

  // ── 2. Duplicate check in Supabase auth (via admin API) ────────────────────
  // We use listUsers + filter since Supabase admin doesn't expose getUserByEmail directly
  const { data: existingAuthUsers } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1,
  });
  // Quick check via getUserByEmail equivalent — try to sign up and handle conflict
  // Instead we rely on Supabase returning error code 'email_exists' on createUser below.

  // ── 3. Generate employee code ──────────────────────────────────────────────
  const code = await generateEmployeeCode();

  // ── 4. Encrypt sensitive fields ────────────────────────────────────────────
  const encSalary = input.salary ? encrypt(input.salary) : null;
  const encBank = input.bankDetails ? encrypt(JSON.stringify(input.bankDetails)) : null;
  const encNationalId = input.nationalId ? encrypt(input.nationalId) : null;

  // ── 5. Create Employee record ──────────────────────────────────────────────
  const [newEmp] = await db.insert(employees).values({
    employeeCode: code,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone,
    designationId: input.designationId,
    departmentId: input.departmentId,
    managerId: input.managerId,
    employmentType: input.employmentType,
    startDate: input.startDate,
    status: 'active',
    salary: encSalary,
    bankDetails: encBank,
    nationalId: encNationalId,
  }).returning();

  // ── 6. Create Supabase Auth User ──────────────────────────────────────────
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: input.email,
    password: input.initialPassword,
    email_confirm: true, // Skip email verification — admin-provisioned account
    user_metadata: {
      firstName: input.firstName,
      lastName: input.lastName,
      employeeCode: code,
      // Flag so the employee knows to change their password on first login
      mustChangePassword: true,
    },
  });

  if (authError || !authUser.user) {
    // Rollback employee record on auth failure
    await db.delete(employees).where(eq(employees.id, newEmp!.id));
    
    const msg = authError?.message || 'Failed to create authentication account';
    const isEmailConflict = msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exists');
    if (isEmailConflict) {
      throw new ConflictError('An account with this email already exists in the authentication system.');
    }
    throw new AppError(msg, 400, 'AUTH_CREATION_FAILED');
  }

  const supabaseUserId = authUser.user.id;

  // ── 7. Insert users table row (links Supabase auth ↔ employee) ─────────────
  const [newUser] = await db.insert(users).values({
    id: supabaseUserId,
    employeeId: newEmp!.id,
    email: input.email,
    isActive: true,
  }).returning();

  // ── 8. Assign role ─────────────────────────────────────────────────────────
  if (input.roleId) {
    const [role] = await db.select().from(roles).where(eq(roles.id, input.roleId)).limit(1);
    if (role) {
      await db.insert(userRoles).values({
        userId: supabaseUserId,
        roleId: input.roleId,
      }).onConflictDoNothing();
    }
  } else {
    // Default to 'Employee' role if none specified
    const [employeeRole] = await db.select().from(roles).where(eq(roles.name, 'Employee')).limit(1);
    if (employeeRole) {
      await db.insert(userRoles).values({
        userId: supabaseUserId,
        roleId: employeeRole.id,
      }).onConflictDoNothing();
    }
  }

  // ── 9. Initialize Leave Balances ──────────────────────────────────────────
  const allLeaveTypes = await db.select().from(leaveTypes);
  const currentYear = new Date().getFullYear();

  const [empDesignation] = await db.select().from(designations).where(eq(designations.id, input.designationId));
  const annualLeaveDays = empDesignation?.annualLeaveDays || '30.00';

  const balancesToInsert = allLeaveTypes.map(lt => ({
    employeeId: newEmp!.id,
    leaveTypeId: lt.id,
    year: currentYear,
    balanceDays: lt.name === 'Annual' ? annualLeaveDays : lt.defaultAnnualDays,
  }));

  if (balancesToInsert.length > 0) {
    await db.insert(leaveBalances).values(balancesToInsert);
  }

  // ── 10. Audit ──────────────────────────────────────────────────────────────
  await auditAction({
    userId: actorUserId,
    action: 'employee.create',
    module: 'hr',
    targetId: newEmp!.id,
    ipAddress: '127.0.0.1',
    details: { employeeCode: code, email: input.email },
  });

  return { ...newEmp, employeeCode: code };
}

export async function getEmployeeById(id: string, scope: 'all' | 'own', currentEmployeeId?: string) {
  if (scope === 'own' && id !== currentEmployeeId) {
    throw new Error('Unauthorized access');
  }

  const [emp] = await db.select().from(employees).where(eq(employees.id, id));
  if (!emp) return null;

  return {
    ...emp,
    salary: (scope === 'all' || scope === 'own') ? decrypt(emp.salary) : null,
    bankDetails: (scope === 'all' || scope === 'own') ? decrypt(emp.bankDetails) : null,
    nationalId: (scope === 'all' || scope === 'own') ? decrypt(emp.nationalId) : null,
  };
}

export async function updateEmployee(id: string, input: any, actorUserId: string) {
  const encSalary = input.salary !== undefined ? encrypt(input.salary) : undefined;
  const encBank = input.bankDetails !== undefined ? encrypt(JSON.stringify(input.bankDetails)) : undefined;
  const encNationalId = input.nationalId !== undefined ? encrypt(input.nationalId) : undefined;
  
  const updateData: any = { ...input };
  if (encSalary !== undefined) updateData.salary = encSalary;
  if (encBank !== undefined) updateData.bankDetails = encBank;
  if (encNationalId !== undefined) updateData.nationalId = encNationalId;

  const [updated] = await db.update(employees).set(updateData).where(eq(employees.id, id)).returning();
  
  await auditAction({
    userId: actorUserId,
    action: 'employee.update',
    module: 'hr',
    targetId: id,
    ipAddress: '127.0.0.1',
    details: { updatedFields: Object.keys(input) },
  });

  return updated;
}

export async function deactivateEmployee(id: string, actorUserId: string) {
  const [emp] = await db.select().from(employees).where(eq(employees.id, id));
  if (!emp) throw new NotFoundError('Employee not found');

  // Soft suspend — do NOT delete or set terminated; status remains reversible
  await db.update(employees)
    .set({ status: 'suspended' })
    .where(eq(employees.id, id));

  // Find and deactivate linked user record
  const [user] = await db.select().from(users).where(eq(users.employeeId, id));

  if (user) {
    await db.update(users).set({ isActive: false }).where(eq(users.id, user.id));

    // Ban in Supabase Auth so active sessions are also invalidated
    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      ban_duration: '876000h', // ~100 years = effectively permanent until explicitly lifted
    });
  }

  await auditAction({
    userId: actorUserId,
    action: 'employee.deactivate',
    module: 'hr',
    targetId: id,
    ipAddress: '127.0.0.1',
    details: { status: 'suspended' },
  });
}

export async function activateEmployee(id: string, actorUserId: string) {
  const [emp] = await db.select().from(employees).where(eq(employees.id, id));
  if (!emp) throw new NotFoundError('Employee not found');

  // Re-activate employee record
  await db.update(employees)
    .set({ status: 'active' })
    .where(eq(employees.id, id));

  // Re-activate linked user record
  const [user] = await db.select().from(users).where(eq(users.employeeId, id));

  if (user) {
    await db.update(users).set({ isActive: true }).where(eq(users.id, user.id));

    // Lift Supabase Auth ban
    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      ban_duration: 'none',
    });
  }

  await auditAction({
    userId: actorUserId,
    action: 'employee.activate',
    module: 'hr',
    targetId: id,
    ipAddress: '127.0.0.1',
    details: { status: 'active' },
  });
}

export async function addEmployeeSkill(employeeId: string, skillId: string, proficiency: number, certified: boolean, actorUserId: string) {
  await db.insert(employeeSkills).values({
    employeeId,
    skillId,
    proficiency,
    certified,
    certifiedAt: certified ? new Date().toISOString() : null,
  }).onConflictDoUpdate({
    target: [employeeSkills.employeeId, employeeSkills.skillId],
    set: { proficiency, certified, certifiedAt: certified ? new Date().toISOString() : null }
  });

  await auditAction({
    userId: actorUserId,
    action: 'employee.skill_add',
    module: 'hr',
    targetId: employeeId,
    ipAddress: '127.0.0.1',
    details: { skillId, proficiency },
  });
}
