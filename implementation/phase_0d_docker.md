# Phase 0D — Docker & Containerization

**Duration:** Integrated into Phase 0 (adds ~1 day)  
**Dependencies:** None  
**Goal:** Containerize the development environment and provide a self-hosting deployment option.

---

## Why Docker for SENYX ERP

| Use Case | Benefit |
|---|---|
| **Local Development** | Run PostgreSQL + app locally without cloud dependency; faster, works offline |
| **Team Consistency** | Every developer gets the same Node, PostgreSQL, and extension versions |
| **CI/CD Testing** | Run tests against a real PostgreSQL instance in GitHub Actions |
| **Self-Hosting Option** | Deploy to any VPS/cloud VM if you outgrow Netlify + Supabase free tiers |
| **Database Isolation** | Each developer has their own local database; no conflicts |
| **Easy Onboarding** | New developer setup: `docker compose up` — done |

> **Note:** Docker does NOT replace Netlify + Supabase for production in v1. It augments local development and gives a future self-hosting path.

---

## 0D.1 Local Development Setup (Docker Compose)

### Task 0D.1.1 — Dockerfile (Next.js App)

**File: `Dockerfile`**

```dockerfile
# ─────────────────────────────────────
# Stage 1: Dependencies
# ─────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ─────────────────────────────────────
# Stage 2: Builder
# ─────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for environment variables needed at build time
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

RUN npm run build

# ─────────────────────────────────────
# Stage 3: Runner (Production)
# ─────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### Task 0D.1.2 — Development Dockerfile

**File: `Dockerfile.dev`**

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies for native modules (if any)
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

### Task 0D.1.3 — Docker Compose (Local Development)

**File: `docker-compose.yml`**

```yaml
version: '3.9'

services:
  # ─────────────────────────────────────
  # PostgreSQL Database (local dev)
  # ─────────────────────────────────────
  db:
    image: postgres:15-alpine
    container_name: senyx-erp-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: senyx_erp
      POSTGRES_USER: senyx
      POSTGRES_PASSWORD: senyx_local_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/init-db.sql:/docker-entrypoint-initdb.d/01-init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U senyx -d senyx_erp"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ─────────────────────────────────────
  # Next.js Application (dev mode)
  # ─────────────────────────────────────
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: senyx-erp-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      # Database (local PostgreSQL)
      DATABASE_URL: postgresql://senyx:senyx_local_dev@db:5432/senyx_erp
      
      # Supabase Auth (still using cloud Supabase for auth in dev)
      NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      
      # R2 (can use MinIO locally for dev)
      R2_ENDPOINT: http://minio:9000
      R2_ACCESS_KEY_ID: minioadmin
      R2_SECRET_ACCESS_KEY: minioadmin
      R2_BUCKET_NAME: senyx-erp-docs
      
      # Email (use Mailpit for local email testing)
      RESEND_API_KEY: ${RESEND_API_KEY:-}
      EMAIL_FROM: noreply@localhost
      SMTP_HOST: mailpit
      SMTP_PORT: 1025
      
      # Security
      ENCRYPTION_KEY: ${ENCRYPTION_KEY:-0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef}
      
      # App
      NEXT_PUBLIC_APP_URL: http://localhost:3000
      NODE_ENV: development
    volumes:
      - .:/app
      - /app/node_modules        # Preserve container node_modules
      - /app/.next               # Preserve container build cache
    depends_on:
      db:
        condition: service_healthy
      minio:
        condition: service_started

  # ─────────────────────────────────────
  # MinIO (S3-compatible local storage)
  # Replaces Cloudflare R2 for local dev
  # ─────────────────────────────────────
  minio:
    image: minio/minio:latest
    container_name: senyx-erp-minio
    restart: unless-stopped
    ports:
      - "9000:9000"    # API
      - "9001:9001"    # Console UI
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"

  # ─────────────────────────────────────
  # MinIO Bucket Initialization
  # ─────────────────────────────────────
  minio-init:
    image: minio/mc:latest
    container_name: senyx-erp-minio-init
    depends_on:
      - minio
    entrypoint: >
      /bin/sh -c "
      sleep 5;
      mc alias set local http://minio:9000 minioadmin minioadmin;
      mc mb local/senyx-erp-docs --ignore-existing;
      mc mb local/senyx-erp-backups --ignore-existing;
      echo 'Buckets created successfully';
      "

  # ─────────────────────────────────────
  # Mailpit (Local email testing)
  # Catches all outgoing emails for dev
  # ─────────────────────────────────────
  mailpit:
    image: axllent/mailpit:latest
    container_name: senyx-erp-mailpit
    restart: unless-stopped
    ports:
      - "8025:8025"    # Web UI
      - "1025:1025"    # SMTP

  # ─────────────────────────────────────
  # Drizzle Studio (DB browser)
  # ─────────────────────────────────────
  # Access via: npx drizzle-kit studio
  # Or use pgAdmin below

  # ─────────────────────────────────────
  # pgAdmin (Optional DB admin UI)
  # ─────────────────────────────────────
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: senyx-erp-pgadmin
    restart: unless-stopped
    profiles: ["tools"]  # Only start with: docker compose --profile tools up
    ports:
      - "5050:80"
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@senyx.io
      PGADMIN_DEFAULT_PASSWORD: admin
    depends_on:
      - db

