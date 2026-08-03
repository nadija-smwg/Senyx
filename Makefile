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
