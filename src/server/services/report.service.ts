import { db } from '../db/client';
import { eq, and, desc, gte, lte, inArray, count, sum, sql, or } from 'drizzle-orm';
import { invoices, expenses, subscriptions } from '../db/schema/finance';
import { projects, timeEntries, paymentMilestones } from '../db/schema/projects';
import { deals } from '../db/schema/sales';
import { employees, departments } from '../db/schema/hr';
import { accounts } from '../db/schema/crm';
import { auditLogs } from '../db/schema/platform';
import { AuthContext } from '../types/context';
import Papa from 'papaparse';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Initialize PDF fonts
const pdfMakeAny = pdfMake as any;
const pdfFontsAny = pdfFonts as any;
pdfMakeAny.vfs = pdfFontsAny.pdfMake?.vfs || pdfFontsAny.vfs;

export type ReportType = 'project-profitability' | 'contribution' | 'sales-pipeline' | 'sales-by-person' | 'milestone-collection' | 'financial-summary' | 'receivables-aging';

export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  projectId?: string;
  employeeId?: string;
}

export async function generateReportData(ctx: AuthContext, type: ReportType, filters: ReportFilter) {
  // First, check basic permissions
  if (!ctx.roles.includes('admin') && !ctx.roles.includes('owner') && !ctx.roles.includes('Finance') && !ctx.roles.includes('Project Owner') && !ctx.roles.includes('Sales Lead')) {
    throw new Error('Unauthorized to generate reports');
  }

  // Audit the generation
  await db.insert(auditLogs).values({
    actorId: ctx.userId,
    action: 'generate_report',
    entityType: 'report',
    apiRoute: ctx.apiRoute || '/api/reports',
    result: 'success',
    after: { type, filters }
  });

  switch(type) {
    case 'project-profitability':
      return await getProjectProfitability(ctx, filters);
    case 'contribution':
      return await getContribution(ctx, filters);
    case 'sales-pipeline':
      return await getSalesPipeline(ctx, filters);
    case 'sales-by-person':
      return await getSalesByPerson(ctx, filters);
    case 'milestone-collection':
      return await getMilestoneCollection(ctx, filters);
    case 'financial-summary':
      return await getFinancialSummary(ctx, filters);
    case 'receivables-aging':
      return await getReceivablesAging(ctx, filters);
    default:
      throw new Error(`Report type ${type} is not supported`);
  }
}

// Helper for date filtering
function applyDateFilter(column: any, filters: ReportFilter) {
  if (filters.startDate && filters.endDate) return and(gte(column, filters.startDate), lte(column, filters.endDate));
  if (filters.startDate) return gte(column, filters.startDate);
  if (filters.endDate) return lte(column, filters.endDate);
  return undefined;
}

async function getProjectProfitability(ctx: AuthContext, filters: ReportFilter) {
  let projConditions = [];
  if (filters.projectId) projConditions.push(eq(projects.id, filters.projectId));

  const allProjects = await db.select({
    id: projects.id,
    name: projects.name,
    status: projects.status
  }).from(projects).where(projConditions.length > 0 ? and(...projConditions) : undefined);

  // Revenue = Paid Invoices + Collected Milestones
  let invConditions = [eq(invoices.status, 'paid'), sql`${invoices.projectId} IS NOT NULL`];
  const dCond = applyDateFilter(invoices.issueDate, filters);
  if (dCond) invConditions.push(dCond);

  const revenueByProject = await db.select({
    projectId: invoices.projectId,
    revenue: sum(invoices.total)
  }).from(invoices)
    .where(and(...invConditions))
    .groupBy(invoices.projectId);

  let msConditions = [eq(paymentMilestones.status, 'paid')];
  const mCond = applyDateFilter(paymentMilestones.completedAt, filters);
  if (mCond) msConditions.push(mCond);

  const milestonesByProject = await db.select({
    projectId: paymentMilestones.projectId,
    revenue: sum(paymentMilestones.amount)
  }).from(paymentMilestones)
    .where(and(...msConditions))
    .groupBy(paymentMilestones.projectId);

  let hrConditions = [];
  if (filters.employeeId) hrConditions.push(eq(timeEntries.employeeId, filters.employeeId));
  const tCond = applyDateFilter(timeEntries.workDate, filters);
  if (tCond) hrConditions.push(tCond);

  const hoursByProject = await db.select({
    projectId: timeEntries.projectId,
    hours: sum(timeEntries.hours)
  }).from(timeEntries)
    .where(hrConditions.length > 0 ? and(...hrConditions) : undefined)
    .groupBy(timeEntries.projectId);

  const BLENDED_RATE = 50; // $50/hour blended rate for cost

  const results = allProjects.map(p => {
    const invRev = revenueByProject.find(r => r.projectId === p.id)?.revenue || 0;
    const msRev = milestonesByProject.find(r => r.projectId === p.id)?.revenue || 0;
    const hrs = hoursByProject.find(h => h.projectId === p.id)?.hours || 0;
    
    const cost = Number(hrs) * BLENDED_RATE;
    const revenue = Number(invRev) + Number(msRev);
    return {
      'Project Name': p.name,
      'Status': p.status,
      'Revenue': revenue.toFixed(2),
      'Cost': cost.toFixed(2),
      'Margin': (revenue - cost).toFixed(2),
      'Margin %': revenue > 0 ? (((revenue - cost) / revenue) * 100).toFixed(1) + '%' : '0%'
    };
  });

  return results;
}

