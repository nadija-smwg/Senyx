import { db } from '../db/client';
import { employees, employeeSkills, leaveBalances, leaveTypes } from '../db/schema/hr';
import { users } from '../db/schema/identity';
import { eq, and } from 'drizzle-orm';
import { auditLogs } from '../db/schema/platform';
import { encrypt, decrypt } from '../lib/crypto';
import { supabaseAdmin } from '../lib/supabase-admin';
import { generateEmployeeCode } from '../lib/code-generator';
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
    console.error("Failed to insert audit log", e);
  }
}

export async function listEmployees(scope: 'all' | 'own', userId: string, employeeId?: string) {
  const allEmps = await db.select().from(employees);
  
  if (scope === 'own' && employeeId) {
    const ownEmp = allEmps.find(e => e.id === employeeId);
    return ownEmp ? [ownEmp] : [];
  }
  
  // Return all but mask sensitive fields for standard lists unless requested specifically
  return allEmps.map(e => ({
    ...e,
    salary: scope === 'all' ? decrypt(e.salary) : null,
    bankDetails: scope === 'all' ? decrypt(e.bankDetails) : null,
    nationalId: scope === 'all' ? decrypt(e.nationalId) : null,
  }));
}

export async function createEmployee(input: any, actorUserId: string) {
  // 1. Generate Code
  const code = await generateEmployeeCode();
  
  // 2. Encrypt sensitive fields
  const encSalary = input.salary ? encrypt(input.salary) : null;
  const encBank = input.bankDetails ? encrypt(JSON.stringify(input.bankDetails)) : null;
  const encNationalId = input.nationalId ? encrypt(input.nationalId) : null;
  
  // 3. Create Employee
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
    salary: encSalary,
    bankDetails: encBank,
    nationalId: encNationalId,
  }).returning();

  // 4. Create Supabase Auth User
  const { data: authUser, error } = await supabaseAdmin.auth.admin.createUser({
    email: input.email,
    password: 'TempPassword123!',
    email_confirm: true,
  });

  if (error || !authUser.user) {
    console.error('Supabase auth error:', error);
    throw new Error(`Failed to create auth user: ${error?.message || JSON.stringify(error)}`);
  }

  // 5. Initialize Leave Balances
  const allLeaveTypes = await db.select().from(leaveTypes);
  const currentYear = new Date().getFullYear();
  
  const balancesToInsert = allLeaveTypes.map(lt => ({
    employeeId: newEmp!.id,
    leaveTypeId: lt.id,
    year: currentYear,
    balanceDays: lt.defaultAnnualDays,
  }));
  
  if (balancesToInsert.length > 0) {
    await db.insert(leaveBalances).values(balancesToInsert);
  }

  // 6. Audit
  await auditAction({
    userId: actorUserId,
    action: 'employee.create',
    module: 'hr',
    targetId: newEmp!.id,
    ipAddress: '127.0.0.1', // Should come from context in real implementation
    details: { employeeCode: code },
  });

  return newEmp;
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
  // Soft delete employee
  await db.update(employees)
    .set({ status: 'terminated', deletedAt: new Date() })
    .where(eq(employees.id, id));
    
  // Find linked user
  const [user] = await db.select().from(users).where(eq(users.employeeId, id));
  
  if (user) {
    // Deactivate application user
    await db.update(users).set({ isActive: false }).where(eq(users.id, user.id));
    
    // Suspend in Supabase Auth
    // Note: admin.updateUserById isn't documented to suspend easily without deleting, 
    // but setting ban_duration works in true enterprise. 
    // We will just change their password to lock them out or use admin.deleteUser if needed.
    // For now we rely on the isActive check in middleware.
  }

  await auditAction({
    userId: actorUserId,
    action: 'employee.deactivate',
    module: 'hr',
    targetId: id,
    ipAddress: '127.0.0.1',
    details: {},
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
