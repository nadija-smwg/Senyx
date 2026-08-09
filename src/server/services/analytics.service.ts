import { db } from '../db/client';
import { eq, and, sql, desc, gte, lte, or, inArray, count, sum, min, max, avg, isNull, like, ne } from 'drizzle-orm';
import { invoices, expenses, payments, subscriptions } from '../db/schema/finance';
import { projects, tasks, milestones, paymentMilestones, timeEntries, clockSessions } from '../db/schema/projects';
import { deals } from '../db/schema/sales';
import { employees, leaveRequests, leaveBalances, employeeSkills, skills, departments } from '../db/schema/hr';
import { users, roles, userRoles, sessions } from '../db/schema/identity';
import { auditLogs } from '../db/schema/platform';
import { AuthContext } from '../types/context';

/**
 * Helper to generate date range conditions.
 */
function getDateCondition(column: any, dateRange?: { start?: string; end?: string }) {
  if (!dateRange) return undefined;
  if (dateRange.start && dateRange.end) {
    return and(gte(column, dateRange.start), lte(column, dateRange.end));
  }
  if (dateRange.start) return gte(column, dateRange.start);
  if (dateRange.end) return lte(column, dateRange.end);
  return undefined;
}

export async function getDashboard(ctx: AuthContext, dateRange?: { start?: string; end?: string }) {
  const rolesLower = ctx.roles.map(r => r.toLowerCase());
  const isOwner = rolesLower.includes('admin') || rolesLower.includes('owner') || rolesLower.includes('system admin');
  
  if (isOwner) {
    return await getAdminDashboard(ctx, dateRange);
  }
  if (rolesLower.includes('sales lead') || rolesLower.includes('sales manager')) {
    return await getSalesDashboard(ctx, dateRange);
  }
  if (rolesLower.includes('project owner') || rolesLower.includes('project manager')) {
    return await getProjectDashboard(ctx, dateRange);
  }
  if (rolesLower.includes('finance') || rolesLower.includes('accountant')) {
    return await getFinanceDashboard(ctx, dateRange);
  }
  if (rolesLower.includes('hr manager') || rolesLower.includes('hr admin')) {
    return await getHRDashboard(ctx, dateRange);
  }
  return await getEmployeeDashboard(ctx, dateRange);
}