async function getContribution(ctx: AuthContext, filters: ReportFilter) {
  let conditions = [];
  if (filters.projectId) conditions.push(eq(timeEntries.projectId, filters.projectId));
  if (filters.employeeId) conditions.push(eq(timeEntries.employeeId, filters.employeeId));
  const dCond = applyDateFilter(timeEntries.workDate, filters);
  if (dCond) conditions.push(dCond);

  const logs = await db.select({
    employeeName: sql<string>`${employees.firstName} || ' ' || ${employees.lastName}`,
    projectName: projects.name,
    billableHours: sql<number>`SUM(CASE WHEN ${timeEntries.billable} = true THEN ${timeEntries.hours} ELSE 0 END)`,
    nonBillableHours: sql<number>`SUM(CASE WHEN ${timeEntries.billable} = false THEN ${timeEntries.hours} ELSE 0 END)`
  }).from(timeEntries)
    .innerJoin(employees, eq(timeEntries.employeeId, employees.id))
    .innerJoin(projects, eq(timeEntries.projectId, projects.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(employees.id, projects.id);

  return logs.map(l => ({
    'Employee': l.employeeName,
    'Project': l.projectName,
    'Billable Hours': Number(l.billableHours).toFixed(2),
    'Non-Billable Hours': Number(l.nonBillableHours).toFixed(2),
    'Total Hours': (Number(l.billableHours) + Number(l.nonBillableHours)).toFixed(2)
  }));
}

async function getSalesPipeline(ctx: AuthContext, filters: ReportFilter) {
  let conditions = [eq(deals.status, 'open')];
  if (filters.employeeId) conditions.push(eq(deals.ownerId, filters.employeeId));
  const dCond = applyDateFilter(deals.expectedCloseDate, filters);
  if (dCond) conditions.push(dCond);

  const allDeals = await db.select({
    name: deals.name,
    stage: deals.stage,
    amount: deals.amount,
    probability: deals.probability,
    expectedCloseDate: deals.expectedCloseDate
  }).from(deals).where(and(...conditions));

  const list = allDeals.map(d => ({
    'Deal Name': d.name,
    'Stage': d.stage,
    'Amount': Number(d.amount).toFixed(2),
    'Probability %': d.probability,
    'Weighted Value': (Number(d.amount) * (Number(d.probability) || 0) / 100).toFixed(2),
    'Expected Close': d.expectedCloseDate
  }));

  // Forecast summary by month
  const forecastMap: Record<string, number> = {};
  allDeals.forEach(d => {
    if (!d.expectedCloseDate) return;
    const month = d.expectedCloseDate.substring(0, 7);
    forecastMap[month] = (forecastMap[month] || 0) + (Number(d.amount) * (Number(d.probability) || 0) / 100);
  });
  const forecastSummary = Object.keys(forecastMap).map(k => {
    const val = forecastMap[k] || 0;
    return {
      'Month': k,
      'Forecasted Revenue': val.toFixed(2)
    };
  });

  return { pipeline: list, forecast: forecastSummary };
}

async function getSalesByPerson(ctx: AuthContext, filters: ReportFilter) {
  let conditions = [inArray(deals.status, ['won', 'lost'])];
  if (filters.employeeId) conditions.push(eq(deals.ownerId, filters.employeeId));
  const dCond = applyDateFilter(deals.closedAt, filters);
  if (dCond) conditions.push(dCond);

  const result = await db.select({
    employeeName: sql<string>`${employees.firstName} || ' ' || ${employees.lastName}`,
    wonCount: sql<number>`SUM(CASE WHEN ${deals.status} = 'won' THEN 1 ELSE 0 END)`,
    wonValue: sql<number>`SUM(CASE WHEN ${deals.status} = 'won' THEN ${deals.amount} ELSE 0 END)`,
    lostCount: sql<number>`SUM(CASE WHEN ${deals.status} = 'lost' THEN 1 ELSE 0 END)`,
  }).from(deals)
    .innerJoin(employees, eq(deals.ownerId, employees.id))
    .where(and(...conditions))
    .groupBy(employees.id);

  const COMMISSION_RATE = 0.05; // 5% flat commission for demo

  return result.map(r => {
    const won = Number(r.wonCount) || 0;
    const lost = Number(r.lostCount) || 0;
    const total = won + lost;
    const valWon = Number(r.wonValue || 0);
    return {
      'Sales Rep': r.employeeName,
      'Deals Won': won,
      'Value Won': valWon.toFixed(2),
      'Win Rate %': total > 0 ? ((won / total) * 100).toFixed(1) + '%' : '0%',
      'Estimated Commission': (valWon * COMMISSION_RATE).toFixed(2)
    };
  });
}

async function getMilestoneCollection(ctx: AuthContext, filters: ReportFilter) {
  let conditions = [];
  if (filters.projectId) conditions.push(eq(paymentMilestones.projectId, filters.projectId));
  const dCond = applyDateFilter(paymentMilestones.expectedDate, filters);
  if (dCond) conditions.push(dCond);

  const ms = await db.select({
    projectName: projects.name,
    milestoneName: paymentMilestones.name,
    amount: paymentMilestones.amount,
    status: paymentMilestones.status,
    expectedDate: paymentMilestones.expectedDate
  }).from(paymentMilestones)
    .innerJoin(projects, eq(paymentMilestones.projectId, projects.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const totals = { collected: 0, due: 0, overdue: 0, pending: 0 };
  const today = new Date().toISOString().split('T')[0] as string;

  const list = ms.map(m => {
    const amt = Number(m.amount);
    if (m.status === 'paid') totals.collected += amt;
    else if (m.status === 'pending') totals.pending += amt;
    else if (m.status === 'invoiced' || m.status === 'due') {
      if (m.expectedDate && m.expectedDate < today) totals.overdue += amt;
      else totals.due += amt;
    }

    return {
      'Project': m.projectName,
      'Milestone': m.milestoneName,
      'Amount': amt.toFixed(2),
      'Status': m.status,
      'Expected Date': m.expectedDate
    };
  });

  return { milestones: list, totals };
}

async function getFinancialSummary(ctx: AuthContext, filters: ReportFilter) {
  let invCond = [eq(invoices.status, 'paid')];
  const dCond = applyDateFilter(invoices.issueDate, filters);
  if (dCond) invCond.push(dCond);

  let expCond = [eq(expenses.approvalStatus, 'approved')];
  const eCond = applyDateFilter(expenses.expenseDate, filters);
  if (eCond) expCond.push(eCond);
  
  let subCond = [eq(subscriptions.status, 'active')];
  const sCond = applyDateFilter(subscriptions.startedAt, filters);
  if (sCond) subCond.push(sCond);

  // Revenue by source
  const [invRev] = await db.select({ total: sum(invoices.total) }).from(invoices).where(and(...invCond));
  const subs = await db.select().from(subscriptions).where(and(...subCond));
  let subRev = 0;
  subs.forEach(s => {
    if (s.interval === 'monthly') subRev += Number(s.amount);
    else if (s.interval === 'yearly') subRev += Number(s.amount) / 12;
  });

  const revenueBySource = [
    { 'Source': 'Invoices', 'Revenue': (Number(invRev?.total) || 0).toFixed(2) },
    { 'Source': 'Active Subscriptions (MRR)', 'Revenue': subRev.toFixed(2) }
  ];

  const expensesByCategory = await db.select({
    category: expenses.category,
    amount: sum(expenses.amount)
  }).from(expenses).where(and(...expCond)).groupBy(expenses.category);

  const expFormatted = expensesByCategory.map(e => ({
    'Category': e.category,
    'Amount': Number(e.amount).toFixed(2)
  }));

  const totalRev = (Number(invRev?.total) || 0) + subRev;
  const totalExp = expensesByCategory.reduce((acc, e) => acc + Number(e.amount), 0);
  
  return {
    revenueBySource,
    expensesByCategory: expFormatted,
    summary: {
      'Total Revenue': totalRev.toFixed(2),
      'Total Expenses': totalExp.toFixed(2),
      'Net Profit': (totalRev - totalExp).toFixed(2)
    }
  };
}

async function getReceivablesAging(ctx: AuthContext, filters: ReportFilter) {
  let conditions = [inArray(invoices.status, ['sent', 'overdue'])];
  if (filters.projectId) conditions.push(eq(invoices.projectId, filters.projectId));
  
  const openInvoices = await db.select({ 
    accountName: accounts.name,
    dueDate: invoices.dueDate,
    total: invoices.total 
  }).from(invoices)
    .innerJoin(accounts, eq(invoices.accountId, accounts.id))
    .where(and(...conditions));

  const today = new Date().getTime();
  const agingMap: Record<string, { current: number, '30': number, '60': number, '90+': number }> = {};

  openInvoices.forEach(inv => {
    const acc = inv.accountName;
    if (!agingMap[acc]) agingMap[acc] = { current: 0, '30': 0, '60': 0, '90+': 0 };
    if (!inv.dueDate) return;

    const currentAcc = agingMap[acc];
    if (!currentAcc) return;

    const diffDays = Math.floor((today - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) currentAcc.current += Number(inv.total);
    else if (diffDays <= 30) currentAcc['30'] += Number(inv.total);
    else if (diffDays <= 60) currentAcc['60'] += Number(inv.total);
    else currentAcc['90+'] += Number(inv.total);
  });

  return Object.keys(agingMap).map(acc => {
    const data = agingMap[acc];
    if (!data) return null;
    return {
      'Account Name': acc,
      'Current': data.current.toFixed(2),
      '1-30 Days': data['30'].toFixed(2),
      '31-60 Days': data['60'].toFixed(2),
      '90+ Days': data['90+'].toFixed(2)
    };
  }).filter(Boolean);
}

// -------------------------------------------------------------
// Exporters
// -------------------------------------------------------------

export async function exportReportToCSV(data: any): Promise<string> {
  if (!data) return '';
  // Flatten objects if they return multiple arrays (like sales-pipeline or financial-summary)
  if (Array.isArray(data)) {
    return Papa.unparse(data);
  } else {
    // Basic flattening for complex objects: just export the largest array we find, or stringify.
    let csv = '';
    for (const key in data) {
      if (Array.isArray(data[key])) {
        csv += `\n--- ${key.toUpperCase()} ---\n`;
        csv += Papa.unparse(data[key]);
      } else {
        csv += `\n--- ${key.toUpperCase()} ---\n`;
        csv += Papa.unparse([data[key]]);
      }
    }
    return csv;
  }
}

export async function exportReportToPDF(type: string, data: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      if (!data) throw new Error('No data available to generate PDF');

      const content: any[] = [
        { text: `Report: ${type}`, style: 'header' },
        { text: `Generated on: ${new Date().toLocaleString()}`, margin: [0, 0, 0, 20] }
      ];

      const renderTable = (arr: any[]) => {
        if (!arr || arr.length === 0) return null;
        const headers = Object.keys(arr[0]);
        const tableBody = [];
        tableBody.push(headers.map(h => ({ text: h, style: 'tableHeader' })));
        arr.forEach(row => {
          tableBody.push(headers.map(h => (row[h] !== null && row[h] !== undefined ? String(row[h]) : '')));
        });
        return {
          table: { headerRows: 1, widths: Array(headers.length).fill('auto'), body: tableBody },
          margin: [0, 0, 0, 20]
        };
      };

      let pageOrientation = 'portrait';

      if (Array.isArray(data)) {
        if (data.length > 0 && Object.keys(data[0]).length > 5) pageOrientation = 'landscape';
        const tbl = renderTable(data);
        if (tbl) content.push(tbl);
      } else {
        // Render complex objects
        for (const key in data) {
          content.push({ text: key.toUpperCase(), style: 'subheader', margin: [0, 10, 0, 5] });
          if (Array.isArray(data[key])) {
            if (data[key].length > 0 && Object.keys(data[key][0]).length > 5) pageOrientation = 'landscape';
            const tbl = renderTable(data[key]);
            if (tbl) content.push(tbl);
          } else {
            // Render object as simple key/value table
            const obj = data[key];
            const objArr = [obj];
            const tbl = renderTable(objArr);
            if (tbl) content.push(tbl);
          }
        }
      }

      const docDefinition = {
        pageOrientation,
        content,
        styles: {
          header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
          subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
          tableHeader: { bold: true, fontSize: 12, color: 'black', fillColor: '#eeeeee' }
        },
        defaultStyle: { fontSize: 10 }
      };

      const pdfDocGenerator: any = pdfMakeAny.createPdf(docDefinition);
      pdfDocGenerator.getBuffer((buffer: Buffer) => {
        resolve(buffer);
      });
    } catch (err) {
      reject(err);
    }
  });
}
