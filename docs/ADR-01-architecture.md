# Architecture Decision Record (ADR-01)
## Platform Architecture & Tech Stack

### Context
SENYX required a new ERP system to consolidate disparate tools for HR, Sales, Projects, and Finance into a single unified platform. The system needed to be highly performant, secure (with strict role-based access and audit logging), and easy to maintain by a small engineering team.

### Decisions

#### 1. Framework: Next.js (App Router)
**Why:** Next.js provides excellent developer experience with React Server Components (RSC) and Server Actions. This allows us to securely query the database on the server without needing a separate backend API (except for specific webhooks or file streaming). It also offers excellent streaming UI capabilities using `<Suspense>`.

#### 2. Database: PostgreSQL via Supabase
**Why:** PostgreSQL is the industry standard for relational enterprise data. We chose Supabase as the managed provider because it offers excellent connection pooling (pgbouncer), automatic daily backups, Point-In-Time-Recovery (PITR), and competitive pricing compared to AWS RDS.
*Note:* We opted NOT to use Supabase Auth or Supabase Storage, to avoid vendor lock-in, preferring to build our own JWT-based auth middleware.

#### 3. ORM: Drizzle ORM
**Why:** Drizzle provides absolute type-safety without the heavy runtime overhead of Prisma. Its SQL-like syntax makes complex analytical queries (used heavily in our Finance and Analytics modules) much easier to write and optimize.

#### 4. Object Storage: Cloudflare R2
**Why:** Cloudflare R2 offers an S3-compatible API with zero egress fees. For an ERP system that heavily relies on uploading and downloading large PDFs (Invoices, Quotes, Employee Contracts), eliminating egress costs significantly lowers operational overhead.

#### 5. Audit Logging Strategy
**Why:** Every mutation (POST/PUT/DELETE) is intercepted by a custom Audit Logger before completing. Instead of relying on database triggers, logging at the application layer allows us to capture the `userId`, `ipAddress`, and `device` metadata from the HTTP request context.

### Consequences
- **Positive:** Extremely fast time-to-market. Single repository for both frontend and backend logic. Zero egress fees on document storage.
- **Negative:** Server Actions can sometimes obscure error handling if not wrapped in proper Try/Catch blocks. Using a custom Auth implementation requires us to manually handle 2FA and password resets rather than relying on a managed service.
