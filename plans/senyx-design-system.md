# Senyx ERP — Design System & Implementation Plan

> **Status:** Approved design direction (read-only). No files have been modified.
> **Goal:** Evolve the existing Senyx UI into a single, consistent, premium enterprise visual language — without replacing the application, the brand, or the existing token names.
>
> **Decisions locked in (Section 10):**
> - `--radius`: **10px** for primitives, **14px** for cards/dialogs, **18px** for the page hero header only.
> - Pretitle eyebrow: **flat single-color**, brand blue by default, module color per module. No gradient text.
>
> **Approved to proceed with phased implementation.** See §10.

---

## 1. Design Audit — What Exists Today

### 1.1 What's already good (we preserve)
- **Brand palette is established** in [`src/app/globals.css`](src/app/globals.css): Sameeha (Blue), Eranda (Purple), Nuraj (Orange), Yohan (Red), Ash. Strong, distinctive brand identity.
- **Semantic tokens already wired**: `--color-primary`, `--color-accent`, `--color-destructive`, `--color-muted`, `--color-positive`, `--color-warning`, `--color-negative`, `--color-background`, `--color-foreground`.
- **Module accent mapping exists** in [`src/components/layout/sidebar.tsx`](src/components/layout/sidebar.tsx:30) — Core (Blue), HR (Purple), CRM (Orange), Projects (Emerald), Finance (Red), System (Ash).
- **Component primitives exist** in [`src/components/ui/`](src/components/ui/): Button, Card, Badge, Input, Textarea, Select, Dialog, Sheet, Dropdown, Tabs, Popover, Calendar, Skeleton, Avatar, etc.
- **A central page header component** ([`src/components/layout/page-header.tsx`](src/components/layout/page-header.tsx)) is in place.
- **A reusable data table** ([`src/components/data/data-table.tsx`](src/components/data/data-table.tsx)) with search, filter, date range, pagination, mobile card fallback.
- **Sticky translucent topbar** with backdrop blur ([`src/components/layout/topbar.tsx`](src/components/layout/topbar.tsx)).
- **Three-font hierarchy**: Inter (body), Inter Tight (headings), JetBrains Mono (data/numbers).
- **Skeleton loading**, global error boundary, and 404 already implemented.

### 1.2 Inconsistencies to fix
| Area | Current State | Problem |
|---|---|---|
| Border radius | Mixed: `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-md` used interchangeably | Visual noise; some cards look soft, some look crisp |
| Card surface | `--radius: 0.75rem` set, but cards use `rounded-2xl` directly inline | Token is overridden per-component |
| Borders | Some cards `border-gray-100`, others `border-slate-200/60`, others `border` (uses token) | Slightly different grays appear next to each other |
| Focus rings | Button uses `ring-[#22BFE8]/40`, Input uses `ring-indigo-500/20`, Tabs use `ring-ring/50` | Indigo leaks into a Blue brand system |
| Buttons | Primary CTA duplicated inline: `bg-gradient-to-r from-[#1A6DB6] to-[#22BFE8] shadow-lg shadow-[#1A6DB6]/20` | Heavy, repetitive; defeats the Button component |
| Tables | DataTable uses `slate-*` utilities; HR leave page uses `bg-white rounded-2xl`; quotes uses raw `<table>`; finance uses raw `<table>` | Three different table styles in production |
| Section headers | Dashboard uses `<h2 className="text-xs uppercase">`; others use page-header; some use Card headers | Three competing header systems |
| Page containers | Some `container mx-auto py-8`, some `max-w-7xl mx-auto`, some `flex-1 space-y-4 p-4 md:p-8` | Layout grid varies per page |
| Stat cards | HR/projects uses shadcn Card; finance uses inline `bg-card ... shadow-sm`; dashboard uses `KPICard` | Three competing KPI implementations |
| Status colors | `text-green-600`, `text-red-600`, `text-orange-600`, `text-purple-600`, `text-blue-600` all used inline in finance page | Random Tailwind palette instead of positive/negative/warning/neutral tokens |
| Page header | Uses brand gradient blobs; HR/employees page uses it; finance and sales don't | Inconsistent hero treatment |
| Empty states | DataTable has one, inline `text-muted-foreground` elsewhere | No reusable empty state |
| Loading states | Skeleton + Loader2 in different places | No single standard |
| Dialog | Uses `bg-white/70 backdrop-blur-xl` (glass) while content is plain white | Visual mismatch vs. the rest of the system |
| Sidebar active state | Per-group color tint with `border-left: 3px solid` | Some pages use `bg-indigo-50` outside brand |
| Tabs | `variant="line"` for project nav; default (pill) elsewhere | Inconsistent |
| Font weights | `font-bold`, `font-semibold`, `font-medium`, `font-heading` mixed with no scale | No clear weight hierarchy |
| Pretitles | Page header has a gradient pretitle, but most pages leave it empty | Unused capability |