// -------------------------------------------------------------
// Admin / Owner Dashboard
// -------------------------------------------------------------
async function getAdminDashboard(ctx: AuthContext, dateRange?: { start?: string; end?: string }) {
  const revConditions = [eq(invoices.status, 'paid')];
  if (dateRange?.start) revConditions.push(gte(invoices.issueDate, dateRange.start));
  if (dateRange?.end) revConditions.push(lte(invoices.issueDate, dateRange.end));
  const [revenueResult] = await db.select({ total: sum(invoices.total) }).from(invoices).where(and(...revConditions));
  const totalRevenue = Number(revenueResult?.total) || 0;

  const expConditions = [eq(expenses.approvalStatus, 'approved')];
  if (dateRange?.start) expConditions.push(gte(expenses.expenseDate, dateRange.start));
  if (dateRange?.end) expConditions.push(lte(expenses.expenseDate, dateRange.end));
  const [expenseResult] = await db.select({ total: sum(expenses.amount) }).from(expenses).where(and(...expConditions));
  const totalExpenses = Number(expenseResult?.total) || 0;

  const netProfit = totalRevenue - totalExpenses;

  const [activeProjectsResult] = await db.select({ count: count(projects.id) }).from(projects).where(eq(projects.status, 'active'));

  const allDeals = await db.select({ amount: deals.amount, probability: deals.probability }).from(deals).where(eq(deals.status, 'open'));
  const pipelineValue = allDeals.reduce((sum, d) => sum + (Number(d.amount) * (Number(d.probability) || 0) / 100), 0);

  const [outstandingResult] = await db.select({ total: sum(invoices.total) }).from(invoices).where(inArray(invoices.status, ['sent', 'overdue']));
  const outstandingInvoices = Number(outstandingResult?.total) || 0;

  const activeSubs = await db.select().from(subscriptions).where(eq(subscriptions.status, 'active'));
  let mrr = 0;
  for (const sub of activeSubs) {
    if (sub.interval === 'monthly') mrr += Number(sub.amount);
    if (sub.interval === 'yearly') mrr += Number(sub.amount) / 12;
  }
  
  const [headcountResult] = await db.select({ count: count(employees.id) }).from(employees).where(eq(employees.status, 'active'));

  // Resource Utilization
  const timeLogs = await db.select({ hours: timeEntries.hours, isBillable: timeEntries.billable }).from(timeEntries);
  const totalHours = timeLogs.reduce((acc, t) => acc + Number(t.hours), 0);
  const billableHours = timeLogs.reduce((acc, t) => acc + (t.isBillable ? Number(t.hours) : 0), 0);
  const resourceUtilization = totalHours > 0 ? (billableHours / totalHours) * 100 : 0;

  // Revenue Trend (last 12 months)
  const revenueTrend = await db.select({
    month: sql<string>`to_char(${invoices.issueDate}, 'YYYY-MM')`,
    revenue: sum(invoices.total)
  }).from(invoices)
    .where(eq(invoices.status, 'paid'))
    .groupBy(sql`to_char(${invoices.issueDate}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${invoices.issueDate}, 'YYYY-MM')`);

  return {
    totalRevenue, totalExpenses, netProfit, activeProjects: activeProjectsResult?.count || 0,
    pipelineValue, outstandingInvoices, mrr, arr: mrr * 12, headcount: headcountResult?.count || 0,
    resourceUtilization, revenueTrend
  };
}

// -------------------------------------------------------------
// Sales Lead Dashboard
// -------------------------------------------------------------
async function getSalesDashboard(ctx: AuthContext, dateRange?: { start?: string; end?: string }) {
  const funnel = await db.select({ stage: deals.stage, count: count(deals.id), value: sum(deals.amount) })
    .from(deals).where(eq(deals.status, 'open')).groupBy(deals.stage);

  const openDeals = await db.select({ amount: deals.amount, probability: deals.probability }).from(deals).where(eq(deals.status, 'open'));
  const weightedPipelineValue = openDeals.reduce((sum, d) => sum + (Number(d.amount) * (Number(d.probability) || 0) / 100), 0);

  const closedConditions = [inArray(deals.status, ['won', 'lost'])];
  const dateCond = getDateCondition(deals.closedAt, dateRange);
  if (dateCond) closedConditions.push(dateCond);
  const closedDeals = await db.select({ status: deals.status, amount: deals.amount }).from(deals).where(and(...closedConditions));
  
  let wonCount = 0;
  let lostCount = 0;
  let wonValue = 0;
  closedDeals.forEach(d => {
    if (d.status === 'won') { wonCount++; wonValue += Number(d.amount); }
    if (d.status === 'lost') { lostCount++; }
  });
  const winRate = (wonCount + lostCount) > 0 ? (wonCount / (wonCount + lostCount)) * 100 : 0;
  const averageDealSize = wonCount > 0 ? (wonValue / wonCount) : 0;

  // Sales by employee
  const topPerformers = await db.select({ owner: deals.ownerId, wonValue: sum(deals.amount) })
    .from(deals).where(eq(deals.status, 'won')).groupBy(deals.ownerId).orderBy(desc(sum(deals.amount))).limit(5);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
  const [closingResult] = await db.select({ count: count(deals.id), value: sum(deals.amount) })
    .from(deals).where(and(eq(deals.status, 'open'), gte(deals.expectedCloseDate, startOfMonth), lte(deals.expectedCloseDate, endOfMonth)));

  // Forecast (expected revenue by close date)
  const forecast = await db.select({
    month: sql<string>`to_char(${deals.expectedCloseDate}, 'YYYY-MM')`,
    expectedRevenue: sum(sql`${deals.amount} * ${deals.probability} / 100`)
  }).from(deals).where(eq(deals.status, 'open'))
    .groupBy(sql`to_char(${deals.expectedCloseDate}, 'YYYY-MM')`);

  return { funnel, weightedPipelineValue, winRate, averageDealSize, topPerformers, forecast,
    dealsClosingThisMonth: { count: closingResult?.count || 0, value: Number(closingResult?.value) || 0 } };
}

