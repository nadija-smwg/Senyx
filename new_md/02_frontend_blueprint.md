# Frontend Blueprint — SENYX ERP System

## 1. Technology Stack

| Concern | Choice | Version / Notes |
|---|---|---|
| **Framework** | Next.js (App Router) | v14+ with TypeScript |
| **Language** | TypeScript | Strict mode enabled |
| **Rendering** | React Server Components (RSC) + Client Components | RSC for data-heavy pages, Client for interactivity |
| **State Management** | React Server Components (server state) + Zustand (client state) | Minimal client state; server-first approach |
| **Data Fetching** | Server Actions + Route Handlers | `fetch()` with revalidation, React Query for client-side caching |
| **Forms & Validation** | React Hook Form + Zod | Shared Zod schemas with backend |
| **Styling** | Tailwind CSS + Radix UI primitives | Utility-first CSS with accessible unstyled components |
| **Charts & Analytics** | Recharts or Tremor | React-native charting for dashboards |
| **Drag & Drop** | @dnd-kit/core | Accessible, performant (Kanban board) |
| **Tables** | TanStack Table (React Table v8) | Headless, sortable, filterable, paginated |
| **Date Handling** | date-fns | Lightweight, tree-shakable |
| **Icons** | Lucide React | Consistent, lightweight icon set |
| **Toasts/Notifications** | Sonner | Lightweight toast notifications |
| **PDF Export** | @react-pdf/renderer or jsPDF | Client-side PDF generation |
| **CSV Export** | papaparse | CSV generation and parsing |

---

## 2. Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth layout group (no sidebar)
│   │   ├── login/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── (dashboard)/              # Main layout group (with sidebar)
│   │   ├── layout.tsx            # Dashboard shell: sidebar + topbar + content
│   │   ├── page.tsx              # Home dashboard (role-aware KPIs)
│   │   ├── crm/
│   │   │   ├── accounts/
│   │   │   │   ├── page.tsx      # Accounts list
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx  # Account detail
│   │   │   │   └── new/
│   │   │   │       └── page.tsx  # Create account
│   │   │   └── contacts/
│   │   ├── sales/
│   │   │   ├── deals/
│   │   │   │   ├── page.tsx      # Pipeline view (board + list)
│   │   │   │   ├── [id]/
│   │   │   │   └── new/
│   │   │   └── quotes/
│   │   ├── projects/
│   │   │   ├── page.tsx          # Projects list
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx      # Project overview
│   │   │   │   ├── board/        # Kanban board
│   │   │   │   ├── tasks/
│   │   │   │   ├── team/         # Assignments
│   │   │   │   ├── milestones/
│   │   │   │   ├── payments/     # Payment schedule
│   │   │   │   ├── time/         # Time entries + clock
│   │   │   │   ├── risks/
│   │   │   │   └── documents/
│   │   │   └── new/
│   │   ├── finance/
│   │   │   ├── invoices/
│   │   │   ├── expenses/
│   │   │   ├── payments/
│   │   │   └── subscriptions/
│   │   ├── hr/
│   │   │   ├── employees/
│   │   │   ├── designations/
│   │   │   ├── departments/
│   │   │   ├── leave/
│   │   │   ├── payroll/
│   │   │   └── reviews/
│   │   ├── analytics/
│   │   │   ├── page.tsx          # Dashboard with KPI widgets
│   │   │   └── reports/
│   │   ├── audit/
│   │   │   ├── page.tsx          # Audit log viewer
│   │   │   ├── sessions/
│   │   │   └── analytics/
│   │   ├── settings/
│   │   │   ├── roles/
│   │   │   ├── permissions/
│   │   │   └── general/
│   │   ├── notifications/
│   │   └── help/
│   ├── api/                      # Route Handlers (see Backend Blueprint)
│   ├── layout.tsx                # Root layout
│   └── globals.css
│
├── components/
│   ├── ui/                       # Design system primitives
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── table.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── avatar.tsx
│   │   ├── tabs.tsx
│   │   ├── toast.tsx
│   │   ├── skeleton.tsx
│   │   ├── pagination.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── sidebar.tsx           # Role-aware navigation
│   │   ├── topbar.tsx            # User menu, notifications, clock, search
│   │   ├── breadcrumbs.tsx
│   │   └── page-header.tsx
│   ├── data/
│   │   ├── data-table.tsx        # Generic filterable/sortable/paginated table
│   │   ├── filter-builder.tsx    # Multi-criteria filter UI (AND/OR)
│   │   ├── saved-filters.tsx
│   │   └── export-menu.tsx       # PDF/CSV export
│   ├── charts/
│   │   ├── kpi-card.tsx
│   │   ├── bar-chart.tsx
│   │   ├── line-chart.tsx
│   │   ├── pie-chart.tsx
│   │   └── pipeline-funnel.tsx
│   ├── board/
│   │   ├── kanban-board.tsx      # DnD Kanban container
│   │   ├── board-column.tsx
│   │   ├── task-card.tsx
│   │   └── task-detail-modal.tsx
│   ├── clock/
│   │   ├── time-clock.tsx        # Clock in/out widget (persistent in topbar)
│   │   └── time-entry-form.tsx
│   ├── forms/
│   │   ├── deal-form.tsx
│   │   ├── project-form.tsx
│   │   ├── employee-form.tsx
│   │   ├── invoice-form.tsx
│   │   └── ...
│   └── shared/
│       ├── empty-state.tsx
│       ├── error-boundary.tsx
│       ├── loading.tsx
│       ├── status-badge.tsx
│       └── user-avatar.tsx
│
├── hooks/
│   ├── use-auth.ts               # Current user, roles, permissions
│   ├── use-permissions.ts        # Permission checks (hasPermission, canAccess)
│   ├── use-clock.ts              # Active clock state
│   ├── use-filters.ts            # Filter state management
│   ├── use-debounce.ts
│   └── use-media-query.ts
│
├── lib/
│   ├── api-client.ts             # Typed fetch wrapper for route handlers
│   ├── auth.ts                   # Client-side auth utilities
│   ├── constants.ts              # Enums, stage labels, pipeline configs
│   ├── format.ts                 # Currency, date, number formatters
│   ├── validators.ts             # Shared Zod schemas (re-exported from shared)
│   └── utils.ts                  # cn() helper, misc utilities
│
├── types/
│   └── index.ts                  # Re-exports shared TypeScript interfaces
│
└── styles/
    └── globals.css               # Tailwind directives + design tokens
