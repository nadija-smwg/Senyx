# Phase 8 — Documents, Help, Backups & Final Polish

**Duration:** 1–2 weeks  
**Dependencies:** Phase 1–7 (all modules complete)  
**Tables:** 1 (`documents` — already created in Phase 1)  
**API Routes:** 3  
**Goal:** Complete the remaining platform features and polish the system for production readiness.

---

## 8.1 Document Management (Cloudflare R2)

### Task 8.1.1 — R2 Client Implementation
**File: `src/server/lib/r2-client.ts`**
```
- [ ] Initialize S3-compatible client for Cloudflare R2:
      import { S3Client } from '@aws-sdk/client-s3';
      const r2 = new S3Client({
        region: 'auto',
        endpoint: process.env.R2_ENDPOINT,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
      });

- [ ] uploadDocument(file, key, mimeType) → void
      - PutObjectCommand to R2 bucket

- [ ] getSignedDownloadUrl(key, expiresIn = 3600) → string
      - GetObjectCommand with presigner → signed URL (1 hour default)

- [ ] deleteDocument(key) → void
      - DeleteObjectCommand from R2 bucket

- [ ] generateStorageKey(ownerType, ownerId, fileName) → string
      - Format: "{ownerType}/{ownerId}/{uuid}-{sanitizedFileName}"
      - e.g. "project/abc-123/def-456-design-spec.pdf"
```

### Task 8.1.2 — Document Service
**File: `src/server/services/document.service.ts`**
```
- [ ] upload(ctx, file, ownerType, ownerId) → DocumentRef
      - Validate: file type against allowlist (see Phase S — S.4.5)
        Allowed: pdf, doc, docx, xls, xlsx, csv, txt, jpg, jpeg, png, gif, webp, svg, zip
      - Validate: file size <= 10 MB
      - Sanitize filename (strip path traversal chars)
      - Generate storage key
      - Upload to R2
      - Create documents record with:
        storage_key, file_name, mime_type, size_bytes,
        owner_type, owner_id, uploaded_by
      - Audit: document.upload

- [ ] getDownloadUrl(ctx, documentId) → { url, fileName }
      - Fetch document record
      - Check permission: document inherits owner record's permissions
        e.g. project document → check project access
             expense receipt → check expense access
             employee contract → check HR access
      - Generate signed URL (1 hour expiry)
      - Optionally audit sensitive document access

- [ ] delete(ctx, documentId) → void
      - Check permission (owner or Admin)
      - Delete from R2
      - Soft-delete documents record
      - Audit: document.delete

- [ ] listByOwner(ownerType, ownerId) → DocumentRef[]
      - Return all documents for an entity
```

### Task 8.1.3 — Document Route Handlers
```
- [ ] POST   /api/documents           → upload
      - Multipart form data upload
      - Include ownerType, ownerId in form fields

- [ ] GET    /api/documents/:id        → getDownloadUrl
      - Returns { url: "signed-url", fileName: "original-name.pdf" }

- [ ] DELETE /api/documents/:id        → delete
```

### Task 8.1.4 — File Upload UI Component
**File: `src/components/shared/file-upload.tsx`**
```
- [ ] Reusable file upload component:
      - Drag-and-drop zone
      - File picker button
      - File type restriction (visual + validation)
      - File size limit display
      - Upload progress indicator
      - Preview for images
      - File name + size display after upload
      - Remove/replace action
      - Returns document_id after successful upload
```

### Task 8.1.5 — Integrate Documents Across Modules
```
- [ ] Projects: app/(dashboard)/projects/[id]/documents/page.tsx
      - List project documents
      - Upload new document
      - Download via signed URL
      - Delete document

- [ ] HR: Employee contracts/NDAs (HR only)
      - Upload from employee detail page (HR tab)

- [ ] Finance: Expense receipts
      - Upload when creating expense
      - View from expense detail

- [ ] Sales: Quote attachments
      - Upload PDF when creating quote
      - Download from quote detail

- [ ] Each module's document section uses the same file-upload component
      with ownerType/ownerId context
```

---

## 8.2 Help / User Manual

### Task 8.2.1 — Help Content Architecture
```
- [ ] Help content stored as Markdown in the settings table:
      key: 'help.{section_slug}'
      value: { title, content (markdown), role_aware: boolean }

- [ ] Default help sections (seeded):
      - Getting Started — Login, navigation, first-time setup
      - Dashboard — Understanding KPIs and charts
      - CRM — Managing accounts, contacts, interactions
      - Sales — Creating deals, pipeline management, closing deals
      - Projects — Creating projects, Kanban board, time tracking
      - Finance — Invoices, expenses, payments
      - HR — Employee management, leave, payroll
      - Analytics — Using filters, reports, exports
      - Settings — Roles, permissions, configuration (Admin)
      - FAQ — Common questions and troubleshooting

- [ ] Admin can edit help content via Settings without code deployment
```