### 1.3 Design principles (derived from existing intent)
1. **Calm, white-canvas interface** with one muted neutral canvas (`#F8F9FC`) and white surfaces.
2. **Brand color used purposefully, not decoratively.** Blue is the default; module accents only tint sidebar, KPI tops, and page pretitles.
3. **Information density without clutter.** Compact 36–40px rows in tables, 12–14px text, 11px uppercase labels.
4. **One card, one radius, one shadow, one border.** No per-page drift.
5. **Premium enterprise feel:** tight letter-spacing on labels, uppercase section eyebrows, monospaced numbers, restrained gradients.

---

## 2. Design Tokens (refined)

> All new values extend the existing CSS variables. **No names are renamed** to avoid breakage.

### 2.1 Brand colors (unchanged, lifted to standard scale)
| Token | Hex | Use |
|---|---|---|
| `brand-blue-50` | `#E9F5FA` | Hover wash, soft fills |
| `brand-blue-100` | `#CDE9F4` | Tints |
| `brand-blue-300` | `#5DD2EE` | Borders active |
| `brand-blue-500` | `#22BFE8` | Ring, accent light |
| `brand-blue-600` | `#1A6DB6` | **Primary** |
| `brand-blue-700` | `#155A96` | Primary hover |
| `brand-purple-500` | `#7F4D9F` | HR accent |
| `brand-purple-600` | `#3E308E` | HR deep |
| `brand-orange-500` | `#F15A22` | CRM accent |
| `brand-orange-300` | `#F9A01B` | Warning light |
| `brand-red-500` | `#EC4C49` | Destructive light |
| `brand-red-600` | `#C1172C` | **Destructive** |
| `brand-ash-500` | `#3C3535` | Body strong |
| `brand-ash-700` | `#3B3B3B` | Headings |
| `brand-positive` | `#059669` | Positive / Revenue |
| `brand-negative` | `#C1172C` | Negative / Expenses |

### 2.2 Semantic tokens (in `:root`, [`globals.css`](src/app/globals.css:58))
| Token | Light | Purpose |
|---|---|---|
| `--background` | `#F8F9FC` | App canvas |
| `--foreground` | `#3B3B3B` | Primary text |
| `--card` | `#FFFFFF` | Surface |
| `--card-foreground` | `#3B3B3B` | |
| `--popover` | `#FFFFFF` | |
| `--popover-foreground` | `#3B3B3B` | |
| `--primary` | `#1A6DB6` | |
| `--primary-foreground` | `#FFFFFF` | |
| `--secondary` | `#F1F3F5` | |
| `--secondary-foreground` | `#3C3535` | |
| `--muted` | `#F1F3F5` | |
| `--muted-foreground` | `#6B7280` | |
| `--accent` | `#F0F9FF` | Light blue wash |
| `--accent-foreground` | `#1A6DB6` | |
| `--destructive` | `#C1172C` | |
| `--destructive-foreground` | `#FFFFFF` | |
| `--success` | `#059669` | **New** — positive financial |
| `--success-foreground` | `#FFFFFF` | **New** |
| `--warning` | `#F9A01B` | **New** — pending |
| `--warning-foreground` | `#FFFFFF` | **New** |
| `--border` | `#E5E7EB` | Default hairline |
| `--input` | `#FFFFFF` | |
| `--ring` | `#22BFE8` | Focus |
| `--radius` | `0.625rem` *(10px)* | **Reduced** from 0.75rem for a tighter, more enterprise feel |
| `--sidebar` | `#FFFFFF` | |
| `--sidebar-foreground` | `#3C3535` | |
| `--sidebar-primary` | `#1A6DB6` | |
| `--sidebar-primary-foreground` | `#FFFFFF` | |
| `--sidebar-accent` | `#F0F9FF` | |
| `--sidebar-accent-foreground` | `#1A6DB6` | |
| `--sidebar-border` | `#E5E7EB` | |
| `--sidebar-ring` | `#22BFE8` | |

