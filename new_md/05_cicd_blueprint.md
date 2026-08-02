# CI/CD & DevOps Blueprint — SENYX ERP System

## 1. Deployment Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     Developer Workstation                       │
│  ┌──────────┐                                                   │
│  │  VS Code │ → git push → GitHub (main / dev / feature/*)     │
│  └──────────┘                                                   │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                     GitHub Actions                               │
│                                                                  │
│  ┌─────────────────────┐  ┌─────────────────────────────────┐   │
│  │  CI Pipeline        │  │  Scheduled Jobs                 │   │
│  │  ─────────────      │  │  ──────────────                 │   │
│  │  • Lint (ESLint)    │  │  • Daily DB backup → R2         │   │
│  │  • Type check (tsc) │  │  • Monthly restore test         │   │
│  │  • Unit tests       │  │                                 │   │
│  │  • Build check      │  │                                 │   │
│  │  • Security audit   │  │                                 │   │
│  └─────────┬───────────┘  └─────────────────────────────────┘   │
│            │                                                     │
│            ▼ (on main branch merge)                             │
│  ┌─────────────────────┐                                        │
│  │  CD Pipeline        │                                        │
│  │  ─────────────      │                                        │
│  │  • Build Next.js    │                                        │
│  │  • Run migrations   │                                        │
│  │  • Deploy to        │                                        │
│  │    Netlify / CF     │                                        │
│  └─────────┬───────────┘                                        │
└────────────┼────────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Production Environment                       │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   Netlify /  │  │   Supabase   │  │   Cloudflare R2      │   │
│  │   CF Pages   │  │   (Postgres  │  │   (Documents +       │   │
│  │              │  │    + Auth)   │  │    Backups)          │   │
│  │  Next.js App │  │              │  │                      │   │
│  │  (SSR + API) │  │  Singapore   │  │  Global              │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐                             │
│  │   Resend     │  │  Netlify     │                             │
│  │   (Email)    │  │  Scheduled   │                             │
│  │              │  │  Functions   │                             │
│  └──────────────┘  └──────────────┘                             │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Git Branching Strategy

### 2.1 Branch Model (GitHub Flow, simplified)

```
main ────────●───────●───────●───────●──── (always deployable)
              \     / \     /         \
  feature/xyz  ●───●   ●───●   fix/abc ●── (short-lived branches)
```

| Branch | Purpose | Protection |
|---|---|---|
| `main` | Production-ready code, auto-deploys | Protected: require PR, CI pass, 1 review |
| `dev` | Integration branch (optional for team coordination) | CI must pass |
| `feature/*` | New features (e.g. `feature/kanban-board`) | None — developer branch |
| `fix/*` | Bug fixes (e.g. `fix/invoice-rounding`) | None |
| `hotfix/*` | Critical production fixes | Fast-track PR to `main` |

### 2.2 Commit Convention (Conventional Commits)

```
feat(projects): add Kanban board drag-and-drop
fix(finance): correct invoice tax calculation
chore(deps): update Next.js to 14.2
docs(api): add route documentation for deals
refactor(auth): extract session middleware
test(crm): add unit tests for account service
```

### 2.3 PR Workflow

1. Developer creates feature branch from `main`
2. Commits with conventional commit messages
3. Opens PR → triggers CI pipeline
4. Code review (1 required approver)
5. CI passes → Merge to `main`
6. Auto-deploy to production (Netlify / CF Pages)

---

## 3. CI Pipeline (GitHub Actions)

### 3.1 Workflow File: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
    branches: [main, dev]
  push:
    branches: [main]

env:
  NODE_VERSION: '20'

jobs:
  lint-and-typecheck:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check

  test:
    name: Unit & Integration Tests
    runs-on: ubuntu-latest
    needs: lint-and-typecheck
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run test -- --coverage
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/

  build:
    name: Build Check
    runs-on: ubuntu-latest
    needs: lint-and-typecheck
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

  security-audit:
    name: Security Audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm audit --audit-level=high
```

### 3.2 CI Checks Summary

| Check | Tool | Fails On |
|---|---|---|
| **Linting** | ESLint (strict) | Any lint error |
| **Type checking** | `tsc --noEmit` | Any type error |
| **Unit tests** | Vitest | Any failing test |
| **Build** | `next build` | Build failure |
| **Security** | `npm audit` | High/critical vulnerability |

---

## 4. CD Pipeline (Automated Deployment)

### 4.1 Netlify Deployment

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    name: Deploy to Netlify
    runs-on: ubuntu-latest
    needs: [lint-and-typecheck, test, build]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      - name: Run Database Migrations
        run: npx drizzle-kit push
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      
      - name: Deploy to Netlify
        uses: netlify/actions/cli@master
        with:
          args: deploy --prod --dir=.next
        env:
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
```

### 4.2 Alternative: Cloudflare Pages

```yaml
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          accountId: ${{ secrets.CF_ACCOUNT_ID }}
          projectName: senyx-erp
          directory: .next
```

### 4.3 Deployment Flow

```
PR merged to main
  → CI Pipeline runs (lint, test, build, security)
  → All checks pass
  → Run database migrations (Drizzle)
  → Deploy to Netlify / CF Pages
  → Verify deployment health
  → Notify team (optional Slack/Discord webhook)
```

---

## 5. Scheduled Jobs (GitHub Actions Cron)

### 5.1 Database Backup

```yaml
# .github/workflows/db-backup.yml
name: Database Backup

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 02:00 UTC
  workflow_dispatch:  # Manual trigger

jobs:
  backup:
    name: Backup Database
    runs-on: ubuntu-latest
    steps:
      - name: Install PostgreSQL client
        run: sudo apt-get install -y postgresql-client

      - name: Dump Database
        run: |
          pg_dump ${{ secrets.DATABASE_URL }} \
            --format=custom \
            --compress=9 \
            --file=backup-$(date +%Y%m%d-%H%M%S).dump
        env:
          PGPASSWORD: ${{ secrets.DB_PASSWORD }}

      - name: Upload to Cloudflare R2
        uses: shallwefootball/s3-upload-action@v1.3.3
        with:
          aws_key_id: ${{ secrets.R2_ACCESS_KEY_ID }}
          aws_secret_access_key: ${{ secrets.R2_SECRET_ACCESS_KEY }}
          aws_bucket: senyx-erp-backups
          source_dir: '*.dump'
          destination_dir: 'backups/'
          endpoint: ${{ secrets.R2_ENDPOINT }}

      - name: Cleanup Old Backups
        run: |
          # Keep 30 daily + 12 monthly backups
          # Script to delete old backups from R2
          echo "Cleanup completed"
```

### 5.2 Due-Date Reminders (Netlify Scheduled Functions)

```typescript
// netlify/functions/due-date-reminders.ts
import { schedule } from '@netlify/functions';

export const handler = schedule('0 8 * * *', async () => {
  // Daily at 08:00 UTC
  // 1. Query upcoming/overdue tasks, milestones, payments
  // 2. Group by Project Owner
  // 3. Send digest emails via Resend
  // 4. Create in-app notifications
  // 5. Log to audit trail
});
```

### 5.3 Overdue Invoice Check

```yaml
# .github/workflows/overdue-check.yml
name: Overdue Invoice Check

on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight UTC

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx tsx src/scheduled/overdue-invoice-check.ts
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

---

## 6. Environment Management

### 6.1 Environments

| Environment | Branch | URL | Database | Purpose |
|---|---|---|---|---|
| **Development** | `dev` / local | `localhost:3000` | Local Supabase | Development & testing |
| **Staging** | `dev` (auto-deploy) | `staging.senyx-erp.netlify.app` | Staging Supabase project | Pre-production validation |
| **Production** | `main` (auto-deploy) | `erp.senyx.io` | Production Supabase project | Live system |

### 6.2 Secrets Management

All secrets stored in **GitHub Secrets** (encrypted):

| Secret | Used In |
|---|---|
| `SUPABASE_URL` | Build, Deploy |
| `SUPABASE_ANON_KEY` | Build, Deploy |
| `SUPABASE_SERVICE_ROLE_KEY` | Deploy, Scheduled jobs |
| `DATABASE_URL` | Migrations, Backups |
| `DB_PASSWORD` | Backups |
| `R2_ENDPOINT` | Backups, Deploy |
| `R2_ACCESS_KEY_ID` | Backups, Deploy |
| `R2_SECRET_ACCESS_KEY` | Backups, Deploy |
| `RESEND_API_KEY` | Deploy, Scheduled jobs |
| `ENCRYPTION_KEY` | Deploy |
| `NETLIFY_SITE_ID` | Deploy |
| `NETLIFY_AUTH_TOKEN` | Deploy |

---

## 7. Monitoring & Observability

### 7.1 Built-in Monitoring

| What | How |
|---|---|
| **Application errors** | Audit log (`result = 'failure'`) + structured Pino logs |
| **API performance** | Audit log timestamps (response time derived) |
| **Session analytics** | Sessions table (duration, device breakdown) |
| **User activity** | Audit log (actions per user/module/route) |
| **Deployment status** | GitHub Actions + Netlify deploy logs |
| **Database health** | Supabase dashboard (free tier) |

### 7.2 Alerting (Optional Enhancements)

| Tool | Purpose | Cost |
|---|---|---|
| **Sentry** (free tier) | Error tracking & exception monitoring | Free (5K events/month) |
| **UptimeRobot** (free tier) | Uptime monitoring & availability alerts | Free (50 monitors) |
| **GitHub Actions notifications** | CI/CD failure alerts | Free |

---

## 8. Development Setup

### 8.1 Prerequisites

```bash
# Required
node >= 20.0.0
npm >= 10.0.0
git

# Recommended
VS Code with extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript Vue Plugin (Volar)
```

### 8.2 Local Setup Script

```bash
# 1. Clone repository
git clone https://github.com/senyx-software/erp.git
cd erp

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env.local
# Edit .env.local with your Supabase project credentials

# 4. Generate database types (Drizzle)
npx drizzle-kit generate

# 5. Push schema to database
npx drizzle-kit push

# 6. Seed database
npx tsx src/server/db/seed.ts

# 7. Start development server
npm run dev
```

### 8.3 NPM Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --ext .ts,.tsx",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:seed": "tsx src/server/db/seed.ts",
    "db:studio": "drizzle-kit studio",
    "format": "prettier --write ."
  }
}
```

---

## 9. Quality Gates

### 9.1 PR Merge Requirements

| Gate | Tool | Requirement |
|---|---|---|
| **Lint** | ESLint | 0 errors |
| **Types** | TypeScript | 0 errors |
| **Tests** | Vitest | All passing |
| **Build** | Next.js | Successful |
| **Security** | npm audit | No high/critical |
| **Review** | GitHub | 1 approval |

### 9.2 Code Quality Standards

```
ESLint Configuration:
  - extends: next/core-web-vitals, @typescript-eslint/strict
  - no-any: error
  - no-unused-vars: error
  - consistent-return: error

Prettier Configuration:
  - singleQuote: true
  - trailingComma: all
  - printWidth: 100
  - tabWidth: 2
```

---

## 10. Build Order (Implementation Phases)

Based on TDD Appendix D, aligned with CI/CD:

| Phase | Components | Duration Estimate |
|---|---|---|
| **Phase 1** | Base: Auth, Users, Roles/Permissions, RLS helpers, Audit wrapper, Settings | 2-3 weeks |
| **Phase 2** | HR (people as source of truth) + Designations/Departments | 1-2 weeks |
| **Phase 3** | CRM + Sales (deals open to all) | 2-3 weeks |
| **Phase 4** | Projects: Core → Board → Assignments → Time/Clock → Milestones/Payment schedule | 3-4 weeks |
| **Phase 5** | Finance: Invoices (incl. milestone flow) → Expenses/Payments → Subscriptions | 2-3 weeks |
| **Phase 6** | Notifications + Reminder jobs (owner due-date emails) | 1-2 weeks |
| **Phase 7** | Analytics/Reporting + Audit views | 2-3 weeks |
| **Phase 8** | Documents (R2), Help/Manual, Backups | 1-2 weeks |

**Total estimated timeline: 14-22 weeks** (single developer pace)

---

*This blueprint defines the complete CI/CD and DevOps architecture. See the Frontend, Backend, and Database Blueprints for application-layer details.*
