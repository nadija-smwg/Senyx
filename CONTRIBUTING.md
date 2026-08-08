# Contributing to SENYX ERP

First off, thank you for considering contributing to Senyx ERP! As an internal enterprise application, maintaining a clean, secure, and highly performant codebase is our top priority.

## Development Workflow

1. **Clone the repository** and run `npm install`.
2. **Branching Strategy:**
   - Create a feature branch from `main`: `feature/JIRA-123-short-description`
   - For bug fixes use: `bugfix/JIRA-124-issue-name`
3. **Write Code:**
   - Follow the established TypeScript types. Do not use `any`.
   - Use `Tailwind CSS` for styling. Avoid custom CSS files unless absolutely necessary.
   - All server actions/API routes must use the `withAuth` middleware and verify roles.
   - All mutations must log an event to the `audit_logs` table.
4. **Testing:**
   - Run `npm run build` to ensure the TypeScript compiler passes cleanly.
   - Manually test your UI changes across Desktop and Mobile viewports.
5. **Commit Messages:**
   - We follow [Conventional Commits](https://www.conventionalcommits.org/).
   - Example: `feat(hr): add employee skills matrix` or `fix(finance): correct invoice total calculation`.
6. **Pull Requests:**
   - Submit a PR against `main`.
   - Ensure you link the relevant Jira ticket.
   - At least 1 code review approval is required before merging.

## Code Style Guide

- **React Components:** Use Server Components by default. Only add `'use client'` at the top of the file if you absolutely need interactivity (useState, useEffect, onClick).
- **Database Access:** All database queries must go through `Drizzle ORM`. Do not write raw SQL unless utilizing advanced Postgres functions (like full-text search) that Drizzle does not yet support.
- **Error Handling:** Catch errors gracefully and return standardized JSON responses `{ error: string }`. Use `sonner` toasts on the client to display the error to the user.

## Security Reminders

- Never commit `.env.local` or any secrets.
- Always validate user inputs on the server before inserting into the database.
- Do not log sensitive PII (Social Security Numbers, Salaries) in plain text to the Audit Logs.