```

---

## 3. Key UI Components & Pages

### 3.1 Dashboard (Home)

Role-aware dashboard with configurable KPI widgets:

| Role | Widgets |
|---|---|
| **Admin/Owner** | Revenue vs Expenses, Pipeline Value, Active Projects, Resource Utilization, Outstanding Invoices, MRR/ARR |
| **Sales Lead** | Pipeline Funnel, Deals by Stage, Sales by Employee, Forecast, Won/Lost Ratio |
| **Project Owner** | My Projects Status, Upcoming Due Dates, Time Logged, Milestone Payments (collected/due/overdue) |
| **Finance** | Receivables Aging, Payables, Revenue Trend, Invoice Status, P&L Summary |
| **HR Manager** | Headcount, Leave Calendar, Pending Approvals, Skills Matrix |
| **Employee** | My Deals, My Tasks, My Time, Active Clock |

### 3.2 Kanban Board (Project)

```
┌─────────────────────────────────────────────────────────────┐
│  Project: [Name]     Filters: [Assignee] [Priority] [...]  │
├──────────┬──────────┬──────────┬──────────┬─────────────────┤
│ Backlog  │  To Do   │In Progress│  Review  │      Done      │
│          │          │          │          │                 │
│ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐       │
│ │ Card │ │ │ Card │ │ │ Card │ │ │ Card │ │ │ Card │       │
│ │──────│ │ │──────│ │ │──────│ │ │──────│ │ │──────│       │
│ │Title │ │ │Title │ │ │Title │ │ │Title │ │ │Title │       │
│ │@User │ │ │@User │ │ │@User │ │ │@User │ │ │@User │       │
│ │🔴 Hi │ │ │🟡 Med│ │ │🔴 Hi │ │ │🟢 Low│ │ │🟡 Med│       │
│ │Due:5d│ │ │Est:4h│ │ │Due:2d│ │ │Est:2h│ │ │✓ Done│       │
│ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘       │
│ ┌──────┐ │          │ ┌──────┐ │          │                 │
│ │ Card │ │          │ │ Card │ │          │                 │
│ └──────┘ │          │ └──────┘ │          │                 │
└──────────┴──────────┴──────────┴──────────┴─────────────────┘
```

- **Drag-and-drop** between columns using `@dnd-kit`
- **Optimistic updates** — card moves immediately, persists within 1s
- **Task cards** show: title, assignee avatar, priority badge, due date, estimate
- **Click to open** detail modal with full task editing
- **Swimlanes** — toggle grouping by assignee or priority
- **Column WIP limits** — visual warning when exceeded

### 3.3 Filter Builder

Reusable multi-criteria filter component used across all list views:

```
┌─────────────────────────────────────────────────────┐
│ Filters                          [Save] [Clear All] │
│                                                     │
│ ┌─ AND ──────────────────────────────────────────┐  │
│ │ [Status   ] [equals    ] [Active      ] [✕]    │  │
│ │ [Owner    ] [in list   ] [Select...   ] [✕]    │  │
│ │ [Created  ] [between   ] [Date picker ] [✕]    │  │
│ │                                                │  │
│ │ ┌─ OR ──────────────────────────────────────┐  │  │
│ │ │ [Amount ] [greater   ] [10000       ] [✕] │  │  │
│ │ │ [Stage  ] [equals    ] [Won         ] [✕] │  │  │
│ │ └───────────────────────────────── [+ Rule] ┘  │  │
│ │                                                │  │
│ └──────────────────────────────── [+ Rule] [+ Group]│
└─────────────────────────────────────────────────────┘
```

### 3.4 Sales Pipeline

Dual view: **Board view** (stages as columns, deal cards) + **List/table view** (sortable, filterable).

### 3.5 Time Clock Widget

Persistent in the topbar:

```
┌──────────────────────────────┐
│ 🕐 Active: Project Alpha     │
│    02:34:17  [⏹ Clock Out]   │
│ ─── or ───                   │
│ [▶ Clock In]  [Select Proj.] │
└──────────────────────────────┘
```

---

## 4. Navigation Structure (Role-Aware Sidebar)

```
📊 Dashboard
──────────────
👥 CRM
   ├── Accounts
   └── Contacts
