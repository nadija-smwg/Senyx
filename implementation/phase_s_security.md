# Phase S — Security Hardening (Cross-Cutting)

**Duration:** Continuous — applied at every phase  
**Dependencies:** Phase 0 (CI/CD infrastructure)  
**Goal:** Implement defence-in-depth security across all layers — authentication, authorization, encryption, input validation, and OWASP protections.

---

## S.1 Authentication Security

### Task S.1.1 — Credential Storage
```
- [ ] All passwords hashed via Supabase Auth (bcrypt, min cost 10)
- [ ] No plaintext passwords stored anywhere in the system
- [ ] Password reset tokens: cryptographically random, time-limited (15 min), single-use
- [ ] Enforce minimum password policy:
      - Minimum 8 characters
      - At least 1 uppercase, 1 lowercase, 1 number
      - Validated both client-side (UX) and server-side (enforcement)
```

### Task S.1.2 — Session Security
```
- [ ] JWT tokens: 1-hour expiry, refresh token rotation
- [ ] Session table records: device, OS, browser, IP, start time
- [ ] Configurable session timeout (default: 8 hours / 480 minutes)
- [ ] Configurable max concurrent sessions (default: 3)
- [ ] Admin can view all active sessions
- [ ] Admin can force-terminate any session
- [ ] Session ended on logout; duration computed
- [ ] HttpOnly, Secure, SameSite=Lax cookies for auth tokens
```

### Task S.1.3 — Two-Factor Authentication (2FA)
```
- [ ] TOTP-based 2FA (configurable per user)
- [ ] 2FA setup flow: generate secret, show QR code, verify first code
- [ ] Recovery codes generated on 2FA enrollment (one-time use)
- [ ] 2FA verification required on login when enabled
- [ ] Admin can reset 2FA for a user (audited)
```

### Task S.1.4 — Brute Force Protection
```
- [ ] Rate limit login attempts: max 5 per minute per IP
- [ ] Rate limit password reset requests: max 3 per hour per email
- [ ] Lock account after 10 failed attempts (configurable, require admin unlock)
- [ ] Progressive delay on consecutive failures
- [ ] All failed login attempts logged in audit_logs with IP
```

---

## S.2 Authorization & Access Control

### Task S.2.1 — Application-Layer RBAC
```
- [ ] Every API route checks: authenticate → authorize → proceed
- [ ] Permission check: requirePermission(module, action, scope)
- [ ] Scope filtering: 'all' (full access), 'own' (created_by/owner), 'assigned' (project assignments)
- [ ] No route accessible without authentication (except login, password reset)
- [ ] Admin-only routes: roles management, settings, sessions, audit logs
- [ ] HR-only routes: employee CRUD, payroll, sensitive field access
- [ ] Finance-only routes: invoice issue, expense approve
```

### Task S.2.2 — Database-Layer RLS (Row-Level Security)
```
- [ ] RLS enabled on ALL business tables
- [ ] RLS policies enforce the same scope logic as the application layer
- [ ] Helper functions:
      - current_employee_id() — extracts employee from JWT
      - current_has_scope(module, action, scope) — checks role-permission mapping
- [ ] Policies cover: SELECT, INSERT, UPDATE, DELETE
- [ ] Default-deny: if no policy matches, access is denied
- [ ] Test RLS by attempting direct SQL access with different user tokens
```

### Task S.2.3 — Sensitive Data Access Control
```
- [ ] Employee sensitive fields (salary, bank_details, national_id):
      - Accessible only via HR/Admin role
      - Column-masking view for non-HR users (employees_public)
      - Every access to sensitive fields is audited (FR-AUD-02)
- [ ] Payroll records: HR/Admin only, every access audited
- [ ] Audit log access: Admin/Auditor only, access itself audited (FR-AUD-15)
```

---

## S.3 Encryption

### Task S.3.1 — Encryption at Rest
```
- [ ] Implement AES-256-GCM encryption utility:
      - src/server/lib/crypto.ts
      - encrypt(plaintext) → ciphertext (IV + tag + encrypted data, base64)
      - decrypt(ciphertext) → plaintext
      - ENCRYPTION_KEY from environment variable (64-char hex = 256 bits)
- [ ] Encrypted fields (stored encrypted in DB, decrypted in service layer):
      - employees.salary
      - employees.bank_details (JSONB → encrypt serialized JSON)
      - employees.national_id
      - payroll_records.gross
      - payroll_records.net
- [ ] Encryption key rotation strategy documented (re-encrypt on rotation)
- [ ] Never log or expose encrypted field values
```

