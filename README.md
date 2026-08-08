# SENYX ERP

Senyx ERP is a modern, enterprise-grade Resource Planning platform built to seamlessly manage Human Resources, Sales, Customer Relationships, Projects, and Financials in a unified dashboard.

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (via Supabase)
- **ORM:** Drizzle ORM
- **Styling:** Tailwind CSS & shadcn/ui
- **Storage:** Cloudflare R2
- **Email:** Resend
- **State/Data:** React Server Components (RSC) + Server Actions

## Add Features
- **Dashboard:** Real-time KPIs and activity monitoring.
- **HR & People:** Employee directory, skills matrix, leave requests, and payroll tracking.
- **CRM & Sales:** Account management, interactive deal pipelines, and automated quotes.
- **Projects:** Kanban boards, task management, time tracking, and milestone billing.
- **Finance:** Invoices, expense receipts with R2 storage, payments, and subscriptions.
- **Admin:** Role-based access control, comprehensive audit logs, and a dynamic Markdown Help Center.

## Local Setup

### 1. Prerequisites
- Node.js (v20 or higher)
- A Supabase project (for PostgreSQL)
- Cloudflare R2 bucket (optional for local dev, needed for document uploads)

### 2. Environment Variables
Copy the example environment file and fill in your credentials:
\`\`\`bash
cp .env.example .env.local
\`\`\`

You will need:
- `DATABASE_URL`: Supabase connection string
- `JWT_SECRET`: For authentication
- `R2_ACCESS_KEY_ID` & `R2_SECRET_ACCESS_KEY`: For Cloudflare R2 uploads

### 3. Installation
Install dependencies using npm:
\`\`\`bash
npm install
\`\`\`

### 4. Database Setup
Push the Drizzle schema to your Supabase database:
\`\`\`bash
npx drizzle-kit push
\`\`\`

Seed the database with initial roles, admin user, and help content:
\`\`\`bash
npx tsx src/server/db/seed/roles.ts
npx tsx src/server/db/seed/help-content.ts
\`\`\`

### 5. Start Development Server
\`\`\`bash
npm run dev
\`\`\`
The application will be available at `http://localhost:3000`. Default admin login is usually setup during the seed script (`admin@senyx.io` / `password123`).

## Available Scripts
- `npm run dev` - Starts the development server.
- `npm run build` - Builds the application for production.
- `npm run start` - Runs the production server.
- `npm run db:push` - Syncs your Drizzle schema with the database.
- `npm run db:studio` - Opens Drizzle Studio to view database contents locally.

## Deployment
Senyx ERP is designed to be deployed effortlessly on Vercel or Netlify.
1. Connect your GitHub repository to your Vercel/Netlify account.
2. Add all environment variables from `.env.local` to the project settings.
3. Deploy!



## License
Proprietary software. All rights reserved by SENYX Corporation.
