r# Phase 6 — Notifications & Reminders

**Duration:** 1–2 weeks  
**Dependencies:** Phase 1–5 (all modules generating events)  
**Tables:** 2 — `notifications`, `reminder_schedules`  
**API Routes:** 3  

---

## 6.1 Database Schema — Already Created in Phase 1

The `notifications` and `reminder_schedules` tables were defined in Phase 1 (`platform.ts`). Verify they exist:

```
- [ ] Verify `notifications` table exists:
      user_id, type, title, body, related_type/id, channel, is_read, sent_at

- [ ] Verify `reminder_schedules` table exists:
      name, type, target, advance_days, digest_time, is_active

- [ ] Add indexes if not already:
      notifications(user_id, is_read)
      notifications(user_id, created_at)
      reminder_schedules(type, is_active)
```

---

## 6.2 Backend — Notification Service

### Task 6.2.1 — Notification Service
**File: `src/server/services/notification.service.ts`**
```
- [ ] listNotifications(ctx, params) → paginated notifications (own only)
      - Filter: is_read, type, date range
      - Order: newest first
      - Include unread count

- [ ] markAsRead(ctx, notificationId) → void
      - Set is_read = true

- [ ] markAllAsRead(ctx) → void
      - Set is_read = true for all of current user's notifications

- [ ] createNotification(userId, input) → Notification
      - Create in-app notification record
      - Called internally by other services

- [ ] sendNotification(userId, input) → void
      - Create in-app notification
      - If user preferences include email: send via EmailProvider
      - Record dispatch in audit log

- [ ] Notification triggers (integrate into existing services):
      Events that generate notifications:
      
      A) Assignment notifications:
        - Employee assigned to project → notify employee
        - Task assigned → notify assignee
        - Leave request decision → notify employee
        - Expense approved/rejected → notify submitter

      B) Due date warnings:
        - Task due date approaching (1d, 3d, 7d) → notify assignee
        - Milestone due date approaching → notify Project Owner
        - Payment milestone due → notify Project Owner + Finance
        - Invoice overdue → notify Finance

      C) Status change notifications:
        - Deal stage changed → notify deal owner
        - Project status changed → notify Project Owner + team
        - Invoice issued → notify related parties
        - Payment received → notify Finance + Project Owner

      D) Approval requests:
        - Leave request submitted → notify manager
        - Expense submitted → notify Finance
```

### Task 6.2.2 — Email Provider Integration
**File: `src/server/lib/email-provider.ts`**
```
- [ ] EmailProvider interface:
      send({ to, subject, html, text? }) → { id }

- [ ] ResendProvider implements EmailProvider:
      - Uses Resend SDK
      - From: process.env.EMAIL_FROM
      - Error handling with retry (1 retry)

- [ ] Email templates (HTML):
      - due-date-reminder.html — upcoming/overdue dates digest
      - assignment-notification.html — you've been assigned
      - approval-request.html — action needed
      - status-update.html — deal/project/invoice status changed
      - password-reset.html — password reset link

- [ ] Template rendering with variables:
      renderTemplate(templateName, variables) → { html, text }
```

### Task 6.2.3 — Route Handlers
```
- [ ] GET   /api/notifications         → listNotifications (own)
- [ ] POST  /api/notifications/:id/read → markAsRead
- [ ] POST  /api/notifications/read-all → markAllAsRead
```

---

## 6.3 Backend — Scheduled Reminders

### Task 6.3.1 — Due-Date Reminder Job
**File: `src/scheduled/due-date-reminders.ts`**
```
- [ ] Scheduled: Daily at 08:00 UTC (configurable via reminder_schedules)
- [ ] Logic:
      1. Fetch active reminder_schedules
      2. For each schedule, query upcoming items:
         a. Tasks with due_date within advance_days (7, 3, 1 days)
         b. Milestones with due_date within advance_days
         c. Payment milestones with expected_date within advance_days
         d. Overdue items (due_date < today)
      3. Group by Project Owner
      4. For each owner:
         a. Create in-app notification per item
         b. Send digest email with all upcoming/overdue items
      5. Log all dispatched notifications in audit_logs

- [ ] Email digest format:
      Subject: "SENYX ERP — Due Date Summary for [date]"
      Body:
        ⚠️ OVERDUE
        - [Project X] Task "Fix login bug" — was due 2 days ago
        - [Project Y] Payment Milestone "Design Phase 20%" — was due 5 days ago
        
        📅 DUE SOON
        - [Project X] Milestone "Design Review" — due in 3 days
        - [Project Z] Task "API integration" — due tomorrow
        
        ✅ No overdue items (if none)
```