### Task S.3.2 — Encryption in Transit
```
- [ ] HTTPS/TLS enforced by Netlify/Cloudflare (automatic)
- [ ] All API calls over HTTPS
- [ ] All Supabase connections over SSL
- [ ] All R2 operations over HTTPS
- [ ] HSTS header enabled
- [ ] No mixed content (HTTP resources on HTTPS pages)
```

---

## S.4 Input Validation & Sanitization

### Task S.4.1 — Server-Side Validation (Zod)
```
- [ ] Every API endpoint validates input with Zod schemas
- [ ] Validation runs AFTER auth, BEFORE business logic
- [ ] Shared schemas between frontend and backend (src/server/types/shared.ts)
- [ ] Validate:
      - Email format (RFC 5322)
      - URL format (valid protocol + domain)
      - Date ranges (end >= start, not in future where applicable)
      - Numeric ranges (percentages 0-100, amounts >= 0, hours 0-24)
      - String lengths (max lengths per field as defined in schema)
      - Enum values (only valid options from Section 4 of TDD)
      - UUID format for all ID parameters
      - Currency codes (ISO-4217)
- [ ] Return 400 with field-level error details on validation failure
```

### Task S.4.2 — SQL Injection Prevention
```
- [ ] Use Drizzle ORM exclusively — never raw string SQL
- [ ] Parameterized queries for any custom SQL (rare, if any)
- [ ] Filter parser (FilterNode → SQL) uses parameterized placeholders
- [ ] No user input concatenated into SQL strings — EVER
- [ ] CI lint rule: flag any use of template literals in SQL context
```

### Task S.4.3 — XSS Prevention
```
- [ ] React's default JSX escaping handles most cases
- [ ] Never use dangerouslySetInnerHTML with user-provided content
- [ ] Content-Security-Policy header set:
      - default-src 'self'
      - script-src 'self' 'unsafe-eval' (for Next.js dev)
      - style-src 'self' 'unsafe-inline'
      - img-src 'self' blob: data:
      - font-src 'self' fonts.googleapis.com fonts.gstatic.com
- [ ] Sanitize any rich text fields if added later (DOMPurify)
- [ ] Output encoding for all user-displayed data
```

### Task S.4.4 — CSRF Protection
```
- [ ] Use SameSite=Lax cookies (default for Supabase Auth)
- [ ] Verify Origin/Referer headers on state-changing requests
- [ ] CSRF token for any form submissions not using fetch API
- [ ] All API mutations use POST/PATCH/DELETE (never GET for state changes)
```

### Task S.4.5 — File Upload Security
```
- [ ] Server-side MIME type validation (allowlist):
      - Documents: pdf, doc, docx, xls, xlsx, csv, txt
      - Images: jpg, jpeg, png, gif, webp, svg
      - Archives: zip (optional)
- [ ] File size limit: 10 MB per file (configurable)
- [ ] File name sanitization: strip path traversal characters
- [ ] Store in R2 with generated key (not user-provided filename)
- [ ] Serve via signed URLs (time-limited, not direct bucket access)
- [ ] Scan for malicious content (basic: check magic bytes match MIME)
```

---

## S.5 API Security

### Task S.5.1 — Rate Limiting
```
- [ ] Implement rate limiting middleware:
      - Auth endpoints: 5 requests/minute/IP
      - API endpoints: 100 requests/minute/user
      - Export/report endpoints: 10 requests/minute/user
      - File upload: 20 requests/minute/user
- [ ] Return 429 Too Many Requests with Retry-After header
- [ ] Rate limit state: in-memory (or Supabase/Redis if needed)
```