### 2.3 Type system
| Role | Class | Size / Line | Weight |
|---|---|---|---|
| Display (page title) | `text-2xl` | 24 / 32 | `font-heading font-bold` |
| Heading 1 (page header title) | `text-3xl` | 30 / 36 | `font-heading font-bold tracking-tight` |
| Heading 2 (section) | `text-xl` | 20 / 28 | `font-heading font-semibold` |
| Heading 3 (card title) | `text-base` | 16 / 24 | `font-semibold` |
| Body | `text-sm` | 14 / 20 | `font-normal` |
| Body strong | `text-sm` | 14 / 20 | `font-medium` |
| Label / Caption | `text-xs` | 12 / 16 | `font-medium` |
| Eyebrow / Section label | `text-[11px] uppercase tracking-wider` | 11 / 16 | `font-semibold` |
| Pretitle (page header) | `text-[11px] uppercase tracking-[0.2em]` | 11 / 16 | `font-bold` |
| Numeric / data | `font-mono text-sm` | — | `tabular-nums` |

> Body text remains Inter (`--font-sans`), headings Inter Tight (`--font-heading`), numeric JetBrains Mono (`--font-mono`). All already configured.

### 2.4 Spacing scale
Use Tailwind's default scale but standardize the **page grid**:
- **Page gutter:** `p-6 md:p-8`
- **Container max width:** `max-w-7xl mx-auto`
- **Vertical section rhythm:** `space-y-8` between page sections, `space-y-6` between cards, `space-y-4` between form fields.
- **Card internal padding:** `p-6` (standard), `p-5` (compact list cards), `p-8` (hero page header).
- **Table cell padding:** `px-4 py-3`.

### 2.5 Border radius
| Token | Value | Use |
|---|---|---|
| `--radius` | 10px | Inputs, buttons, badges |
| `rounded-lg` (10px) | — | All form controls, badges, chips |
| `rounded-xl` (14px) | — | Cards, dialogs, sheets |
| `rounded-2xl` (18px) | — | Page hero header only |
| `rounded-full` | — | Avatars, status dots, toggle pills |

> **Rule:** No `rounded-md`, `rounded-sm`, or ad-hoc rounding in components. Page header keeps `rounded-2xl` for its hero feel.

### 2.6 Borders & dividers
- Default border: `border-[#E5E7EB]` (1px solid).
- Subtle: `border-[#F1F3F5]` (1px) inside list dividers and table rows.
- Strong: `border-[#D1D5DB]` (1px) on inputs when not focused.
- **Never use `border-2` for chrome.** Only for `border-t-2` KPI accent stripe (see 3.3).

### 2.7 Shadows
Three shadow elevations, applied via utilities:

| Name | CSS | Use |
|---|---|---|
| `shadow-xs` | `0 1px 2px rgba(15,23,42,0.04)` | Static cards at rest |
| `shadow-sm` | `0 1px 3px rgba(15,23,42,0.05), 0 1px 2px rgba(15,23,42,0.03)` | Raised surfaces |
| `shadow-md` | `0 4px 12px rgba(15,23,42,0.06), 0 2px 4px rgba(15,23,42,0.03)` | Hover / focus lift |
| `shadow-lg` | `0 12px 32px rgba(15,23,42,0.08)` | Modals, popovers |

> Replace all existing inline shadows (`shadow-[0_1px_3px_...]`, `shadow-[0_4px_24px_...]`) with these tokens.

---

## 3. Component Standards

### 3.1 Buttons ([`src/components/ui/button.tsx`](src/components/ui/button.tsx))

**Update the variants:**
- **`default`** → solid Blue, no gradient. `bg-primary text-primary-foreground hover:bg-[#155A96] shadow-xs`.
- **`gradient`** *(new variant)* → the current gradient style, **only** for the most prominent CTA per page (e.g., "Add Employee"). `bg-gradient-to-r from-[#1A6DB6] to-[#22BFE8] text-white shadow-md shadow-[#1A6DB6]/20 hover:shadow-lg hover:shadow-[#1A6DB6]/25`.
- **`outline`** → `border border-[#E5E7EB] bg-white text-foreground hover:bg-[#F8F9FC]`.
- **`secondary`** → `bg-[#F1F3F5] text-foreground hover:bg-[#E5E7EB]`.
- **`ghost`** → `text-muted-foreground hover:bg-[#F1F3F5] hover:text-foreground`.
- **`destructive`** → `bg-[#C1172C] text-white hover:bg-[#A1112A]`.
- **`link`** → `text-primary underline-offset-4 hover:underline`.
- **`module`** *(new variant)* → accepts a `module` prop ("hr" | "crm" | "projects" | "finance") and applies that module's gradient.

**Sizes (refined):**
| Size | Height | Padding | Use |
|---|---|---|---|
| `xs` | 24px | `px-2.5` | Inline table actions, compact chips |
| `sm` | 28px | `px-3` | Toolbars, dense filters |
| `default` | 36px | `px-4` | Most actions |
| `lg` | 44px | `px-6` | Page hero CTAs only |
| `icon-xs` | 24px | — | Inline icon buttons |
| `icon-sm` | 32px | — | Table row icons |
| `icon` | 36px | — | Standard icon buttons |
| `icon-lg` | 44px | — | Hero icons |

