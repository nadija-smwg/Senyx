# Phase 0 — CI/CD & DevOps Infrastructure

**Duration:** Week 1 (setup) + continuous maintenance  
**Dependencies:** None (this is the first thing to set up)  
**Goal:** Establish the development environment, repository, CI/CD pipelines, and deployment infrastructure before any application code is written.

---

## 0.1 Repository & Project Initialization

### Task 0.1.1 — Create GitHub Repository
```
- [ ] Create private GitHub repo: senyx-software/erp
- [ ] Add README.md with project overview
- [ ] Add .gitignore (Node, Next.js, .env files)
- [ ] Create LICENSE file (proprietary/internal)
- [ ] Set up branch protection rules on `main`:
      - Require PR before merge
      - Require CI status checks to pass
      - Require 1 approval (when team grows)
      - Prevent force push
      - Require linear history (squash merges)
```

### Task 0.1.2 — Initialize Next.js Project
```bash
npx -y create-next-app@latest ./ \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-npm
```

### Task 0.1.3 — Install Core Dependencies
```bash
# ORM & Database
npm install drizzle-orm postgres
npm install -D drizzle-kit

# Auth
npm install @supabase/supabase-js @supabase/ssr

# Validation
npm install zod react-hook-form @hookform/resolvers

# UI Primitives (Radix)
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu \
  @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-tooltip \
  @radix-ui/react-popover @radix-ui/react-accordion @radix-ui/react-avatar \
  @radix-ui/react-checkbox @radix-ui/react-label @radix-ui/react-switch \
  @radix-ui/react-slot

# Utilities
npm install clsx tailwind-merge class-variance-authority
npm install lucide-react
npm install date-fns
npm install sonner
npm install pino

# Dev tools
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D prettier prettier-plugin-tailwindcss
npm install -D @types/node
```

### Task 0.1.4 — Project Configuration Files

**`tsconfig.json`** — Enable strict mode
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "paths": { "@/*": ["./src/*"] }
  }
}
```

**`.eslintrc.json`** — Strict linting
```json
{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

**`.prettierrc`** — Code formatting
```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

**`drizzle.config.ts`** — ORM config
```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/server/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### Task 0.1.5 — Environment File Template
```bash
# Create .env.example (committed) and .env.local (gitignored)
```

```env
# .env.example
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=

# Cloudflare R2
R2_ENDPOINT=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=

# Resend (Email)
RESEND_API_KEY=
EMAIL_FROM=

# Security
ENCRYPTION_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Task 0.1.6 — Create Directory Structure
```
src/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   ├── api/
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/
│   ├── layout/
│   ├── data/
│   ├── charts/
│   ├── board/
│   ├── clock/
│   ├── forms/
│   └── shared/
├── hooks/
├── lib/
├── types/
├── server/
│   ├── middleware/
│   ├── services/
│   ├── db/
│   │   ├── schema/
│   │   └── migrations/
│   ├── lib/
│   └── types/
└── scheduled/
```

### Task 0.1.7 — NPM Scripts Setup
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "format": "prettier --write \"src/**/*.{ts,tsx,css,json}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,css,json}\"",
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:migrate": "drizzle-kit migrate",
    "db:seed": "tsx src/server/db/seed.ts",
    "db:studio": "drizzle-kit studio"
  }
}
```

---

## 0.2 CI Pipeline (GitHub Actions)

### Task 0.2.1 — CI Workflow

**File: `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  pull_request:
    branches: [main, dev]
  push:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: '20'

jobs:
  # ─────────────────────────────────────
  # Job 1: Lint + Type Check
  # ─────────────────────────────────────
  quality:
    name: Code Quality
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Format check
        run: npm run format:check

  # ─────────────────────────────────────
  # Job 2: Unit & Integration Tests
  # ─────────────────────────────────────
  test:
    name: Tests
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:coverage

      - name: Upload coverage
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/
          retention-days: 7

  # ─────────────────────────────────────
  # Job 3: Build Verification
  # ─────────────────────────────────────
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: quality
    env:
      NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

  # ─────────────────────────────────────
  # Job 4: Security Audit
  # ─────────────────────────────────────
  security:
    name: Security Audit
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Audit dependencies
        run: npm audit --audit-level=high
        continue-on-error: true

      - name: Check for known vulnerabilities
        run: npx audit-ci --high
        continue-on-error: true
```

### Task 0.2.2 — PR Template

**File: `.github/pull_request_template.md`**

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Feature (new functionality)
- [ ] Bug fix
- [ ] Refactor (no functional change)
- [ ] Documentation
- [ ] CI/CD

## Module(s) Affected
- [ ] Auth / RBAC
- [ ] HR
- [ ] CRM
- [ ] Sales
- [ ] Projects
- [ ] Finance
- [ ] Notifications
- [ ] Analytics
- [ ] Audit
- [ ] Platform

## Checklist
- [ ] Code follows project conventions
- [ ] TypeScript strict mode passes
- [ ] Unit tests added/updated
- [ ] Audit logging implemented for state changes
- [ ] RLS policies updated if needed
- [ ] Zod validation added for new endpoints
```

---

## 0.3 CD Pipeline (Deployment)

### Task 0.3.1 — Deployment Workflow

**File: `.github/workflows/deploy.yml`**

```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: deploy-production
  cancel-in-progress: false

jobs:
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
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
          args: deploy --prod
        env:
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}

      - name: Verify Deployment
        run: |
          sleep 30
          curl -sf ${{ secrets.APP_URL }}/api/auth/me || echo "Health check warning"

      - name: Notify Success
        if: success()
        run: echo "✅ Deployment successful"

      - name: Notify Failure
        if: failure()
        run: echo "❌ Deployment failed"
