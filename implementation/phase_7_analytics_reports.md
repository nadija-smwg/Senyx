# Phase 7 — Analytics, Reports & Audit UI

**Duration:** 2–3 weeks  
**Dependencies:** Phase 1–6 (all data sources)  
**Tables:** 0 new (reads from all existing tables)  
**API Routes:** 5  

---

## 7.1 Backend — Analytics Service

### Task 7.1.1 — Dashboard KPIs Service
**File: `src/server/services/analytics.service.ts`**
```
- [ ] getDashboard(ctx, dateRange?) → role-aware KPI data

      Admin/Owner KPIs:
      - [ ] Total Revenue (invoices paid in period)
      - [ ] Total Expenses (approved in period)
      - [ ] Net Profit (revenue - expenses)
      - [ ] Active Projects count
      - [ ] Total Pipeline Value (weighted: amount × probability)
      - [ ] Outstanding Invoices (sent + overdue total)
      - [ ] Resource Utilization (billable hours / total hours %)
      - [ ] MRR / ARR (from subscriptions)
      - [ ] Headcount (active employees)
      - [ ] Revenue Trend (monthly for last 12 months)

      Sales Lead KPIs:
      - [ ] Pipeline Funnel (deals count + value per stage)
      - [ ] Weighted Pipeline Value
      - [ ] Sales by Employee (top performers)
      - [ ] Win Rate (won / (won + lost) for period)
      - [ ] Average Deal Size
      - [ ] Deals closing this month
      - [ ] Forecast (expected revenue by close date)

      Project Owner KPIs:
      - [ ] My Projects status summary (per project)
      - [ ] Upcoming Due Dates (tasks, milestones)
      - [ ] Overdue Items count
      - [ ] Time Logged (billable/non-billable this week/month)
      - [ ] Payment Milestones: collected / due / overdue
      - [ ] Budget vs Actual per project

      Finance KPIs:
      - [ ] Accounts Receivable aging (current, 30, 60, 90+)
      - [ ] Accounts Payable (pending expenses)
      - [ ] Revenue vs Expenses trend
      - [ ] Invoice Status breakdown (draft/sent/paid/overdue)
      - [ ] Milestone Collections summary
      - [ ] P&L Summary

      HR Manager KPIs:
      - [ ] Headcount by department
      - [ ] Pending Leave Requests
      - [ ] Skills Matrix overview
      - [ ] Employment Type breakdown

      Employee KPIs:
      - [ ] My Deals (count, value)
      - [ ] My Tasks (assigned, overdue)
      - [ ] My Time (hours this week/month)
      - [ ] Active Clock status
```

### Task 7.1.2 — Structured Query Engine
**File: `src/server/services/analytics.service.ts` (continued)**
```
- [ ] executeQuery(ctx, queryInput) → filtered results

      Query input (POST body):
      {
        module: 'deals' | 'projects' | 'invoices' | 'employees' | ...,
        filters: FilterNode (AND/OR tree),
        groupBy?: string[],
        aggregations?: { field: string, func: 'count' | 'sum' | 'avg' | 'min' | 'max' }[],
        dateRange?: { start: string, end: string },
        comparison?: { type: 'previous_period' | 'year_over_year' },
        sort?: string,
        page?: number,
        pageSize?: number
      }

- [ ] Filter operators supported:
      eq, neq, contains, in, gt, lt, between, empty, date_relative
      date_relative values: 'today', 'this_week', 'this_month', 'this_quarter',
        'this_year', 'last_7_days', 'last_30_days', 'last_90_days', 'ytd'

- [ ] Cross-module filtering:
      e.g. "Clients with won deals > $10K whose projects are over budget"
      → JOIN accounts ↔ deals ↔ projects with filter conditions

- [ ] Scope enforcement:
      Every query result respects user's record-scope permissions
      (FilterNode is augmented with scope filters before execution)

- [ ] Saved filters:
      Create settings key per user: filters.{userId}.{name} = FilterNode
      List saved filters, share at team level (Admin/role-based)
```