**Rules:**
- Every page should have at most **one** `gradient` or `default` button in the page header.
- All other actions are `outline` or `ghost`.
- Destructive actions only in confirmation dialogs.

### 3.2 Inputs ([`src/components/ui/input.tsx`](src/components/ui/input.tsx))

**Standardize focus to brand (remove `indigo-500`):**
- Base: `h-9 rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm placeholder:text-[#9CA3AF]`.
- Focus: `focus:border-[#22BFE8] focus:ring-2 focus:ring-[#22BFE8]/20`.
- Invalid: `aria-invalid:border-[#C1172C] aria-invalid:ring-2 aria-invalid:ring-[#C1172C]/20`.
- Disabled: `disabled:bg-[#F8F9FC] disabled:text-muted-foreground disabled:cursor-not-allowed`.
- Add size variants: `sm` (28px), `default` (36px), `lg` (44px).

**Textarea:** same border, padding `px-3 py-2`, `min-h-20`.
**Select:** keep Radix implementation; tighten trigger to match Input heights and border tokens.
**Label:** `text-[11px] font-semibold uppercase tracking-wider text-muted-foreground` (already correct; ensure consistent use).
**Helper text:** `text-xs text-muted-foreground mt-1`.
**Error text:** `text-xs text-[#C1172C] mt-1`.

### 3.3 Cards ([`src/components/ui/card.tsx`](src/components/ui/card.tsx))

**Standard surface:**
- `bg-white text-card-foreground rounded-xl border border-[#E5E7EB] shadow-xs`.
- Hover (only when interactive): `hover:shadow-md hover:border-[#D1D5DB] transition-shadow`.
- **KPI accent stripe:** keep the `border-t-2` system but standardize stripe colors:
  - `positive` → `border-t-[#059669]`
  - `negative` → `border-t-[#C1172C]`
  - `warning` → `border-t-[#F9A01B]`
  - `neutral` → `border-t-[#1A6DB6]`

**Card anatomy:**
- `CardHeader`: `flex flex-col space-y-1.5 p-6 pb-3`.
- `CardTitle`: `text-base font-semibold leading-none tracking-tight text-foreground`.
- `CardDescription`: `text-sm text-muted-foreground`.
- `CardContent`: `p-6 pt-0`.
- `CardFooter`: `flex items-center p-6 pt-0`.
- Add `CardAction` slot: top-right actions in the header (`flex items-center gap-2 ml-auto`).

**KPI Card:** align all KPI tiles (Dashboard, Deals, Finance) to the same `KPIcard` shape:
- Top stripe (status color), icon top-right, label, large value (`text-2xl font-bold font-mono tabular-nums`), optional subtitle/trend below.

### 3.4 Tables

**Single source of truth:** [`src/components/ui/table.tsx`](src/components/ui/table.tsx) is already well-defined. **All raw `<table>` markup must be removed** and routed through it (or through the DataTable for tabular lists).

**Standard styling:**
- Container: `w-full overflow-x-auto`.
- Header row: `bg-[#F8F9FC] border-b border-[#E5E7EB]`.
- Header cell: `h-10 px-4 text-left align-middle font-heading font-semibold uppercase text-[11px] tracking-wider text-muted-foreground whitespace-nowrap`.
- Body row: `h-12 border-b border-[#F1F3F5] transition-colors hover:bg-[#F8F9FC]`.
- Body cell: `px-4 py-3 align-middle whitespace-nowrap text-sm text-foreground`.
- Numeric cells: `font-mono tabular-nums`.
- Selected row: `data-[state=selected]:bg-[#F0F9FF]`.

**Table density presets:**
- `default` (above) for most lists.
- `compact`: `h-10` rows, `py-2` cells, for analytics tables.
- `comfortable`: `h-14` rows, for detail views.

**DataTable ([`src/components/data/data-table.tsx`](src/components/data/data-table.tsx)):**
- Toolbar: left = search, right = `outline` buttons (Export, Filter, Date Range).
- Toolbar height: `h-14`, `px-4 md:px-6`, `border-b border-[#E5E7EB] bg-white`.
- Footer: pagination + selected count.
- Mobile fallback already present; keep but tighten card style to match the new surface (white surface, `rounded-xl`).

### 3.5 Status badges ([`src/components/ui/badge.tsx`](src/components/ui/badge.tsx))