```

### Task 0.3.2 — Staging Environment (Optional)

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy Staging

on:
  push:
    branches: [dev]

jobs:
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    environment: staging
    steps:
      # Same as production but with staging secrets
      - name: Deploy to Netlify (staging)
        uses: netlify/actions/cli@master
        with:
          args: deploy --alias staging
        env:
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
```

---

## 0.4 Database Backup Automation

### Task 0.4.1 — Backup Workflow

**File: `.github/workflows/db-backup.yml`**

```yaml
name: Database Backup

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 02:00 UTC
  workflow_dispatch:

jobs:
  backup:
    name: Backup PostgreSQL
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Install PostgreSQL client
        run: |
          sudo apt-get update
          sudo apt-get install -y postgresql-client-15

      - name: Create backup
        run: |
          TIMESTAMP=$(date +%Y%m%d-%H%M%S)
          FILENAME="senyx-erp-backup-${TIMESTAMP}.dump"
          pg_dump "${{ secrets.DATABASE_URL }}" \
            --format=custom \
            --compress=9 \
            --no-owner \
            --file="${FILENAME}"
          echo "BACKUP_FILE=${FILENAME}" >> $GITHUB_ENV

      - name: Upload to Cloudflare R2
        run: |
          npm install -g @aws-sdk/client-s3
          node -e "
            const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
            const fs = require('fs');
            const client = new S3Client({
              region: 'auto',
              endpoint: '${{ secrets.R2_ENDPOINT }}',
              credentials: {
                accessKeyId: '${{ secrets.R2_ACCESS_KEY_ID }}',
                secretAccessKey: '${{ secrets.R2_SECRET_ACCESS_KEY }}'
              }
            });
            const file = fs.readFileSync('${{ env.BACKUP_FILE }}');
            client.send(new PutObjectCommand({
              Bucket: 'senyx-erp-backups',
              Key: 'daily/${{ env.BACKUP_FILE }}',
              Body: file
            })).then(() => console.log('Backup uploaded successfully'));
          "

      - name: Cleanup old backups (keep 30 days)
        run: echo "TODO - implement R2 lifecycle policy or cleanup script"
```

---

## 0.5 External Service Setup

### Task 0.5.1 — Supabase Project
```
- [ ] Create Supabase project (free tier)
- [ ] Select Singapore region (nearest to Sri Lanka)
- [ ] Enable email/password auth
- [ ] Note down: Project URL, Anon Key, Service Role Key, Database URL
- [ ] Enable pgcrypto, citext extensions
- [ ] Configure auth settings:
      - Disable email confirmations (internal system)
      - Set JWT expiry to 1 hour
      - Enable refresh tokens
```

### Task 0.5.2 — Cloudflare R2
```
- [ ] Create Cloudflare account (free)
- [ ] Create R2 bucket: senyx-erp-docs (documents)
- [ ] Create R2 bucket: senyx-erp-backups (database backups)
- [ ] Generate R2 API token (S3 compatible)
- [ ] Note down: Account ID, Access Key ID, Secret Access Key, Endpoint
- [ ] Set bucket CORS policy for uploads
```

### Task 0.5.3 — Resend (Email)
```
- [ ] Create Resend account (free tier: 100 emails/day)
- [ ] Add and verify sending domain
- [ ] Generate API key
- [ ] Note down: API Key, verified from address
```

### Task 0.5.4 — Netlify
```
- [ ] Create Netlify account (free Starter plan)
- [ ] Connect GitHub repository
- [ ] Configure build settings:
      - Build command: npm run build
      - Publish directory: .next
      - Node version: 20
- [ ] Set environment variables from .env.example
- [ ] Configure custom domain: erp.senyx.io (when ready)
- [ ] Enable HTTPS (automatic with Netlify)
- [ ] Note down: Site ID, Auth Token
```

### Task 0.5.5 — Monitoring (Optional)
```
- [ ] Create UptimeRobot account (free: 50 monitors)
- [ ] Add monitor for production URL
- [ ] Configure downtime alerts (email)
```

---

## 0.6 Verification Checklist

```
- [ ] GitHub repo created with branch protection
- [ ] Next.js project initialized with TypeScript
- [ ] All dependencies installed
- [ ] Configuration files in place (.eslintrc, .prettierrc, drizzle.config, tsconfig)
- [ ] Directory structure created
- [ ] .env.example committed, .env.local gitignored
- [ ] CI workflow runs on PR (lint, type-check, test, build, security)
- [ ] CD workflow deploys to Netlify on main merge
- [ ] Database backup cron configured
- [ ] Supabase project created and connected
- [ ] Cloudflare R2 buckets created
- [ ] Resend account ready
- [ ] Netlify connected to GitHub
- [ ] First successful deployment (even if just the default Next.js page)
- [ ] PR template in place
```

---

*After Phase 0 is complete, proceed to Phase 1 (Foundation) and Phase S (Security) in parallel.*