### Task 6.3.2 — Reminder Schedule Management
```
- [ ] Default reminder schedule seeded:
      name: "Project Due Dates"
      type: "project_due_dates"
      target: "project_owner"
      advance_days: [7, 3, 1]
      digest_time: '08:00'
      is_active: true

- [ ] Admin can configure via Settings:
      - Enable/disable reminders
      - Adjust advance warning days
      - Adjust send time
```

### Task 6.3.3 — Netlify Scheduled Function Setup
```
- [ ] Create Netlify scheduled function for daily reminders:

    // netlify/functions/daily-reminders.ts
    import { schedule } from '@netlify/functions';
    
    export const handler = schedule('0 8 * * *', async () => {
      // Import and run reminder logic
      await runDueDateReminders();
      return { statusCode: 200 };
    });

- [ ] Alternative: GitHub Actions cron (if Netlify scheduled functions not available):

    # .github/workflows/reminders.yml
    on:
      schedule:
        - cron: '0 8 * * *'
    jobs:
      reminders:
        runs-on: ubuntu-latest
        steps:
          - run: curl -X POST ${{ secrets.APP_URL }}/api/internal/run-reminders \
                   -H "Authorization: Bearer ${{ secrets.INTERNAL_API_KEY }}"
```

---

## 6.4 Frontend — Notification Center

### Task 6.4.1 — Notification Bell (Topbar)
**File: `src/components/layout/notification-bell.tsx`**
```
- [ ] Bell icon in topbar with unread count badge
- [ ] Click → opens notification dropdown/popover
- [ ] Dropdown shows recent notifications:
      - Icon per type (assignment, due date, approval, status change)
      - Title + time ago
      - Unread = highlighted background
      - Click notification → navigate to related entity
      - "Mark all as read" action
      - "View all" link → notifications page
- [ ] Poll for new notifications (every 30 seconds) or use real-time subscription
```

### Task 6.4.2 — Notifications Page
```
- [ ] app/(dashboard)/notifications/page.tsx
      - Full list of all notifications (paginated)
      - Filters: type, read/unread, date range
      - Click to navigate to related entity
      - Mark individual as read
      - Mark all as read
```

### Task 6.4.3 — Notification Hook
**File: `src/hooks/use-notifications.ts`**
```
- [ ] useNotifications() → { notifications, unreadCount, markAsRead, markAllAsRead, refresh }
      - Polls /api/notifications?is_read=false for count
      - Provides data for notification bell
```

---

## 6.5 Integration Points (Wire Into Existing Services)

### Task 6.5.1 — Add Notification Triggers to Existing Services
```
- [ ] deal.service.ts — changeStage():
      → notify deal owner on stage change

- [ ] deal.service.ts — closeDeal():
      → notify relevant parties on win/loss

- [ ] task.service.ts — create() and update():
      → notify assignee when assigned or reassigned

- [ ] milestone.service.ts — completeMilestone():
      → notify Project Owner and Finance

- [ ] finance.service.ts — issueInvoice():
      → notify relevant parties

- [ ] finance.service.ts — (overdue check):
      → notify Finance on overdue invoices

- [ ] leave.service.ts — createRequest():
      → notify manager/approver

- [ ] leave.service.ts — decideRequest():
      → notify employee of decision

- [ ] expense.service.ts — createExpense():
      → notify Finance for approval

- [ ] expense.service.ts — approveExpense():
      → notify submitter of decision

- [ ] project.service.ts — assign():
      → notify assigned employee
```

---

## 6.6 Verification Checklist — Phase 6

```
- [ ] In-app notifications created for all trigger events
- [ ] Notification bell shows unread count
- [ ] Notification dropdown displays recent notifications
- [ ] Click notification navigates to related entity
- [ ] Mark as read / mark all as read working
- [ ] Notifications page with full list and filters
- [ ] Email dispatch via Resend working
- [ ] Due-date reminder emails sent to Project Owners daily
- [ ] Reminder email includes overdue + upcoming items grouped by project
- [ ] Reminder schedule configurable (advance days, send time)
- [ ] Email templates rendering correctly (HTML + text fallback)
- [ ] Notification dispatch recorded in audit logs
- [ ] Scheduled function running on cron
- [ ] All notification triggers wired into existing services
- [ ] CI passing, deployed
```

---

*Phase 6 completion = Milestone M6 (Automated Ops). Proceed to Phase 7 (Analytics & Reports).*