### Task 8.2.2 — Help Service
**File: `src/server/services/help.service.ts`**
```
- [ ] getHelpSections(ctx) → HelpSection[]
      - Return sections relevant to user's roles

- [ ] getHelpSection(ctx, slug) → HelpSection
      - Return specific section content

- [ ] updateHelpSection(ctx, slug, content) → void (Admin only, audited)

- [ ] searchHelp(ctx, query) → HelpSection[]
      - Full-text search across help content
```

### Task 8.2.3 — Help Pages
```
- [ ] app/(dashboard)/help/page.tsx — Help center
      - Sidebar navigation with section titles
      - Main content area rendering Markdown
      - Search input at top
      - Role-aware: only show relevant sections
      - Admin: inline edit button → opens editor

- [ ] Help content rendered with React Markdown:
      npm install react-markdown remark-gfm
      - Supports headings, lists, code blocks, tables, images
      - Styled to match application design system

- [ ] Contextual help:
      - "?" icon on complex pages linking to relevant help section
      - Tooltip hints on form fields (from help content)
```

---

## 8.3 Database Backup Verification

### Task 8.3.1 — Backup System Verification
```
- [ ] Verify daily backup cron running (from Phase 0)
- [ ] Verify backups appearing in R2 senyx-erp-backups bucket
- [ ] Perform a restore test:
      1. Download latest backup from R2
      2. Restore to a test database
      3. Verify data integrity
      4. Document restore procedure

- [ ] Backup monitoring:
      - Log each backup run in audit_logs (system action)
      - Alert if backup fails (via notification or email)

- [ ] Retention policy enforced:
      - Keep 30 daily backups
      - Keep 12 monthly backups (1st of each month)
      - Delete older backups
```

---

## 8.4 Final Polish & Production Readiness

### Task 8.4.1 — Performance Optimization
```
- [ ] Review and optimize slow queries:
      - Run EXPLAIN ANALYZE on common queries
      - Add missing indexes if needed
      - Consider materialized views for heavy dashboard KPIs

- [ ] Frontend performance:
      - Verify loading.tsx skeletons on all pages
      - Verify Suspense boundaries for streaming
      - Check bundle size (next-bundle-analyzer)
      - Lazy load heavy components (charts, PDF renderer)
      - Verify image optimization (next/image)
      - Check Core Web Vitals (Lighthouse)

- [ ] API response times:
      - All list views < 2 seconds
      - Board operations < 1 second
      - Filter queries optimized with proper indexes
```

### Task 8.4.2 — Error Handling Polish
```
- [ ] Global error boundary (src/app/error.tsx):
      - Friendly error message
      - "Try Again" button
      - Log error to audit (if authenticated)

- [ ] Not found page (src/app/not-found.tsx):
      - Friendly 404 page
      - Navigation links back to dashboard

- [ ] Per-route error.tsx files for module-specific error handling

- [ ] Toast notifications for all user actions:
      - Success: "Deal created successfully"
      - Error: "Failed to update project. Please try again."
      - Warning: "Payment milestone percentages exceed 100%"
```

### Task 8.4.3 — Accessibility Review
```
- [ ] Keyboard navigation:
      - Tab through all interactive elements
      - Enter/Space to activate buttons
      - Escape to close modals/dropdowns
      - Arrow keys in dropdown menus

- [ ] ARIA labels:
      - All form inputs have labels
      - Buttons have accessible names
      - Status badges have aria-label
      - Loading states announced

- [ ] Color contrast:
      - Verify WCAG AA compliance for text contrast
      - Status colors distinguishable (not just by color)

- [ ] Focus management:
      - Focus trap in modals
      - Focus returns to trigger after modal close
```

### Task 8.4.4 — Responsive Design Verification
```
- [ ] Desktop (≥1280px): Full sidebar + content, all features
- [ ] Tablet (768–1279px):
      - Sidebar collapses to icon-only
      - Tables responsive (horizontal scroll or card view)
      - Board columns scrollable horizontally
- [ ] Mobile (<768px):
      - Navigation drawer or bottom nav
      - Card-based layouts replace tables
      - Board shows one column at a time (swipeable)
```

### Task 8.4.5 — SEO & Meta Tags
```
- [ ] Root layout: meta title, description, favicon
- [ ] Per-page titles: "Projects | SENYX ERP", "Deals | SENYX ERP"
- [ ] Open Graph tags (for internal link previews)
- [ ] Robots: noindex (internal application, not for search engines)
```

