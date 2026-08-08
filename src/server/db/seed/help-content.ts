import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());
import { db } from '../client';
import { settings } from '../schema/platform';

const helpData = [
  {
    slug: 'getting-started',
    title: 'Getting Started',
    content: `# Welcome to SENYX ERP!

Welcome to your new enterprise resource planning system. Senyx ERP integrates HR, Finance, Projects, Sales, and CRM into one seamless platform.

## First Steps
1. **Complete your profile**: Head over to settings and make sure your details are correct.
2. **Review your dashboard**: Your personalized dashboard gives you a daily overview of tasks and KPIs.
3. **Explore**: Use the sidebar on the left to navigate between different modules.

If you ever get stuck, you can always return to this Help Center by clicking the "Help" link in the sidebar.`,
    roles: []
  },
  {
    slug: 'dashboard',
    title: 'Dashboard Overview',
    content: `# Understanding Your Dashboard

The dashboard is your central hub for daily activities. It displays real-time metrics, recent activities, and pending tasks.

## Key Performance Indicators (KPIs)
- **Active Projects**: The number of projects currently in progress.
- **Pending Approvals**: Expense requests or leave requests waiting for your sign-off.
- **Recent Activity**: An audit trail of the latest actions relevant to you.`,
    roles: []
  },
  {
    slug: 'sales',
    title: 'Sales & Deals',
    content: `# Managing Sales Pipelines

The Sales module allows you to track potential revenue from lead to closed deal.

## Deal Stages
1. **Lead**: Initial contact.
2. **Qualified**: Prospect has intent and budget.
3. **Proposal**: Quote has been sent.
4. **Negotiation**: Reviewing terms.
5. **Won/Lost**: Final outcome.

## Quotes
You can generate quotes and attach PDFs directly to them in the Quotes tab.`,
    roles: ['sales', 'admin']
  },
  {
    slug: 'projects',
    title: 'Project Management',
    content: `# Managing Projects

Our Projects module uses Kanban boards to track task progression.

## Creating a Project
When a deal is marked as "Won", a project is automatically generated. You can also manually create one from the Projects page.

## Kanban Board
Drag and drop tasks between columns:
* **To Do**
* **In Progress**
* **In Review**
* **Done**

You can also clock in and track time against specific projects!`,
    roles: ['employee', 'manager', 'admin']
  },
  {
    slug: 'finance',
    title: 'Finance & Expenses',
    content: `# Finance Center

Manage the financial health of the organization.

## Submitting Expenses
Employees can submit expense requests.
1. Go to Finance > Expenses.
2. Click "Add Expense".
3. Fill out the vendor, amount, and date.
4. Attach your receipt PDF or image using the Receipts button!

Managers will review and approve expenses before they are reimbursed.`,
    roles: ['employee', 'finance', 'admin']
  },
  {
    slug: 'hr',
    title: 'Human Resources',
    content: `# HR Module

Manage employee records, skills, and leave balances.

## Employee Details
Click on any employee to view their:
- Contact information
- Skills Matrix
- Leave Balances
- Sensitive info (Salary, SSN) - **Requires HR/Admin role**
- Documents (NDAs, Contracts)

## Leave Requests
Employees request time off, which routes to their manager for approval.`,
    roles: ['employee', 'hr', 'admin']
  },
  {
    slug: 'settings',
    title: 'Settings & Admin',
    content: `# System Administration

As an Admin, you have full control over the ERP setup.

## Roles & Permissions
Navigate to **Settings > Roles** to manage what different user groups can access.

## Help Editor
You are currently reading the Help Center. As an admin, you can edit this very content directly from your browser by clicking "Edit Article" on any help page!`,
    roles: ['admin']
  }
];

export async function seedHelpContent() {
  console.log('Seeding Help Content...');
  
  for (const item of helpData) {
    const key = `help.${item.slug}`;
    
    // Check if exists
    const existing = await db.query.settings.findFirst({
      where: (settings, { eq }) => eq(settings.key, key)
    });

    if (!existing) {
      await db.insert(settings).values({
        key,
        value: {
          title: item.title,
          content: item.content,
          roles: item.roles
        }
      });
      console.log(`✅ Seeded ${item.slug}`);
    } else {
      console.log(`⏩ Skipped ${item.slug} (already exists)`);
    }
  }
  
  console.log('Help seeding complete!');
}

// Auto-run if executed directly
if (require.main === module) {
  seedHelpContent().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