volumes:
  postgres_data:
  minio_data:
```

### Task 0D.1.4 — Database Initialization Script

**File: `docker/init-db.sql`**

```sql
-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Create application role (mimics Supabase's setup)
-- For local dev, the app connects directly as the senyx user

-- Log successful initialization
DO $$
BEGIN
  RAISE NOTICE 'SENYX ERP database initialized successfully';
END $$;
```

### Task 0D.1.5 — Docker .env File

**File: `.env.docker`** (gitignored, copied from `.env.docker.example`)

```env
# Docker Compose environment variables
# Copy to .env.docker and fill in values

# Supabase (cloud — used for auth even in Docker dev mode)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Resend (optional for local dev; Mailpit catches emails)
RESEND_API_KEY=

# Encryption
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

### Task 0D.1.6 — Docker .dockerignore

**File: `.dockerignore`**

```
node_modules
.next
.git
.gitignore
.env*
!.env.example
docker-compose*.yml
Dockerfile*
README.md
*.md
coverage
.vscode
.idea
drizzle/*.sql
```

---

## 0D.2 Docker Compose Commands (Developer Cheatsheet)

### Task 0D.2.1 — Create Makefile for Common Commands

**File: `Makefile`**

```makefile
.PHONY: help dev up down restart logs db-push db-seed db-studio clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ─── Development ──────────────────────────

dev: ## Start all services in development mode
	docker compose --env-file .env.docker up --build

up: ## Start all services in background
	docker compose --env-file .env.docker up -d --build

down: ## Stop all services
	docker compose down

restart: ## Restart all services
	docker compose down && docker compose --env-file .env.docker up -d --build

logs: ## View logs (all services)
	docker compose logs -f

logs-app: ## View app logs only
	docker compose logs -f app

logs-db: ## View database logs only
	docker compose logs -f db

# ─── Database ─────────────────────────────

db-push: ## Push schema changes to local database
	docker compose exec app npx drizzle-kit push

db-seed: ## Run database seed
	docker compose exec app npx tsx src/server/db/seed.ts

db-studio: ## Open Drizzle Studio (DB browser)
	docker compose exec app npx drizzle-kit studio

db-shell: ## Open PostgreSQL shell
	docker compose exec db psql -U senyx -d senyx_erp

db-backup: ## Create local database backup
	docker compose exec db pg_dump -U senyx senyx_erp > backups/local-$$(date +%Y%m%d-%H%M%S).sql

db-reset: ## Reset database (drop and recreate)
	docker compose exec db psql -U senyx -c "DROP DATABASE IF EXISTS senyx_erp;"
	docker compose exec db psql -U senyx -c "CREATE DATABASE senyx_erp;"
	docker compose exec app npx drizzle-kit push
	docker compose exec app npx tsx src/server/db/seed.ts

# ─── Testing ──────────────────────────────

test: ## Run tests inside container
	docker compose exec app npm run test:run

test-coverage: ## Run tests with coverage
	docker compose exec app npm run test:coverage

lint: ## Run linter inside container
	docker compose exec app npm run lint

type-check: ## Run TypeScript type check
	docker compose exec app npm run type-check

# ─── Tools ────────────────────────────────

pgadmin: ## Start pgAdmin (DB admin UI)
	docker compose --profile tools up -d pgadmin

minio-ui: ## Open MinIO Console (object storage UI)
	@echo "MinIO Console: http://localhost:9001 (minioadmin/minioadmin)"

mailpit-ui: ## Open Mailpit (email testing UI)
	@echo "Mailpit UI: http://localhost:8025"

# ─── Cleanup ──────────────────────────────

clean: ## Remove all containers, volumes, and images
	docker compose down -v --rmi local
	rm -rf .next node_modules

prune: ## Docker system prune (free disk space)
	docker system prune -af --volumes
```

---

## 0D.3 Docker in CI/CD (GitHub Actions)

### Task 0D.3.1 — Use Docker PostgreSQL in CI Tests

Update `.github/workflows/ci.yml` test job to use a PostgreSQL service container:

```yaml
  test:
    name: Tests
    runs-on: ubuntu-latest
    needs: quality

    # ─── PostgreSQL service for integration tests ───
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_DB: senyx_erp_test
          POSTGRES_USER: senyx
          POSTGRES_PASSWORD: test_password
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U senyx"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    env:
      DATABASE_URL: postgresql://senyx:test_password@localhost:5432/senyx_erp_test

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci

      # Initialize test database
      - name: Setup test database
        run: |
          PGPASSWORD=test_password psql -h localhost -U senyx -d senyx_erp_test \
            -f docker/init-db.sql
          npx drizzle-kit push

      - name: Run tests
        run: npm run test:coverage
        env:
          DATABASE_URL: postgresql://senyx:test_password@localhost:5432/senyx_erp_test
          ENCRYPTION_KEY: 0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-report
          path: coverage/
```

### Task 0D.3.2 — Docker Build Verification in CI

Add a Docker build check to the CI pipeline:

```yaml
  docker-build:
    name: Docker Build Check
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: |
          docker build \
            --build-arg NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co \
            --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder \
            --build-arg NEXT_PUBLIC_APP_URL=http://localhost:3000 \
            -t senyx-erp:test .

      - name: Verify image size
        run: |
          SIZE=$(docker image inspect senyx-erp:test --format='{{.Size}}')
          SIZE_MB=$((SIZE / 1024 / 1024))
          echo "Image size: ${SIZE_MB}MB"
          if [ $SIZE_MB -gt 500 ]; then
            echo "WARNING: Image size exceeds 500MB"
          fi
```

---

## 0D.4 Self-Hosting Deployment (Production Docker)

### Task 0D.4.1 — Production Docker Compose

**File: `docker-compose.prod.yml`**

This is the self-hosting alternative to Netlify + Supabase — deploy on any VPS.

```yaml
version: '3.9'

services:
  # ─────────────────────────────────────
  # PostgreSQL (self-hosted)
  # ─────────────────────────────────────
  db:
    image: postgres:15-alpine
    container_name: senyx-erp-db
    restart: always
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "127.0.0.1:5432:5432"  # Only localhost (behind reverse proxy)
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/init-db.sql:/docker-entrypoint-initdb.d/01-init.sql
      - ./backups:/backups  # For backup scripts
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 30s
      timeout: 10s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 512M

  # ─────────────────────────────────────
  # Next.js Application (production)
  # ─────────────────────────────────────
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}
        NEXT_PUBLIC_APP_URL: ${NEXT_PUBLIC_APP_URL}
    container_name: senyx-erp-app
    restart: always
    ports:
      - "127.0.0.1:3000:3000"  # Behind reverse proxy
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      R2_ENDPOINT: ${R2_ENDPOINT}
      R2_ACCESS_KEY_ID: ${R2_ACCESS_KEY_ID}
      R2_SECRET_ACCESS_KEY: ${R2_SECRET_ACCESS_KEY}
      R2_BUCKET_NAME: ${R2_BUCKET_NAME}
      RESEND_API_KEY: ${RESEND_API_KEY}
      EMAIL_FROM: ${EMAIL_FROM}
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}
      NODE_ENV: production
    depends_on:
      db:
        condition: service_healthy
    deploy:
      resources:
        limits:
          memory: 512M
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/auth/me"]
      interval: 30s
      timeout: 10s
      retries: 3

  # ─────────────────────────────────────
  # Nginx Reverse Proxy + SSL
  # ─────────────────────────────────────
  nginx:
    image: nginx:alpine
    container_name: senyx-erp-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/nginx/ssl:/etc/nginx/ssl:ro       # SSL certs
      - ./docker/nginx/conf.d:/etc/nginx/conf.d:ro
    depends_on:
      - app

  # ─────────────────────────────────────
  # Automated Backups (cron)
  # ─────────────────────────────────────
  backup:
    image: postgres:15-alpine
    container_name: senyx-erp-backup
    restart: always
    environment:
      PGHOST: db
      PGUSER: ${DB_USER}
      PGPASSWORD: ${DB_PASSWORD}
      PGDATABASE: ${DB_NAME}
    volumes:
      - ./backups:/backups
      - ./docker/backup.sh:/backup.sh:ro
    entrypoint: /bin/sh
    command: >
      -c "echo '0 2 * * * /backup.sh' | crontab - && crond -f"
    depends_on:
      - db

volumes:
  postgres_data:
```

### Task 0D.4.2 — Nginx Configuration

**File: `docker/nginx/conf.d/default.conf`**

```nginx
upstream nextjs {
    server app:3000;
}

server {
    listen 80;
    server_name erp.senyx.io;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name erp.senyx.io;

    ssl_certificate     /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy strict-origin-when-cross-origin;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    # Client max body size (file uploads)
    client_max_body_size 15M;

    location / {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Task 0D.4.3 — Backup Script

**File: `docker/backup.sh`**

```bash
#!/bin/sh
set -e

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/backups"
FILENAME="senyx-erp-${TIMESTAMP}.dump"

echo "[$(date)] Starting database backup..."

pg_dump \
  --format=custom \
  --compress=9 \
  --no-owner \
  --file="${BACKUP_DIR}/${FILENAME}"

echo "[$(date)] Backup created: ${FILENAME}"

# Cleanup: keep last 30 daily backups
cd ${BACKUP_DIR}
ls -t senyx-erp-*.dump | tail -n +31 | xargs -r rm
echo "[$(date)] Old backups cleaned up"
```

---

## 0D.5 Developer Workflow with Docker

### Task 0D.5.1 — First-Time Setup Guide

```markdown
# Developer Setup (Docker)

## Prerequisites
- Docker Desktop installed (Windows/Mac) or Docker Engine + Compose (Linux)
- Git

## Quick Start
1. Clone the repository:
   git clone https://github.com/senyx-software/erp.git && cd erp

2. Copy environment file:
   cp .env.docker.example .env.docker
   # Fill in Supabase credentials (for auth)

3. Start everything:
   make dev
   # or: docker compose --env-file .env.docker up --build

4. Initialize database:
   make db-push    # Apply schema
   make db-seed    # Seed default data

5. Open the app:
   - App:        http://localhost:3000
   - Mailpit:    http://localhost:8025  (email testing)
   - MinIO:      http://localhost:9001  (file storage)
   - pgAdmin:    make pgadmin → http://localhost:5050  (optional)

## Daily Development
   make up        # Start services in background
   make logs-app  # Watch app logs
   make down      # Stop when done

## Database Commands
   make db-push   # Apply schema changes
   make db-seed   # Re-seed data
   make db-shell  # PostgreSQL CLI
   make db-reset  # Full reset (drop + recreate + seed)

## Running Tests
   make test           # Run all tests
   make test-coverage  # With coverage report
```

### Task 0D.5.2 — Dual Mode Support (Docker vs Native)

Support both Docker and native development:

```
# Option A: Docker (recommended for consistency)
make dev

# Option B: Native (if Docker not available)
# Requires: Node 20, PostgreSQL 15 installed locally
npm install
npm run dev
```

Update `package.json` to detect environment:

```json
{
  "scripts": {
    "dev": "next dev",
    "dev:docker": "docker compose --env-file .env.docker up --build"
  }
}
```

---

## 0D.6 Service Port Map

| Service | Port | URL | Purpose |
|---|---|---|---|
| **Next.js App** | 3000 | http://localhost:3000 | Application |
| **PostgreSQL** | 5432 | `postgresql://senyx:senyx_local_dev@localhost:5432/senyx_erp` | Database |
| **MinIO API** | 9000 | http://localhost:9000 | S3-compatible storage (replaces R2 locally) |
| **MinIO Console** | 9001 | http://localhost:9001 | Storage admin UI |
| **Mailpit Web** | 8025 | http://localhost:8025 | Email testing UI |
| **Mailpit SMTP** | 1025 | `smtp://localhost:1025` | Catches outgoing emails |
| **pgAdmin** | 5050 | http://localhost:5050 | Database admin (optional) |

---

## 0D.7 Docker Health Monitoring

### Task 0D.7.1 — Container Health Checks
```
All services have health checks configured:
- [ ] db: pg_isready check every 30s
- [ ] app: HTTP health check to /api/auth/me every 30s
- [ ] nginx: TCP check on port 443

Docker Compose restart policy:
- Dev: unless-stopped (survives accidental stops)
- Prod: always (auto-restart on crash)
```

### Task 0D.7.2 — Resource Limits (Production)
```
- [ ] PostgreSQL: 512 MB memory limit
- [ ] Next.js App: 512 MB memory limit
- [ ] Nginx: 128 MB memory limit
- [ ] Total VPS requirement: 2 GB RAM minimum, 4 GB recommended
```

---

## 0D.8 Self-Hosting Deployment Guide

### Task 0D.8.1 — VPS Deployment Steps

```bash
# 1. Provision a VPS (DigitalOcean, Hetzner, Linode, etc.)
#    Minimum: 2 GB RAM, 1 vCPU, 25 GB SSD
#    Recommended: 4 GB RAM, 2 vCPU, 50 GB SSD

# 2. Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 3. Clone repository
git clone https://github.com/senyx-software/erp.git
cd erp

# 4. Setup environment
cp .env.prod.example .env.prod
# Edit .env.prod with production values

# 5. Setup SSL (Let's Encrypt)
sudo apt install certbot
sudo certbot certonly --standalone -d erp.senyx.io
cp /etc/letsencrypt/live/erp.senyx.io/fullchain.pem docker/nginx/ssl/
cp /etc/letsencrypt/live/erp.senyx.io/privkey.pem docker/nginx/ssl/

# 6. Deploy
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

# 7. Initialize database
docker compose -f docker-compose.prod.yml exec app npx drizzle-kit push
docker compose -f docker-compose.prod.yml exec app npx tsx src/server/db/seed.ts

# 8. Verify
curl https://erp.senyx.io/api/auth/me
```

### Task 0D.8.2 — Estimated VPS Costs (Monthly)

| Provider | Spec | Cost/month |
|---|---|---|
| **Hetzner CX22** | 2 vCPU, 4 GB RAM, 40 GB | ~€4.15 |
| **DigitalOcean Basic** | 2 vCPU, 4 GB RAM, 80 GB | $24 |
| **Linode Shared** | 2 vCPU, 4 GB RAM, 80 GB | $24 |
| **Oracle Cloud** | 4 vCPU, 24 GB RAM | **Free** (Always Free tier) |

> Compare to Netlify + Supabase free tiers: $0/month but with usage limits.  
> Docker self-hosting costs $4–24/month but has **no usage limits**.

---

## 0D.9 Verification Checklist

```
Local Development:
- [ ] docker compose up starts all services (db, app, minio, mailpit)
- [ ] App accessible at http://localhost:3000
- [ ] PostgreSQL accessible at localhost:5432
- [ ] MinIO console at http://localhost:9001
- [ ] Mailpit catches emails at http://localhost:8025
- [ ] make db-push applies schema
- [ ] make db-seed seeds default data
- [ ] Hot reload working (code changes reflect immediately)
- [ ] File uploads work via MinIO (S3-compatible)
- [ ] Emails visible in Mailpit

CI/CD:
- [ ] GitHub Actions CI uses PostgreSQL service container for tests
- [ ] Docker build check passes in CI
- [ ] Image size reasonable (< 500 MB)

Production (if self-hosting):
- [ ] Production compose starts all services
- [ ] Nginx reverse proxy with SSL working
- [ ] Health checks passing
- [ ] Backup cron running (daily at 02:00)
- [ ] Resource limits configured
```

---

## 0D.10 File Summary

| File | Purpose |
|---|---|
| `Dockerfile` | Production multi-stage build (optimized, ~150 MB) |
| `Dockerfile.dev` | Development build (with hot reload) |
| `docker-compose.yml` | Local development stack (PostgreSQL + MinIO + Mailpit) |
| `docker-compose.prod.yml` | Self-hosted production stack (+ Nginx + Backup) |
| `.dockerignore` | Exclude unnecessary files from build |
| `.env.docker.example` | Environment template for Docker dev |
| `docker/init-db.sql` | Database initialization (extensions) |
| `docker/nginx/conf.d/default.conf` | Nginx reverse proxy config |
| `docker/backup.sh` | Automated backup script |
| `Makefile` | Developer command shortcuts |

---

*Docker is now integrated into the development workflow and provides a self-hosting deployment path. The primary v1 production deployment remains Netlify + Supabase (free tier), with Docker as the local dev environment and future self-hosting option.*
