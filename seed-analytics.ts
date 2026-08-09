import { db } from './src/server/db/client';
import { deals } from './src/server/db/schema/sales';
import { accounts } from './src/server/db/schema/crm';
import { employees } from './src/server/db/schema/hr';
import { projects } from './src/server/db/schema/projects';
import { invoices } from './src/server/db/schema/finance';

async function seed() {
  console.log("Seeding test data for Analytics...");
  
  // 1. Get or create a user/employee
  let employee = await db.select().from(employees).limit(1);
  if (employee.length === 0) {
    console.log("No employee found. Creating dummy employee...");
    // we would need to create a user first, too complex. 
    // Usually there's an admin employee. Let's assume there's one.
  }
  
  let account = await db.select().from(accounts).limit(1);
  if (account.length === 0) {
    console.log("No account found. Creating dummy account...");
    const newAcc = await db.insert(accounts).values({
      name: "Acme Corp (Test)",
      industry: "Technology",
      type: "customer",
      status: "active",
      createdBy: employee[0].id,
      updatedBy: employee[0].id
    }).returning();
    account = newAcc;
  }

  // Insert Deals
  await db.insert(deals).values([
    {
      name: "Enterprise Software License",
      accountId: account[0].id,
      ownerId: employee[0].id,
      amount: "150000.00",
      currency: "USD",
      stage: "proposal",
      probability: "75",
      status: "open",
      createdBy: employee[0].id,
      updatedBy: employee[0].id,
    },
    {
      name: "Consulting Services",
      accountId: account[0].id,
      ownerId: employee[0].id,
      amount: "25000.00",
      currency: "USD",
      stage: "qualified",
      probability: "40",
      status: "open",
      createdBy: employee[0].id,
      updatedBy: employee[0].id,
    },
    {
      name: "Cloud Migration Project",
      accountId: account[0].id,
      ownerId: employee[0].id,
      amount: "80000.00",
      currency: "USD",
      stage: "won",
      probability: "100",
      status: "won",
      createdBy: employee[0].id,
      updatedBy: employee[0].id,
    }
  ]);

  console.log("Seeded 3 Deals.");

  // Insert Projects
  await db.insert(projects).values([
    {
      code: "PRJ-001",
      name: "Cloud Migration Implementation",
      accountId: account[0].id,
      ownerId: employee[0].id,
      budget: "60000.00",
      currency: "USD",
      status: "active",
      startDate: "2026-08-01",
      createdBy: employee[0].id,
      updatedBy: employee[0].id,
    }
  ]);

  console.log("Seeded 1 Project.");

  // Insert Invoices
  await db.insert(invoices).values([
    {
      invoiceNumber: "INV-1001",
      accountId: account[0].id,
      projectId: null,
      subtotal: "25000.00",
      taxTotal: "0",
      total: "25000.00",
      currency: "USD",
      status: "sent",
      issueDate: "2026-08-05",
      dueDate: "2026-09-05",
      createdBy: employee[0].id,
      updatedBy: employee[0].id,
    }
  ]);

  console.log("Seeded 1 Invoice.");

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch(console.error);