### Task 8.4.6 — Production Configuration
```
- [ ] Environment variables verified for production
- [ ] Error logging configured (no verbose logging in prod)
- [ ] Console.log statements removed (ESLint no-console rule)
- [ ] Security headers verified (from Phase S)
- [ ] HTTPS enforced (Netlify default)
- [ ] Custom domain configured: erp.senyx.io
- [ ] DNS records set up
```

### Task 8.4.7 — Smoke Test Suite
```
- [ ] Create end-to-end smoke test checklist:

      Auth:
      - [ ] Login with valid credentials
      - [ ] Login fails with invalid credentials
      - [ ] Password reset flow
      - [ ] Session appears in active sessions

      HR:
      - [ ] Create employee (HR role)
      - [ ] Employee appears in list
      - [ ] Sensitive fields hidden for non-HR

      CRM + Sales:
      - [ ] Create account + contact
      - [ ] Create deal (any employee)
      - [ ] Move deal through stages
      - [ ] Close deal as Won
      - [ ] Create project from won deal

      Projects:
      - [ ] Project created with board columns
      - [ ] Create tasks on board
      - [ ] Drag task between columns
      - [ ] Clock in/out
      - [ ] Log manual time
      - [ ] Complete milestone

      Finance:
      - [ ] Draft invoice created from milestone
      - [ ] Issue invoice (Finance role)
      - [ ] Record payment
      - [ ] Invoice marked as paid
      - [ ] Milestone marked as paid

      Notifications:
      - [ ] Notifications appear for relevant actions
      - [ ] Email sent for due-date reminders

      Analytics:
      - [ ] Dashboard KPIs rendering
      - [ ] Report export (PDF/CSV)

      Audit:
      - [ ] All actions visible in audit log
      - [ ] Before/after diffs shown

      Documents:
      - [ ] Upload document to project
      - [ ] Download via signed URL
      - [ ] Delete document

      Help:
      - [ ] Help content accessible
      - [ ] Search working
```

---

## 8.5 Documentation

### Task 8.5.1 — Technical Documentation
```
- [ ] README.md:
      - Project overview
      - Tech stack
      - Local setup guide
      - Environment variables reference
      - NPM scripts reference
      - Deployment instructions

- [ ] CONTRIBUTING.md:
      - Git workflow
      - Commit conventions
      - PR process
      - Code style guide

- [ ] Architecture Decision Records (ADRs):
      - Why Next.js App Router
      - Why Supabase (vs Neon + Auth.js)
      - Why Drizzle (vs Prisma)
      - Why Cloudflare R2 (vs Supabase Storage)
      - Audit trail design decisions
```

### Task 8.5.2 — API Documentation
```
- [ ] API documentation (auto-generated or manual):
      - All 105 endpoints documented
      - Request/response examples
      - Authentication requirements
      - Error codes
      - Can use Swagger/OpenAPI if desired (optional)
```

---

## 8.6 Verification Checklist — Phase 8 (Final)

```
Documents:
- [ ] File upload to R2 working (drag-and-drop + file picker)
- [ ] File type/size validation enforced
- [ ] Signed URL download working
- [ ] Document deletion working (R2 + DB)
- [ ] Documents integrated: projects, HR, expenses, quotes
- [ ] Document access respects owner record permissions

Help:
- [ ] Help content seeded for all modules
- [ ] Help center with search and navigation
- [ ] Admin can edit help content without deployment
- [ ] Role-aware help sections

Backups:
- [ ] Daily backup cron running
- [ ] Backups stored in R2
- [ ] Restore test successful
- [ ] Retention policy enforced

Polish:
- [ ] All pages have loading skeletons
- [ ] Error boundaries on all routes
- [ ] Toast notifications for all actions
- [ ] Keyboard accessible
- [ ] Responsive on desktop + tablet
- [ ] Performance: all views < 2s, board < 1s
- [ ] Bundle size reasonable
- [ ] No console.log in production
- [ ] Security headers verified

Production:
- [ ] Custom domain configured
- [ ] HTTPS enforced
- [ ] Environment variables set
- [ ] Full smoke test passed
- [ ] Documentation complete
- [ ] CI/CD pipeline stable
```

---

*Phase 8 completion = Milestone M8 (Production Ready). The SENYX ERP system is complete and ready for internal use.* 🎉

---

## Post-Launch & Future Considerations

```
- Monitor Supabase free tier usage (database size, API requests)
- Monitor R2 usage (storage, bandwidth)
- Monitor Resend usage (100 emails/day free tier)
- Collect user feedback from initial users
- Plan for Phase 2 features:
  - Client-facing portal (read-only project/invoice view)
  - Native mobile app (if needed)
  - Third-party accounting sync
  - Audit log migration to time-series DB (if volume grows)
```