// -------------------------------------------------------------
// Project Owner Dashboard
// -------------------------------------------------------------
async function getProjectDashboard(ctx: AuthContext, dateRange?: { start?: string; end?: string }) {
  const myProjects = await db.select({ id: projects.id, name: projects.name, status: projects.status, budget: projects.budget })
    .from(projects).where(eq(projects.ownerId, ctx.employeeId || ''));

  const statusSummary = myProjects.reduce((acc, p) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc; }, {} as Record<string, number>);
  const projectIds = myProjects.map(p => p.id);
  
  let upcomingTasks = 0, overdueTasks = 0;
  let billableHours = 0, nonBillableHours = 0;
  
  const paymentMilestonesSummary = { collected: 0, due: 0, overdue: 0 };

  if (projectIds.length > 0) {
    const today = new Date().toISOString().split('T')[0];
    
    // Tasks
    const allTasks = await db.select({ dueDate: tasks.dueDate }).from(tasks).where(and(inArray(tasks.projectId, projectIds), sql`${tasks.status} != 'completed'`));
    allTasks.forEach(t => { if (t.dueDate) { if (t.dueDate < today!) overdueTasks++; else upcomingTasks++; } });

    // Time Logged
    const timeLogs = await db.select({ hours: timeEntries.hours, isBillable: timeEntries.billable }).from(timeEntries).where(inArray(timeEntries.projectId, projectIds));
    timeLogs.forEach(t => { if (t.isBillable) billableHours += Number(t.hours); else nonBillableHours += Number(t.hours); });

    // Payment Milestones
    const pms = await db.select({ status: paymentMilestones.status, amount: paymentMilestones.amount, expectedDate: paymentMilestones.expectedDate })
      .from(paymentMilestones).where(inArray(paymentMilestones.projectId, projectIds));
    pms.forEach(pm => {
      if (pm.status === 'paid') paymentMilestonesSummary.collected += Number(pm.amount);
      else if (pm.status === 'pending' || pm.status === 'invoiced') {
        if (pm.expectedDate && pm.expectedDate < today!) paymentMilestonesSummary.overdue += Number(pm.amount);
        else paymentMilestonesSummary.due += Number(pm.amount);
      }
    });
  }

  return { statusSummary, upcomingTasks, overdueTasks, billableHours, nonBillableHours, paymentMilestonesSummary };
}