**Update variants to map to the semantic palette:**
| Variant | Background | Text | Border | Use |
|---|---|---|---|---|
| `default` | `#F0F9FF` | `#1A6DB6` | `#BFDBFE` | Active, info |
| `secondary` | `#F1F3F5` | `#3C3535` | `#E5E7EB` | Neutral |
| `positive` | `#ECFDF5` | `#059669` | `#A7F3D0` | Approved, Paid, Won |
| `warning` | `#FFF8E6` | `#B45309` | `#FDE68A` | Pending, Overdue |
| `negative` | `#FEF2F2` | `#C1172C` | `#FECACA` | Rejected, Failed |
| `destructive` | `#FEF2F2` | `#C1172C` | `#FECACA` | Same as negative |
| `outline` | transparent | `#3C3535` | `#E5E7EB` | Inactive |
| `purple` *(new)* | `#F2E8FA` | `#7F4D9F` | `#E9D5FF` | HR-specific status |
| `orange` *(new)* | `#FEF0EB` | `#F15A22` | `#FED7AA` | CRM-specific status |

**Common shape:** `inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider`.
**Status dot prefix:** optional `h-1.5 w-1.5 rounded-full bg-current` for "live" states.

### 3.6 Icons

- Library: **lucide-react** (already used everywhere).
- Standard sizes: `h-4 w-4` (16px) inline, `h-5 w-5` (20px) card/title, `h-6 w-6` (24px) hero empty states.
- Color: inherit current text color by default; explicit `text-muted-foreground` for chrome icons.
- Stroke width: default 2; for hero icons, use `strokeWidth={1.5}` to feel more premium.

### 3.7 Dropdowns & menus ([`dropdown-menu.tsx`](src/components/ui/dropdown-menu.tsx))

- Trigger: `outline` button or `ghost` icon button.
- Content: `z-50 min-w-[10rem] rounded-lg border border-[#E5E7EB] bg-white p-1 shadow-md`.
- Item: `flex items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none cursor-pointer data-[highlighted]:bg-[#F0F9FF] data-[highlighted]:text-[#1A6DB6]`.
- Destructive item: `text-[#C1172C] data-[highlighted]:bg-[#FEF2F2] data-[highlighted]:text-[#C1172C]`.
- Separator: `h-px bg-[#E5E7EB] my-1`.
- Label: `px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground`.

### 3.8 Dialogs & sheets ([`dialog.tsx`](src/components/ui/dialog.tsx), `sheet.tsx`)

**Dialog:**
- Overlay: `fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm`.
- Content: `fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-lg`. **(Remove the `bg-white/70 backdrop-blur-xl` glass.)**
- Header: title `text-lg font-semibold font-heading`, description `text-sm text-muted-foreground`.
- Footer: `flex flex-row justify-end gap-2 pt-2 border-t border-[#F1F3F5] mt-4`.

**Sheet:**
- Side widths: `sm:max-w-md` (forms), `sm:max-w-lg` (detail view), `sm:max-w-2xl` (wide editor).
- Padding: `p-6`.
- Header: same as dialog, with explicit close X in the top-right.

### 3.9 Section headers

Standardize the small uppercase section labels used on Dashboard, Finance, etc. into a single component:

```
<SectionHeader
  eyebrow="Financial Overview"
  title="..."            // optional
  description="..."      // optional
  actions={...}          // optional
/>
```

- Eyebrow: `text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground`.
- Title (optional): `text-lg font-semibold font-heading text-foreground mt-1`.
- Description (optional): `text-sm text-muted-foreground mt-0.5`.

This replaces the inline `<h2>` blocks scattered across pages.

---

## 4. Layout Standards

### 4.1 App shell

```
┌────────────┬──────────────────────────────────────────────┐
│            │ TopBar (sticky, h-16, translucent, blur)     │
│  Sidebar   ├──────────────────────────────────────────────┤
│  (w-60)    │                                              │
│            │  Page Content                                │
│            │  (max-w-7xl mx-auto, p-6 md:p-8, gap-8)      │
│            │                                              │
│            │                                              │
└────────────┴──────────────────────────────────────────────┘
```

### 4.2 Sidebar ([`src/components/layout/sidebar.tsx`](src/components/layout/sidebar.tsx))

**Preserve the existing color-coded group system** (it is the strongest brand element). Just normalize:
- Width: `w-60` (240px).
- Surface: `bg-white border-r border-[#E5E7EB]`.
- Logo block: `h-16 px-5 border-b border-[#E5E7EB]`.
- Nav groups: `px-3 py-5 space-y-6`.
- Group label: `px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-2`.
- Item: `flex items-center gap-2.5 h-9 px-3 rounded-lg text-[13px] font-medium text-muted-foreground hover:bg-[#F8F9FC] hover:text-foreground transition-colors`.
- Active item: `bg-[var(--group-bg)] text-[var(--group-color)] font-semibold border-l-[3px] border-[var(--group-color)] rounded-l-none`. The icon gets full opacity when active, 60% when inactive.
- Footer: `h-12 px-4 border-t border-[#E5E7EB] flex items-center justify-between`. Status indicator: `bg-[#10B981] text-[#10B981]` dot + "All systems operational".

