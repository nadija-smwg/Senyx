import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { withAuth } from '@/server/middleware/auth';
import { listEmployees } from '@/server/services/employee.service';
import { EmployeesClient } from './employees-client';

export const dynamic = 'force-dynamic';

export default async function EmployeesPage() {
  const reqHeaders = await headers();
  const req = new NextRequest(new URL('http://localhost/api/employees'), {
    headers: reqHeaders,
  });
  
  let scope: 'all' | 'own' = 'own';
  let userId = '';
  let employeeId = '';
  
  try {
    const ctx = await withAuth(req);
    userId = ctx.userId;
    employeeId = ctx.employeeId || '';
    if (ctx.roles.includes('Admin') || ctx.roles.includes('HR Manager')) {
      scope = 'all';
    }
  } catch (error) {
    // If not authenticated, page shouldn't be accessible anyway due to middleware,
    // but we handle gracefully.
  }

  const employeesData = await listEmployees(scope, userId, employeeId);

  return <EmployeesClient initialData={employeesData as any[]} />;
}
