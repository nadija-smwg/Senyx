import { NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { users } from '@/server/db/schema/identity';
import { designations } from '@/server/db/schema/hr';
import { createEmployee } from '@/server/services/employee.service';
import { createAccount, createContact } from '@/server/services/crm.service';
import { createDeal } from '@/server/services/deal.service';
import { createProject } from '@/server/services/project.service';
import { createInvoice } from '@/server/services/finance.service';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const bugs: string[] = [];
  
  try {
    // 1. Setup: Get a valid User ID
    const [user] = await db.select().from(users).limit(1);
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 400 });
    }
    const actorId = user.id;

    let [designation] = await db.select().from(designations).limit(1);
    if (!designation) {
      [designation] = await db.insert(designations).values({ title: 'Tester' }).returning();
    }
    
    // --- TEST 1: HR Module ---
    let newEmpId = null;
    try {
      const emp = await createEmployee({
        firstName: 'Test',
        lastName: 'Employee',
        email: `test.employee.${Date.now()}@senyx.com`,
        designationId: designation!.id,
        employmentType: 'full_time',
        startDate: new Date().toISOString().split('T')[0],
      }, actorId);
      newEmpId = emp?.id;
    } catch (err: any) {
      bugs.push(`HR Module - createEmployee: ${err.message} (Code: ${err.code}, Detail: ${err.detail})`);
    }

    // --- TEST 2: CRM Module ---
    let accountId = null;
    let contactId = null;
    let dealId = null;
    try {
      const acc = await createAccount({
        name: `Test Account ${Date.now()}`,
        industry: 'Tech',
        status: 'active'
      }, actorId);
      accountId = acc.id;

      const contact = await createContact({
        firstName: 'Contact',
        lastName: 'Test',
        accountId: accountId,
        email: `contact.${Date.now()}@example.com`
      }, actorId);
      contactId = contact.id;

      const deal = await createDeal({
        name: 'Test Deal',
        accountId: accountId,
        amount: 50000,
        stage: 'prospect',
        ownerId: user.employeeId
      }, actorId, user.employeeId);
      dealId = deal.id;
    } catch (err: any) {
      bugs.push(`CRM Module: ${err.message} (Code: ${err.code}, Detail: ${err.detail})`);
    }

    // --- TEST 3: Projects Module ---
    let projectId = null;
    try {
      if (!accountId) throw new Error('Account creation failed previously');
      
      const proj = await createProject({
        name: 'Test Project',
        type: 'solution',
        accountId: accountId,
        dealId: dealId,
        billingType: 'fixed',
        budget: 50000,
      }, actorId, user.employeeId);
      projectId = proj.id;
    } catch (err: any) {
      bugs.push(`Projects Module - createProject: ${err.message} (Code: ${err.code}, Detail: ${err.detail})`);
    }

    // --- TEST 4: Finance Module ---
    try {
      if (!accountId) throw new Error('Account creation failed previously');
      
      const inv = await createInvoice({
        accountId: accountId,
        projectId: projectId,
        type: 'standard',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
        subtotal: 1500,
        tax: 0,
        total: 1500,
        currency: 'USD',
        items: [
          { description: 'Consulting', quantity: 10, unitPrice: 150, amount: 1500 }
        ]
      }, actorId);
    } catch (err: any) {
      bugs.push(`Finance Module - createInvoice: ${err.message} (Code: ${err.code}, Detail: ${err.detail})`);
    }

    return NextResponse.json({
      success: true,
      totalBugsFound: bugs.length,
      bugs
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