**Module accent tokens (preserved):**
| Module | Color | Wash |
|---|---|---|
| Core | `#1A6DB6` | `#F0F9FF` |
| HR & People | `#7F4D9F` | `#F2E8FA` |
| CRM & Sales | `#F15A22` | `#FEF0EB` |
| Projects | `#059669` | `#ECFDF5` |
| Finance | `#C1172C` | `#FCECEC` |
| System | `#3B3B3B` | `#F3F4F6` |

### 4.3 Topbar ([`src/components/layout/topbar.tsx`](src/components/layout/topbar.tsx))

- Sticky, `h-16`, surface `bg-white/85 backdrop-blur-md border-b border-[#E5E7EB]`.
- Left: hamburger (mobile only) + page title `text-base font-semibold text-foreground hidden md:block`. **Remove the secondary `font-heading text-xl` heading here — that's the page-header's job.**
- Right: currency selector, time clock, divider, notification bell, user menu.
- User button: white pill `rounded-lg border border-[#E5E7EB] px-2 py-1.5 hover:bg-[#F8F9FC]`. Avatar `h-7 w-7 rounded-lg` (use rounded-lg, not rounded-full, to match the rest).
- Dropdown: same as 3.7; add `shadow-md`.

### 4.4 Page header ([`src/components/layout/page-header.tsx`](src/components/layout/page-header.tsx))

**Refine:**
- Keep the hero card with subtle decorative gradients but **tone them down** (`from-[#22BFE8]/8`, `from-[#F9A01B]/8`) — they should be ambient, not loud.
- Add a `module` prop (`'hr' | 'crm' | 'projects' | 'finance' | 'core' | 'system'`) so the pretitle and accent stripe can follow the module.
- Default pretitle color: brand blue gradient. Override per module if needed.
- Add an optional `breadcrumbs` slot.
- Standardize to `rounded-2xl border border-[#E5E7EB] shadow-xs bg-white`.

### 4.5 Page-level sections

Each page follows the same skeleton:
1. `<PageHeader>` (title + actions)
2. Optional `<SectionHeader>` + KPI row (4-col grid)
3. Optional filter / toolbar strip (own card)
4. Main content card (table, kanban, form, etc.)
5. Optional secondary cards (charts, activity, etc.)

### 4.6 Tabs (project detail nav)

- Use shadcn `Tabs` with `variant="line"`.
- List: `border-b border-[#E5E7EB] gap-0`.
- Trigger: `px-4 py-2.5 text-sm font-medium text-muted-foreground border-b-2 border-transparent hover:text-foreground hover:border-[#E5E7EB]`.
- Active: `text-foreground border-b-2 border-[#1A6DB6]`.

### 4.7 Empty states

Create a reusable `<EmptyState>` component:
- Icon container: `w-12 h-12 rounded-full bg-[#F1F3F5] text-muted-foreground flex items-center justify-center mb-4`.
- Title: `text-base font-semibold text-foreground`.
- Description: `text-sm text-muted-foreground max-w-sm`.
- Action: optional `Button`.
- Variant for "filtered" vs "no data" vs "error".

Use everywhere a page has no records. Replaces inline `text-muted-foreground` empty messages.

### 4.8 Loading states

- **Page-level:** Full-area skeleton composition using [`<Skeleton />`](src/components/ui/skeleton.tsx): a header skeleton + 4 KPI skeletons + 1 large table skeleton. **Remove the bare `<Loader2 />` center spinners.**
- **Inline:** A reusable `<LoadingDots />` or use `<Spinner />` ([`spinner.tsx`](src/components/ui/spinner.tsx)) at `h-4 w-4`.
- **Buttons:** Show `<Spinner />` inside buttons at `h-4 w-4 mr-2` when async.

### 4.9 Error states

Create a reusable `<ErrorState>` matching the global error in [`src/app/error.tsx`](src/app/error.tsx):
- Icon container: `w-12 h-12 rounded-full bg-[#FEF2F2] text-[#C1172C]`.
- Title: `Something went wrong`.
- Body: brief description + optional error digest (mono, 11px).
- Actions: `Try again` (primary) + `Go to Dashboard` (outline).

Apply across modules (API failure, empty error, validation error).