// -------------------------------------------------------------
// Finance Dashboard
// -------------------------------------------------------------
async function getFinanceDashboard(ctx: AuthContext, dateRange?: { start?: string; end?: string }) {
  const openInvoices = await db.select({ id: invoices.id, dueDate: invoices.dueDate, total: invoices.total })
    .from(invoices).where(inArray(invoices.status, ['sent', 'overdue']));

  const today = new Date().getTime();
  const aging = { current: 0, '30': 0, '60': 0, '90+': 0 };
  openInvoices.forEach(inv => {
    if (!inv.dueDate) return;
    const diffDays = Math.floor((today - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) aging.current += Number(inv.total);
    else if (diffDays <= 30) aging['30'] += Number(inv.total);
    else if (diffDays <= 60) aging['60'] += Number(inv.total);
    else aging['90+'] += Number(inv.total);
  });

  const [apResult] = await db.select({ total: sum(expenses.amount) }).from(expenses).where(eq(expenses.approvalStatus, 'approved'));
  const accountsPayable = Number(apResult?.total) || 0;

  const invoiceStatusBreakdown = await db.select({ status: invoices.status, value: sum(invoices.total) }).from(invoices).groupBy(invoices.status);
  const milestoneCollections = await db.select({ status: paymentMilestones.status, value: sum(paymentMilestones.amount) }).from(paymentMilestones).groupBy(paymentMilestones.status);

  // Revenue vs Expenses Trend
  const revenueTrend = await db.select({ month: sql<string>`to_char(${invoices.issueDate}, 'YYYY-MM')`, revenue: sum(invoices.total) })
    .from(invoices).where(eq(invoices.status, 'paid')).groupBy(sql`to_char(${invoices.issueDate}, 'YYYY-MM')`);
  const expenseTrend = await db.select({ month: sql<string>`to_char(${expenses.expenseDate}, 'YYYY-MM')`, expenses: sum(expenses.amount) })
    .from(expenses).where(eq(expenses.approvalStatus, 'approved')).groupBy(sql`to_char(${expenses.expenseDate}, 'YYYY-MM')`);

  const [totalRev] = await db.select({ total: sum(invoices.total) }).from(invoices).where(eq(invoices.status, 'paid'));
  const [totalExp] = await db.select({ total: sum(expenses.amount) }).from(expenses).where(eq(expenses.approvalStatus, 'approved'));
  const pnlSummary = { revenue: Number(totalRev?.total) || 0, expenses: Number(totalExp?.total) || 0, net: (Number(totalRev?.total) || 0) - (Number(totalExp?.total) || 0) };

  return { aging, accountsPayable, invoiceStatusBreakdown, milestoneCollections, revenueTrend, expenseTrend, pnlSummary };
}

// -------------------------------------------------------------
// HR Manager Dashboard
// -------------------------------------------------------------
async function getHRDashboard(ctx: AuthContext, dateRange?: { start?: string; end?: string }) {
  const headcountByDept = await db.select({ dept: departments.name, count: count(employees.id) })
    .from(employees).leftJoin(departments, eq(employees.departmentId, departments.id))
    .where(eq(employees.status, 'active')).groupBy(departments.name);

  const employmentTypeBreakdown = await db.select({ type: employees.employmentType, count: count(employees.id) })
    .from(employees).where(eq(employees.status, 'active')).groupBy(employees.employmentType);

  const [pendingLeaveResult] = await db.select({ count: count(leaveRequests.id) }).from(leaveRequests).where(eq(leaveRequests.status, 'pending'));

  const skillsMatrix = await db.select({ skill: skills.name, avgProficiency: avg(employeeSkills.proficiency) })
    .from(employeeSkills).leftJoin(skills, eq(employeeSkills.skillId, skills.id)).groupBy(skills.name);

  return { headcountByDept, employmentTypeBreakdown, pendingLeaves: pendingLeaveResult?.count || 0, skillsMatrix };
}

// -------------------------------------------------------------
// Employee Dashboard
// -------------------------------------------------------------
async function getEmployeeDashboard(ctx: AuthContext, dateRange?: { start?: string; end?: string }) {
  const [dealsResult] = await db.select({ count: count(deals.id), value: sum(deals.amount) }).from(deals).where(eq(deals.ownerId, ctx.employeeId || ''));
  
  const today = new Date().toISOString().split('T')[0];
  const assignedTasks = await db.select({ dueDate: tasks.dueDate }).from(tasks).where(and(eq(tasks.assigneeId, ctx.employeeId || ''), sql`${tasks.status} != 'completed'`));
  
  let overdueTasks = 0;
  assignedTasks.forEach(t => { if (t.dueDate && t.dueDate < today!) overdueTasks++; });

  const [timeResult] = await db.select({ hours: sum(timeEntries.hours) }).from(timeEntries).where(eq(timeEntries.employeeId, ctx.employeeId || ''));

  const activeClock = await db.select().from(clockSessions).where(and(eq(clockSessions.employeeId, ctx.employeeId || ''), eq(clockSessions.isActive, true))).limit(1);

  return {
    myDeals: { count: dealsResult?.count || 0, value: Number(dealsResult?.value) || 0 },
    myTasks: { assigned: assignedTasks.length, overdue: overdueTasks },
    myTime: Number(timeResult?.hours) || 0,
    activeClock: activeClock[0] || null
  };
}

// -------------------------------------------------------------
// Audit Analytics & Query Engine
// -------------------------------------------------------------
export async function getAuditAnalytics(ctx: AuthContext, params: any) {
  let conditions = [];
  if (params.user) conditions.push(eq(auditLogs.actorId, params.user));
  if (params.module) conditions.push(eq(auditLogs.entityType, params.module));
  if (params.dateRange) {
    const dCond = getDateCondition(auditLogs.createdAt, params.dateRange);
    if (dCond) conditions.push(dCond);
  }

  const baseQuery = db.select().from(auditLogs);
  if (conditions.length > 0) baseQuery.where(and(...conditions));

  const topUsers = await db.select({ userId: auditLogs.actorId, count: count(auditLogs.id) })
    .from(auditLogs).where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(auditLogs.actorId).orderBy(desc(count(auditLogs.id))).limit(10);

  const actionsPerModule = await db.select({ module: auditLogs.entityType, count: count(auditLogs.id) })
    .from(auditLogs).where(conditions.length > 0 ? and(...conditions) : undefined).groupBy(auditLogs.entityType);

  const topRoutes = await db.select({ route: auditLogs.apiRoute, count: count(auditLogs.id) })
    .from(auditLogs).where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(auditLogs.apiRoute).orderBy(desc(count(auditLogs.id))).limit(10);

  const actionsOverTime = await db.select({
    date: sql<string>`to_char(${auditLogs.createdAt}, 'YYYY-MM-DD')`,
    count: count(auditLogs.id)
  }).from(auditLogs).where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(sql`to_char(${auditLogs.createdAt}, 'YYYY-MM-DD')`).orderBy(sql`to_char(${auditLogs.createdAt}, 'YYYY-MM-DD')`);

  const sessionStats = await db.select({ totalSessions: count(sessions.id), avgDuration: avg(sessions.durationSeconds) }).from(sessions);
  const deviceBreakdown = await db.select({ device: sessions.device, count: count(sessions.id) }).from(sessions).groupBy(sessions.device);
  const browserBreakdown = await db.select({ browser: sessions.browser, count: count(sessions.id) }).from(sessions).groupBy(sessions.browser);

  return { topUsers, actionsPerModule, topRoutes, actionsOverTime, sessionStats: sessionStats[0] || { totalSessions: 0, avgDuration: 0 }, deviceBreakdown, browserBreakdown };
}

// Simple dynamic condition builder for FilterNodes
function buildDrizzleConditions(schemaObj: any, filters: any): any[] {
  if (!filters || !filters.rules || filters.rules.length === 0) return [];
  
  const conditions = filters.rules.map((rule: any) => {
    const column = schemaObj[rule.field];
    if (!column) return undefined;

    switch (rule.operator) {
      case 'equals': return eq(column, rule.value);
      case 'not_equals': return ne(column, rule.value);
      case 'contains': return like(column, `%${rule.value}%`);
      case 'gt':
      case 'after': return gte(column, rule.value);
      case 'lt':
      case 'before': return lte(column, rule.value);
      default: return eq(column, rule.value);
    }
  }).filter(Boolean);

  if (conditions.length === 0) return [];

  return filters.logic === 'OR' ? [or(...conditions)] : [and(...conditions)];
}

export async function executeQuery(ctx: AuthContext, queryInput: any) {
  const { module, dateRange, groupBy, filters } = queryInput;
  const rolesLower = ctx.roles.map(r => r.toLowerCase());

  switch(module) {
    case 'deals': {
      let conditions: any[] = [];
      const hasAccess = rolesLower.includes('admin') || rolesLower.includes('owner') || rolesLower.includes('sales lead');
      if (!hasAccess) conditions.push(eq(deals.ownerId, ctx.employeeId || ''));
      if (dateRange) {
        const dCond = getDateCondition(deals.createdAt, dateRange);
        if (dCond) conditions.push(dCond);
      }
      if (filters) conditions.push(...buildDrizzleConditions(deals, filters));

      if (groupBy?.includes('stage')) {
        const query = db.select({ stage: deals.stage, count: count(deals.id), value: sum(deals.amount) }).from(deals);
        if (conditions.length > 0) query.where(and(...conditions));
        query.groupBy(deals.stage);
        return await query;
      } else {
        const query = db.select().from(deals);
        if (conditions.length > 0) query.where(and(...conditions));
        return await query;
      }
    }
    case 'projects': {
      let conditions: any[] = [];
      const hasAccess = rolesLower.includes('admin') || rolesLower.includes('owner') || rolesLower.includes('project owner');
      if (!hasAccess) conditions.push(eq(projects.ownerId, ctx.employeeId || ''));
      if (dateRange) {
        const dCond = getDateCondition(projects.createdAt, dateRange);
        if (dCond) conditions.push(dCond);
      }
      if (filters) conditions.push(...buildDrizzleConditions(projects, filters));

      if (groupBy?.includes('status')) {
        const query = db.select({ status: projects.status, count: count(projects.id) }).from(projects);
        if (conditions.length > 0) query.where(and(...conditions));
        query.groupBy(projects.status);
        return await query;
      } else {
        const query = db.select().from(projects);
        if (conditions.length > 0) query.where(and(...conditions));
        return await query;
      }
    }
    case 'invoices': {
      let conditions: any[] = [];
      if (dateRange) {
        const dCond = getDateCondition(invoices.issueDate, dateRange);
        if (dCond) conditions.push(dCond);
      }
      if (filters) conditions.push(...buildDrizzleConditions(invoices, filters));

      if (groupBy?.includes('status')) {
        const query = db.select({ status: invoices.status, total: sum(invoices.total), count: count(invoices.id) }).from(invoices);
        if (conditions.length > 0) query.where(and(...conditions));
        query.groupBy(invoices.status);
        return await query;
      } else {
        const query = db.select().from(invoices);
        if (conditions.length > 0) query.where(and(...conditions));
        return await query;
      }
    }
    case 'employees': {
      let conditions: any[] = [];
      if (dateRange) {
        const dCond = getDateCondition(employees.createdAt, dateRange);
        if (dCond) conditions.push(dCond);
      }
      if (filters) conditions.push(...buildDrizzleConditions(employees, filters));

      if (groupBy?.includes('status')) {
        const query = db.select({ status: employees.status, count: count(employees.id) }).from(employees);
        if (conditions.length > 0) query.where(and(...conditions));
        query.groupBy(employees.status);
        return await query;
      } else {
        const query = db.select().from(employees);
        if (conditions.length > 0) query.where(and(...conditions));
        return await query;
      }
    }
    case 'tasks': {
      let conditions: any[] = [];
      const hasAccess = rolesLower.includes('admin') || rolesLower.includes('owner') || rolesLower.includes('project owner');
      if (!hasAccess) conditions.push(eq(tasks.assigneeId, ctx.employeeId || ''));
      if (dateRange) {
        const dCond = getDateCondition(tasks.dueDate, dateRange);
        if (dCond) conditions.push(dCond);
      }
      if (filters) conditions.push(...buildDrizzleConditions(tasks, filters));

      if (groupBy?.includes('status')) {
        const query = db.select({ status: tasks.status, count: count(tasks.id) }).from(tasks);
        if (conditions.length > 0) query.where(and(...conditions));
        query.groupBy(tasks.status);
        return await query;
      } else {
        const query = db.select().from(tasks);
        if (conditions.length > 0) query.where(and(...conditions));
        return await query;
      }
    }
    default:
      throw new Error(`Module ${module} is not supported in executeQuery`);
  }
}