💰 Sales
   ├── Deals (Pipeline)
   └── Quotes
📁 Projects
   ├── All Projects
   └── My Projects
💳 Finance          [Finance/Admin only]
   ├── Invoices
   ├── Expenses
   ├── Payments
   └── Subscriptions
👤 HR               [HR/Admin only]
   ├── Employees
   ├── Departments
   ├── Leave
   ├── Payroll
   └── Reviews
📈 Analytics
   ├── Dashboard
   └── Reports
🔍 Audit            [Admin/Auditor only]
   ├── Activity Log
   ├── Sessions
   └── Analytics
⚙️ Settings         [Admin only]
   ├── Roles & Permissions
   └── General
❓ Help
```

Navigation items are dynamically shown/hidden based on the user's roles and permissions.

---

## 5. Design System

### 5.1 Color Palette

```
Primary:     hsl(222, 47%, 31%)   — Deep navy (trust, enterprise)
Secondary:   hsl(210, 40%, 96%)   — Light gray-blue (backgrounds)
Accent:      hsl(199, 89%, 48%)   — Bright blue (actions, links)
Success:     hsl(142, 71%, 45%)   — Green
Warning:     hsl(38, 92%, 50%)    — Amber
Destructive: hsl(0, 72%, 51%)     — Red
Muted:       hsl(210, 40%, 98%)   — Subtle backgrounds