### 4.10 Toasts

Use Sonner ([`sonner.tsx`](src/components/ui/sonner.tsx)). Standards:
- Success: green check icon, `bg-white border-l-4 border-[#059669]`.
- Error: red triangle, `bg-white border-l-4 border-[#C1172C]`.
- Info: blue info, `bg-white border-l-4 border-[#1A6DB6]`.
- Warning: amber, `bg-white border-l-4 border-[#F9A01B]`.
- Position: `top-right` (existing).

### 4.11 Forms

- Every form lives inside a `<Sheet>` (create/edit) or inline on detail pages.
- Field group: `space-y-1.5`.
- Label above (never beside), uppercase eyebrow style.
- Helper text under input.
- Error text under input, `text-xs text-[#C1172C]`.
- Fieldset groups: bordered sub-card `rounded-xl border border-[#E5E7EB] p-5 space-y-4` for "Profile", "Compensation", etc.
- Submit row: `flex justify-end gap-2 pt-4 border-t border-[#F1F3F5] mt-6`.

### 4.12 Responsive behavior

| Breakpoint | Behavior |
|---|---|
| `< sm` (640px) | Single-column. Sidebar becomes Sheet drawer. Tables switch to card list. |
| `sm` | Two-column KPIs. |
| `md` | Sidebar returns, table list returns. |
| `lg` | Three/four-column KPIs, two-column page grids. |
| `xl` | `max-w-7xl` cap. |

Container padding: `p-4 sm:p-6 md:p-8`.

---

## 5. Cross-module Consistency Map

| Module | Pretitle | Primary CTA | Status accent | Stripe on KPIs |
|---|---|---|---|---|
| Dashboard | "Command Center" (gradient) | `gradient` | mixed | all |
| HR & People | "HR & PEOPLE" purple | `gradient` | `purple` | HR purple |
| CRM & Sales | "CRM & SALES" orange | `gradient` | `orange` | CRM orange |
| Projects | "PROJECTS" emerald | `gradient` | emerald | Projects emerald |
| Finance | "FINANCE" red | `gradient` | `negative`/`warning` | red / amber |
| Settings / System | "SYSTEM" ash | `default` | neutral | blue |

The **pretitle is the only place** where each module gets its color — keep the rest of the page chrome on brand blue + neutral.

---

## 6. Module accent usage rules (tightened)

1. **Sidebar** — module accent (tint + color). ✅ keep.
2. **Page pretitle** — module accent gradient. ✅ keep.
3. **KPI top stripe** — semantic (positive/negative/warning/neutral) by default; module accent only on the "module-overview" tile.
4. **Status badges** — semantic, not module. E.g., "Paid" is green, not because Finance is red.
5. **Action buttons** — primary is **always brand blue**; module accent never bleeds into buttons except via the optional `module` button variant for the one prominent CTA per page.
6. **Charts** — use the chart palette: `--chart-1` through `--chart-5` (already defined). Keep existing chart colors.

---

## 7. Concrete files to be touched in implementation (no edits in this plan)

> For orientation only — these are the files that need updates when implementation begins.

### Phase 1 — Token & Primitive Layer
- [`src/app/globals.css`](src/app/globals.css) — add semantic success/warning, shrink `--radius`, document tokens.
- [`src/components/ui/button.tsx`](src/components/ui/button.tsx) — add `gradient` + `module` variants, refocus hover state.
- [`src/components/ui/badge.tsx`](src/components/ui/badge.tsx) — extend variants to module + outline tweaks.
- [`src/components/ui/card.tsx`](src/components/ui/card.tsx) — standardize radius/shadow/border, KPI stripe colors.
- [`src/components/ui/input.tsx`](src/components/ui/input.tsx) — replace indigo focus with brand blue.
- [`src/components/ui/textarea.tsx`](src/components/ui/textarea.tsx) — same focus treatment.
- [`src/components/ui/select.tsx`](src/components/ui/select.tsx) — align trigger border + focus.
- [`src/components/ui/dialog.tsx`](src/components/ui/dialog.tsx) — remove glass effect, use solid white.
- [`src/components/ui/skeleton.tsx`](src/components/ui/skeleton.tsx) — neutral color `#E5E7EB` instead of `slate-200/60`.
- `src/components/ui/empty-state.tsx` — **new**.
- `src/components/ui/error-state.tsx` — **new**.
- `src/components/ui/section-header.tsx` — **new**.

