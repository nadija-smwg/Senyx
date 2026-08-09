# SENYX ERP

> **A modern, enterprise-grade ERP platform for managing people, customers, projects, sales, and finances — all from one unified workspace.**

SENYX ERP is a full-stack **Enterprise Resource Planning (ERP)** platform designed to centralize and streamline core business operations. It provides a modern, scalable dashboard for managing **Human Resources, CRM, Sales, Projects, Finance, and Administration**.

---

## ✨ Features

### 📊 Dashboard

* Real-time business KPIs
* Activity monitoring
* Business performance overview
* Centralized operational insights

### 👥 HR & People

* Employee directory
* Employee profiles and skills matrix
* Leave request management
* Payroll tracking
* People and organizational management

### 🤝 CRM & Sales

* Customer and account management
* Interactive sales pipelines
* Deal tracking
* Automated quotation management
* Customer relationship management

### 📋 Project Management

* Kanban project boards
* Task management
* Project milestones
* Time tracking
* Milestone-based billing

### 💰 Finance

* Invoice management
* Expense tracking
* Receipt/document storage
* Payment management
* Subscription management

### 🔐 Administration

* Role-Based Access Control (RBAC)
* Authentication and authorization
* Comprehensive audit logs
* Administrative management
* Dynamic Markdown-based Help Center

---

## 🛠️ Tech Stack

| Technology                  | Purpose                                 |
| --------------------------- | --------------------------------------- |
| **Next.js 15**              | Full-stack React framework              |
| **TypeScript**              | Type-safe application development       |
| **PostgreSQL**              | Relational database                     |
| **Supabase**                | PostgreSQL hosting & backend services   |
| **Drizzle ORM**             | Database schema & queries               |
| **Tailwind CSS**            | Utility-first styling                   |
| **shadcn/ui**               | Reusable UI components                  |
| **Cloudflare R2**           | Document and file storage               |
| **Resend**                  | Transactional email                     |
| **React Server Components** | Server-side rendering and data fetching |
| **Server Actions**          | Secure server-side mutations            |

---

## 🏗️ Architecture

SENYX ERP follows a modern full-stack architecture built around Next.js:

```text
┌─────────────────────────────────────────────┐
│                  SENYX ERP                  │
├─────────────────────────────────────────────┤
│              Next.js 15 / App Router        │
├─────────────────────────────────────────────┤
│     React Server Components / Server Actions│
├─────────────────────────────────────────────┤
│              Drizzle ORM                    │
├─────────────────────────────────────────────┤
│        PostgreSQL / Supabase                │
├─────────────────────────────────────────────┤
│                                             │
│ Cloudflare R2          Resend               │
│ File Storage           Email Service       │
└─────────────────────────────────────────────┘
```

---

# 🚀 Getting Started

## Prerequisites

Before running SENYX ERP locally, make sure you have:

* **Node.js 20+**
* **npm**
* A **Supabase project**
* A PostgreSQL connection string
* A **Cloudflare R2 bucket** *(required for document uploads)*
* A **Resend API key** *(if email functionality is enabled)*

---

## 1. Clone the Repository

```bash
git clone <your-repository-url>
cd senyx-erp
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Environment Variables

Create your local environment file:

```bash
cp .env.example .env.local
```

Then configure the required environment variables:

```env
DATABASE_URL=your_supabase_connection_string

JWT_SECRET=your_jwt_secret

R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key

RESEND_API_KEY=your_resend_api_key
```

> **Important:** Never commit `.env.local` or production credentials to Git.

---

# 🗄️ Database Setup

SENYX ERP uses **Drizzle ORM** with PostgreSQL.

### Push the Database Schema

```bash
npx drizzle-kit push
```

Or, if the project provides the database script:

```bash
npm run db:push
```

### Seed Initial Data

Run the seed scripts:

```bash
npx tsx src/server/db/seed/roles.ts
```

```bash
npx tsx src/server/db/seed/help-content.ts
```

These scripts initialize the required roles, administrative data, and Help Center content.

---

# 💻 Development

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

The application should now be available locally.

> **Development Admin Account**
>
> If the seed scripts create a default administrator, use the credentials defined by the seed configuration. Avoid documenting real production credentials in this README.

---

# 📜 Available Scripts

| Command             | Description                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start the development server         |
| `npm run build`     | Build the application for production |
| `npm run start`     | Start the production server          |
| `npm run db:push`   | Push Drizzle schema to PostgreSQL    |
| `npm run db:studio` | Open Drizzle Studio                  |

---

# 📁 Project Structure

A typical SENYX ERP structure:

```text
senyx-erp/
│
├── src/
│   ├── app/                 # Next.js App Router
│   ├── components/          # Reusable UI components
│   ├── server/
│   │   └── db/
│   │       ├── schema/      # Drizzle database schemas
│   │       └── seed/        # Database seed scripts
│   └── lib/                 # Shared utilities
│
├── public/                  # Static assets
│
├── drizzle.config.ts        # Drizzle configuration
├── next.config.ts           # Next.js configuration
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

---

# 🔐 Security

SENYX ERP is designed with security and enterprise access control in mind.

Key security features include:

* Role-Based Access Control (RBAC)
* Authentication and authorization
* Protected server actions
* Database-level access controls
* Audit logging
* Secure environment variables
* Private object storage through Cloudflare R2

> Never expose database credentials, JWT secrets, API keys, or storage credentials in source control.

---

# ☁️ Deployment

SENYX ERP can be deployed using platforms such as **Vercel** or **Netlify**.

### Deployment Steps

1. Push the project to GitHub.
2. Connect the repository to your hosting provider.
3. Configure all required environment variables.
4. Configure the production PostgreSQL/Supabase database.
5. Configure Cloudflare R2.
6. Configure Resend.
7. Run the production build.
8. Deploy.

### Production Build

```bash
npm run build
```

### Start Production Server

```bash
npm run start
```

---

# 🔄 Development Workflow

Recommended Git workflow:

```bash
git checkout -b feature/your-feature

# Make changes

git add .

git commit -m "feat: add your feature"

git push origin feature/your-feature
```

Then create a Pull Request for review.

---

# 🗺️ Roadmap

Future improvements may include:

* [ ] Advanced analytics and reporting
* [ ] AI-powered business insights
* [ ] Advanced payroll automation
* [ ] Inventory management
* [ ] Procurement management
* [ ] Advanced notification system
* [ ] Mobile application
* [ ] Multi-organization support
* [ ] Advanced workflow automation
* [ ] Expanded audit and compliance tools

---

# 📄 License

**Proprietary Software**

Copyright © 2026 **SENYX Corporation**.

All rights reserved.

This software and its source code are proprietary and may not be copied, modified, distributed, or used without explicit authorization from SENYX Corporation.