### Task 7.1.3 — Activity Analytics (Audit Data)
```
- [ ] getAuditAnalytics(ctx, params) → activity analytics data

      - [ ] Actions per user (bar chart: top users by action count)
      - [ ] Actions per module (pie chart: sales, projects, finance, etc.)
      - [ ] Actions per API route (top routes by frequency)
      - [ ] Actions over time (line chart: daily/weekly/monthly)
      - [ ] Session analytics:
            - Session count per user
            - Average session duration
            - Active-time distribution (heatmap by hour/day)
            - Device/browser breakdown (pie charts)
      - [ ] Filterable by: user, role, module, date range, device, action type
```

---

## 7.2 Backend — Report Service

### Task 7.2.1 — Report Generation
**File: `src/server/services/report.service.ts`**
```
Standard reports:

- [ ] project-profitability — Per project: revenue, costs (hours × rate), margin
      - Revenue = paid invoices + collected milestones
      - Cost = logged hours × employee hourly rate (derived from salary)
      - Margin = revenue - cost
      - Includes all projects or filtered

- [ ] contribution — Hours per person per project
      - Group by employee → project → billable/non-billable hours
      - Shows "who worked on what and for how long"

- [ ] sales-pipeline — Pipeline snapshot
      - Deals by stage with weighted values
      - Forecast by expected close date

- [ ] sales-by-person — Sales performance per employee
      - Deals owned: count, value, win rate
      - Commission/credit attribution

- [ ] milestone-collection — Payment milestone status
      - Per project: milestone name, %, amount, status
      - Totals: collected, due, overdue, pending

- [ ] financial-summary — P&L view
      - Revenue by source (invoices, subscriptions)
      - Expenses by category
      - Net profit

- [ ] receivables-aging — Outstanding invoice aging
      - Current, 1-30, 31-60, 61-90, 90+ days
      - By client

Report format:
- [ ] Build dynamically over live data
- [ ] Honor active filters (date range, project, employee, etc.)
- [ ] Return structured data for chart rendering
- [ ] Export to PDF (server-side using @react-pdf/renderer or pdfmake)
- [ ] Export to CSV (using papaparse)
- [ ] Audit every report generation and export
```

### Task 7.2.2 — Route Handlers
```
- [ ] GET   /api/analytics/dashboard    → getDashboard (role-aware KPIs)
- [ ] POST  /api/analytics/query        → executeQuery (structured filter)
- [ ] GET   /api/reports/:type          → generateReport (PDF/CSV via ?format=pdf|csv)
- [ ] GET   /api/audit-logs             → listAuditLogs (Admin/Auditor, filterable)
- [ ] GET   /api/audit-logs/analytics   → getAuditAnalytics (Admin/Auditor)
```

---

## 7.3 Frontend — Analytics & Dashboard

### Task 7.3.1 — Dashboard Home (Enhance from Phase 1)
```
- [ ] app/(dashboard)/page.tsx — Populate with real KPI data
      - Install Recharts: npm install recharts
      - Role-aware widget rendering (only show KPIs relevant to user's roles)

      Widget components (src/components/charts/):
      - [ ] kpi-card.tsx — Numeric KPI with trend arrow (↑↓) and comparison
      - [ ] bar-chart-widget.tsx — Recharts BarChart wrapper
      - [ ] line-chart-widget.tsx — Recharts LineChart wrapper
      - [ ] pie-chart-widget.tsx — Recharts PieChart wrapper
      - [ ] pipeline-funnel.tsx — Sales pipeline funnel visualization
      - [ ] aging-chart.tsx — Receivables aging stacked bar
      - [ ] progress-ring.tsx — Circular progress for milestones/utilization

      Dashboard layout:
      - Grid of KPI cards (2-4 columns)
      - Charts section (2 column layout)
      - Date range picker at top (this month, this quarter, YTD, custom)
      - Comparison toggle (vs previous period)
      - Click any KPI/chart → drill down to underlying records
```

### Task 7.3.2 — Analytics Page
```
- [ ] app/(dashboard)/analytics/page.tsx — Advanced analytics dashboard
      - Richer than home dashboard
      - Multiple chart types
      - Date range + comparison controls
      - Module selector tabs (Sales, Projects, Finance, HR, Activity)
      - Each tab shows relevant KPIs and charts
```

