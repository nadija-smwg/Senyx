# 🚀 Senyx – Full-Stack ERP & Command Center

> A modern, enterprise-grade ERP platform built from the ground up with **Next.js 16**, **Supabase**, and **TypeScript** — featuring real-time data, beautiful UI, and a fully responsive experience.

---

## 📌 What is Senyx?

**Senyx** is a complete **Enterprise Resource Planning (ERP) web application** that gives growing businesses a single command center to manage their entire operation — from HR and finance to project delivery and CRM — all in one place.

This is a **full-stack, production-ready application** built entirely from scratch, deployed on **Vercel** with a **PostgreSQL** database hosted on **Supabase**.

---

## ✨ Key Features

### 🏢 Core Modules
- **📊 Dashboard** — Live KPIs, revenue vs. expense charts, recent activity feed, and a personalized time-aware greeting
- **📈 Analytics & Reports** — Custom data queries, visual charts, and exportable reports

### 👥 HR & People
- **Employee Management** — Full CRUD with skill tracking, performance reviews, and department management
- **Leave Management** — Leave requests, approval workflows, and balance tracking
- **Time Tracking** — Clock in/out system with per-project time logging

### 💼 CRM & Sales
- **Accounts & Contacts** — Company and contact management with activity logging
- **Deals Pipeline** — Kanban-style deal tracking with stage management and conversion tracking
- **Quotes** — Professional quote generation

### 📁 Project Management
- **Projects Dashboard** — Full project lifecycle management with milestones and risk tracking
- **Kanban Boards** — Drag-and-drop task management (powered by `@dnd-kit`)
- **Team Assignments** — Role-based project team management

### 💰 Finance
- **Invoices** — Full invoice lifecycle: Draft → Sent → Paid → Overdue
- **Expenses** — Expense submission and approval workflow
- **Payments & Subscriptions** — Payment tracking and recurring subscription management
- **Multi-Currency Support** — Real-time currency switching across the entire app

### 🔐 Security & Settings
- **Role-Based Access Control (RBAC)** — Custom roles with granular permission management
- **Audit Logs** — Full activity timeline, session management, and analytics
- **Two-Factor Authentication** — 2FA support for enhanced security

### 📱 UI/UX
- **Fully Responsive** — Works beautifully on desktop, tablet, and mobile
- **Premium Design** — Light theme with brand-colored gradient mesh headers, glassmorphism effects, and micro-animations
- **Custom Branding** — Custom logo and name with transparent asset processing

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Database** | PostgreSQL via Supabase |
| **ORM** | Drizzle ORM |
| **Auth** | Custom JWT + Supabase SSR |
| **UI Components** | shadcn/ui + Radix UI |
| **Styling** | Tailwind CSS v4 |
| **Charts** | Recharts |
| **Tables** | TanStack Table |
| **Drag & Drop** | @dnd-kit |
| **Email** | Resend |
| **Storage** | AWS S3 |
| **Deployment** | Vercel |
| **Forms** | React Hook Form + Zod |
| **PDF Generation** | pdfmake |

---

## 🏗️ Architecture Highlights

- **App Router Architecture** — Server Components for data fetching, Client Components for interactivity
- **API Routes** — 80+ RESTful API endpoints for all business logic
- **Database Migrations** — Schema managed with Drizzle Kit
- **Type Safety** — End-to-end TypeScript coverage from database schema to UI
- **Docker Support** — Full `docker-compose` setup for self-hosting

---

## 🔗 Links

- **GitHub:** [github.com/nadija-smwg/Senyx](https://github.com/nadija-smwg/Senyx)
- **Live Demo:** *(Coming soon — hosted on Vercel)*

---

## 💡 What I Learned

Building Senyx was an incredible journey in full-stack development at scale. Key takeaways:
- Designing complex relational database schemas (employees, projects, invoices, CRM entities all interconnected)
- Building a scalable RBAC permission system from scratch
- Managing application-wide state with React Context and Server Components working side by side
- Implementing real-world financial workflows (invoice lifecycles, expense approvals, payroll)
- Deploying and optimizing a production Next.js app on Vercel

---

*Built with ❤️ — Senyx is a showcase of what's possible with modern web technologies.*