### Task S.5.2 — Security Headers
```
- [ ] Set via next.config.js headers or middleware:

X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: [see S.4.3]
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Task S.5.3 — API Hardening
```
- [ ] Standard error responses — never leak internal details:
      - 401: "Authentication required" (no hint about what's wrong)
      - 403: "Insufficient permissions" (no detail about which permission)
      - 404: "Not found" (same for soft-deleted, unauthorized, or truly missing)
      - 500: "Internal server error" (log details server-side only)
- [ ] No stack traces in production responses
- [ ] Request size limit: 1 MB JSON body (configurable)
- [ ] Timeout: 30 seconds per request
- [ ] All secrets in environment variables, never in code or client bundle
- [ ] NEXT_PUBLIC_ prefix only for truly public values (Supabase URL, Anon Key)
```

---

## S.6 Data Protection & Privacy

### Task S.6.1 — Soft Deletes
```
- [ ] All business records use soft delete (deleted_at timestamp)
- [ ] All default queries filter: WHERE deleted_at IS NULL
- [ ] Audit logs and sessions: NEVER deletable (append-only)
- [ ] Deactivating an employee:
      - Set employees.status = 'terminated'
      - Set users.is_active = false
      - Revoke all user_roles
      - Historical references (deals, projects, time entries) preserved
      - Audit trail of deactivation recorded
```

### Task S.6.2 — Audit Trail Integrity
```
- [ ] audit_logs table: NO UPDATE, NO DELETE grants via application
- [ ] Database trigger to prevent UPDATE/DELETE on audit_logs:
      CREATE OR REPLACE FUNCTION prevent_audit_modification()
      RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'Audit logs cannot be modified or deleted';
      END;
      $$ LANGUAGE plpgsql;
      
      CREATE TRIGGER trg_audit_immutable
      BEFORE UPDATE OR DELETE ON audit_logs
      FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();
- [ ] Every state-changing operation writes an audit entry (withAudit wrapper)
- [ ] Audit entries include: actor, session, action, API route, entity, before/after, device, IP, result
```

### Task S.6.3 — Data Retention
```
- [ ] Audit log retention: configurable (default: 2 years)
- [ ] Old audit entries archived (moved to archive table or R2), never deleted
- [ ] Session data retention: configurable (default: 1 year)
- [ ] Backup retention: 30 daily + 12 monthly snapshots
```

---

## S.7 Infrastructure Security

### Task S.7.1 — Environment Isolation
```
- [ ] Separate Supabase projects for dev/staging/production
- [ ] Separate R2 buckets for dev/staging/production
- [ ] GitHub environments with environment-specific secrets
- [ ] Production secrets not accessible from PR workflows
```

### Task S.7.2 — Dependency Security
```
- [ ] npm audit in CI pipeline (fail on high/critical)
- [ ] Dependabot enabled for automatic dependency updates
- [ ] Pin major versions in package.json
- [ ] Review dependency changes in PRs
- [ ] Minimize dependency surface area (prefer built-in Node APIs)
```

### Task S.7.3 — IP Allowlisting (Optional)
```
- [ ] Middleware to check client IP against configurable allowlist
- [ ] Allowlist stored in settings table
- [ ] Bypass for Netlify/Cloudflare health checks
- [ ] Default: disabled (all authenticated users can access from any IP)
- [ ] Can be enabled per company security requirements
```

---

## S.8 Security Testing Checklist

### Apply at Every Phase

```
- [ ] Run npm audit — no high/critical vulnerabilities
- [ ] Verify all new endpoints have auth middleware
- [ ] Verify all state-changing endpoints have audit logging
- [ ] Verify new DB tables have RLS policies enabled
- [ ] Verify Zod validation on all new endpoints
- [ ] Test unauthorized access (no token → 401)
- [ ] Test forbidden access (wrong role → 403)
- [ ] Test with SQL injection payloads in inputs
- [ ] Test with XSS payloads in text fields
- [ ] Test file upload with disallowed types
- [ ] Verify sensitive data (salary, etc.) not exposed to non-HR
- [ ] Verify soft-deleted records not visible in normal queries
- [ ] Check no secrets in client-side code/bundle
- [ ] Review security headers in browser DevTools
```

---

## S.9 Security Configuration Summary

| Security Layer | Implementation | Applied At |
|---|---|---|
| **Authentication** | Supabase Auth (bcrypt, JWT, 2FA) | Phase 1 |
| **Authorization (App)** | RBAC middleware (requirePermission) | Phase 1, every subsequent phase |
| **Authorization (DB)** | PostgreSQL RLS policies | Phase 1, every subsequent phase |
| **Encryption at Rest** | AES-256-GCM for sensitive fields | Phase 2 (HR), Phase 5 (Payroll) |
| **Encryption in Transit** | HTTPS/TLS (Netlify auto) | Phase 0 |
| **Input Validation** | Zod schemas (server + client) | Every phase |
| **SQL Injection** | Drizzle ORM (parameterized) | Every phase |
| **XSS** | React escaping + CSP headers | Phase 1 |
| **CSRF** | SameSite cookies + Origin check | Phase 1 |
| **Rate Limiting** | Custom middleware | Phase 1 |
| **File Security** | MIME allowlist + signed URLs | Phase 8 |
| **Audit Integrity** | Append-only table + triggers | Phase 1 |
| **Soft Deletes** | deleted_at pattern | Every phase |
| **Dependency Audit** | npm audit in CI | Phase 0 |
| **Security Headers** | next.config.js / middleware | Phase 1 |

---

*Security is not a phase — it's a practice applied at every step. Every PR should include the security checklist from S.8.*