### Task 7.3.3 — Filter Builder Component
**File: `src/components/data/filter-builder.tsx`**
```
- [ ] Reusable multi-criteria filter builder:
      - Add filter rule: field selector → operator selector → value input
      - Group rules with AND/OR logic
      - Nested groups (OR inside AND)
      - Date-relative presets (last 7 days, this quarter, YTD)
      - Save filter set (named, per user)
      - Load/share saved filters
      - Apply to any list/report view
      - Clear all filters
      - Filter count badge
```

### Task 7.3.4 — Saved Filters Component
**File: `src/components/data/saved-filters.tsx`**
```
- [ ] Dropdown of saved filter sets
      - My Filters (personal)
      - Shared Filters (team-level, admin-managed)
      - Click to apply
      - Save current filter set with name
      - Delete saved filter
```

### Task 7.3.5 — Reports Page
```
- [ ] app/(dashboard)/analytics/reports/page.tsx — Report hub
      - Cards for each standard report:
        Project Profitability, Contribution, Sales Pipeline, Sales by Person,
        Milestone Collections, Financial Summary, Receivables Aging
      - Click → report view with:
        - Filter controls (date range, project, employee, etc.)
        - Tabular data display
        - Chart visualization
        - Export buttons: PDF, CSV/Excel
      - Scheduled report configuration (Admin)
```

### Task 7.3.6 — Export Components
**File: `src/components/data/export-menu.tsx`**
```
- [ ] Export dropdown button:
      - Export as PDF
      - Export as CSV
      - Export as Excel (.xlsx)
      - Triggers server-side or client-side generation
      - Shows loading spinner during generation
      - Downloads file when ready
```

---

## 7.4 Frontend — Audit Log Viewer

### Task 7.4.1 — Audit Log Page
```
- [ ] app/(dashboard)/audit/page.tsx — Activity log viewer (Admin/Auditor only)
      - Data table: Timestamp, User, Action, Entity, API Route, Device, Result
      - Expandable rows showing before/after diff (JSON diff view)
      - Filters:
        - User (searchable select)
        - Action type (text search or select)
        - Module (multi-select)
        - API route
        - Date range
        - Device/Browser
        - Result (success/failure)
      - Export audit log (CSV)
```

### Task 7.4.2 — Session Analytics Page
```
- [ ] app/(dashboard)/audit/sessions/page.tsx — Session analytics
      - Active sessions table (user, started, device, duration)
      - Session history (filterable)
      - Charts:
        - Sessions per day (line chart)
        - Average session duration (bar chart)
        - Device breakdown (pie chart)
        - Browser breakdown (pie chart)
        - Activity heatmap (hour × day of week)
```

### Task 7.4.3 — Activity Analytics Page
```
- [ ] app/(dashboard)/audit/analytics/page.tsx — Activity analytics
      - Actions per user (bar chart)
      - Actions per module (pie chart)
      - Actions over time (line chart)
      - Top API routes (table)
      - Filter controls matching audit log filters
```

### Task 7.4.4 — User Timeline View
```
- [ ] Drill down from any user → chronological timeline of all actions
      - Reconstructed from audit_logs filtered by actor
      - Shows: time, action, entity, before/after summary
      - Grouped by session
```

---

## 7.5 Verification Checklist — Phase 7

```
- [ ] Dashboard KPIs rendering with real data for all roles
- [ ] KPI cards show comparison (vs previous period) with trend arrows
- [ ] Date range picker working (this month, quarter, YTD, custom)
- [ ] Drill-down from KPI/chart to underlying records
- [ ] Sales pipeline funnel visualization
- [ ] Revenue trend line chart
- [ ] Receivables aging bar chart
- [ ] Filter builder: add/remove rules, AND/OR grouping
- [ ] Save and load named filter sets
- [ ] Cross-module filtering working (e.g. clients with projects over budget)
- [ ] All standard reports generating correctly
- [ ] Report PDF export working
- [ ] Report CSV/Excel export working
- [ ] Report generation audited
- [ ] Audit log viewer: filterable, expandable diff view
- [ ] Session analytics: charts for device, duration, activity
- [ ] Activity analytics: per user, module, route, time
- [ ] User timeline reconstruction working
- [ ] Analytics respect user's scoped permissions
- [ ] Audit log access itself is audited
- [ ] CI passing, deployed
```

---

*Phase 7 completion = Milestone M7 (Business Intelligence). Proceed to Phase 8 (Documents, Help & Polish).*