### Phase 2 — Layout & Navigation
- [`src/components/layout/sidebar.tsx`](src/components/layout/sidebar.tsx) — normalize active state, footer, spacing.
- [`src/components/layout/mobile-nav.tsx`](src/components/layout/mobile-nav.tsx) — same.
- [`src/components/layout/topbar.tsx`](src/components/layout/topbar.tsx) — remove duplicate title, avatar tweak.
- [`src/components/layout/page-header.tsx`](src/components/layout/page-header.tsx) — add `module` prop, soften gradient, optional breadcrumbs slot.

### Phase 3 — Data Layer
- [`src/components/data/data-table.tsx`](src/components/data/data-table.tsx) — toolbar tokens, density prop, mobile card alignment.
- [`src/components/ui/table.tsx`](src/components/ui/table.tsx) — minor hover & numeric refinements.

### Phase 4 — Page-level Pass (no logic changes)
For each page, replace inline one-off styling with the new primitives:
- Dashboard ([`src/app/(dashboard)/page.tsx`](src/app/(dashboard)/page.tsx))
- HR: [`hr/employees/page.tsx`](src/app/(dashboard)/hr/employees/page.tsx), [`hr/leave/page.tsx`](src/app/(dashboard)/hr/leave/page.tsx), [`hr/approval/page.tsx`](src/app/(dashboard)/hr/approval/page.tsx), departments, designations, [id]
- CRM: `crm/accounts`, `crm/contacts`, `sales/deals`, `sales/quotes`
- Projects: [`projects/page.tsx`](src/app/(dashboard)/projects/page.tsx), [`projects/[id]/layout.tsx`](src/app/(dashboard)/projects/[id]/layout.tsx), board, milestones, payments, risks, tasks, team, time, links, documents
- Finance: [`finance/page.tsx`](src/app/(dashboard)/finance/page.tsx), invoices, expenses, payments, subscriptions
- Settings: [`settings/page.tsx`](src/app/(dashboard)/settings/page.tsx), general, profile, roles, [id]
- Audit: page, analytics, sessions, timeline
- Auth: [`login/page.tsx`](src/app/(auth)/login/page.tsx), register, reset-password

Each pass is mechanical: replace inline color classes with tokens, swap raw `<table>` for `<Table>`, swap empty messages for `<EmptyState>`, swap loader text for skeletons.

---

## 8. Visual mock logic (for code reviewers)

A page that looks correct should satisfy all of:

1. **One** prominent CTA in the page header, optionally `gradient` blue. All other buttons `outline`/`ghost`.
2. **Section eyebrow** above every KPI group and every distinct content block.
3. **All cards** identical radius, border, shadow.
4. **All tables** identical header style, identical row hover, identical numeric formatting.
5. **All status badges** drawn from the same variant set; no inline `bg-green-600` etc.
6. **Sidebar active** = module accent, **nothing else** is module accent on the page.
7. **Loading** = skeletons, not text. **Empty** = EmptyState. **Error** = ErrorState.
8. **Inputs** have the brand-blue focus ring everywhere.
9. **No `indigo-*`** Tailwind classes anywhere outside the legacy shadcn popover focus rings (which we are also retargeting).
10. **Topbar shows page title only on small screens** — `<PageHeader>` carries it on desktop.

---

## 9. Out of scope for this design pass

- New modules / features.
- Backend / API changes.
- Auth flow rewrite.
- Dark mode (the system is light-only today; this design preserves that).
- Replacing shadcn primitives wholesale — they stay, only their tokens are tightened.

---

## 10. Suggested implementation order

1. **Tokens** in [`globals.css`](src/app/globals.css) — `--radius`, semantic `success`/`warning`, comment block documenting tokens.
2. **Primitives** in [`src/components/ui/`](src/components/ui/) — Button, Badge, Card, Input, Dialog, Skeleton.
3. **Layout** — Sidebar, Topbar, PageHeader normalization.
4. **New shared components** — EmptyState, ErrorState, SectionHeader.
5. **DataTable + Table** polish.
6. **Auth screens** — login, register, reset (small surface, high visibility).
7. **Dashboard** — anchor for the visual language.
8. **HR → CRM → Projects → Finance → Settings** in sequence. Each is a mechanical sweep, no logic changes.
9. **Audit, Analytics, Help, Notifications** — final pass for consistency.
10. **Final review** against the checklist in §8.

---

**Open question for the user:** Confirm two small choices before I move to implementation:

1. **Radius scale**: keep `[src/components/ui/button.tsx](src/components/ui/button.tsx)` at `--radius: 10px` (tighter, more enterprise) or stay at the current 12px? My recommendation is 10px.
2. **Pretitle treatment**: keep the gradient eyebrow text on every page, or switch to a flat single-color eyebrow? My recommendation is **flat single-color** (brand blue for default, module color for module pages) — less busy, easier to scan.