Dark mode:
Background:  hsl(222, 47%, 11%)
Card:        hsl(222, 47%, 15%)
Border:      hsl(222, 30%, 22%)
```

### 5.2 Typography

```
Font Family:  Inter (Google Fonts) — clean, modern, excellent readability
Headings:     Outfit (Google Fonts) — slightly more distinctive for headers

h1: 2rem / 700    — Page titles
h2: 1.5rem / 600  — Section headers
h3: 1.25rem / 600 — Card titles
Body: 0.875rem / 400 — Standard text
Small: 0.75rem / 400 — Labels, captions
```

### 5.3 Spacing & Layout

```
Sidebar width:     260px (collapsible to 72px)
Content max-width: 1440px
Card padding:      24px
Gap:               16px (between cards/sections)
Border radius:     8px (cards), 6px (inputs), 9999px (badges)
```

### 5.4 Component Library (Built on Radix UI)

| Component | Base | Customization |
|---|---|---|
| Button | Radix Slot | Primary, Secondary, Ghost, Destructive, Outline variants |
| Dialog/Modal | Radix Dialog | Sheet (slide-in), Dialog (center), AlertDialog |
| Dropdown Menu | Radix DropdownMenu | Context menus, action menus |
| Select | Radix Select | Searchable select with combobox variant |
| Tabs | Radix Tabs | Underline and pill variants |
| Tooltip | Radix Tooltip | Standard hover tooltips |
| Popover | Radix Popover | Filter dropdowns, date pickers |
| Accordion | Radix Accordion | Collapsible sections |

---

## 6. Key Frontend Patterns

### 6.1 Server Components (Default)

```tsx
// app/(dashboard)/projects/page.tsx — Server Component
export default async function ProjectsPage() {
  const projects = await getProjects(); // Server-side fetch
  return <ProjectsList projects={projects} />;
}
```

### 6.2 Client Components (Interactivity)

```tsx
// components/board/kanban-board.tsx — Client Component
'use client';
import { DndContext } from '@dnd-kit/core';

export function KanbanBoard({ columns, tasks }) {
  // Drag-and-drop, optimistic updates
}
```

### 6.3 Permission Guard

```tsx
// components/shared/permission-guard.tsx
export function PermissionGuard({ 
  module, action, scope, children, fallback 
}) {
  const { hasPermission } = usePermissions();
  if (!hasPermission(module, action, scope)) {
    return fallback ?? null;
  }
  return children;
}
```

### 6.4 Optimistic Updates (Board)

```tsx
// Task move — update UI immediately, then persist
const handleDragEnd = (event) => {
  // 1. Optimistically update local state
  updateTaskLocally(taskId, newColumnId, newPosition);
  
  // 2. Persist to server
  moveTask(taskId, newColumnId, newPosition)
    .catch(() => {
      // 3. Rollback on failure
      revertTask(taskId, originalColumnId, originalPosition);
      toast.error('Failed to move task');
    });
};
```

---

## 7. Responsive Design

| Breakpoint | Behavior |
|---|---|
| **Desktop** (≥1280px) | Full sidebar + content, all columns visible |
| **Tablet** (768–1279px) | Collapsible sidebar (icon-only), condensed tables |
| **Mobile** (< 768px) | Bottom navigation, stacked layout, swipeable board |

> **Note**: SRS specifies "desktop-first, tablet-capable". Mobile is lower priority but the layout should not break.

---

## 8. Performance Considerations

1. **React Server Components** — minimize client-side JS bundle
2. **Streaming** — use `loading.tsx` and `Suspense` for instant page shells
3. **Lazy loading** — dynamic import for heavy components (charts, PDF renderer)
4. **Optimistic updates** — board moves feel instant (< 1s persistence)
5. **Pagination** — all list views paginated (default 25 rows)
6. **Virtual scrolling** — for large lists (TanStack Virtual if needed)
7. **Image optimization** — Next.js `Image` component for avatars and assets
8. **Code splitting** — route-based automatic splitting via App Router

---

*This blueprint defines the frontend architecture. See the Backend Blueprint for API layer details and the Database Blueprint for schema details.*
