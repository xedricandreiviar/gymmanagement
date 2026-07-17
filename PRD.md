# Gym Management Service — Product Requirements Document

## 1. Overview

A web-based gym management system built with **Next.js** (App Router) and **Supabase** (Postgres, Auth, Storage). The system handles member registration, membership plans, session scheduling, attendance tracking, payments, trainer management, and administrative dashboards.

---

## 2. Goals

- Streamline day-to-day gym operations (sign-ups, check-ins, payments).
- Provide members with a self-service portal for bookings and account management.
- Give administrators real-time visibility into revenue, attendance, and capacity.
- Support multiple membership tiers: daily, monthly, and yearly.

---

## 3. User Roles

| Role | Description |
|------|-------------|
| **Admin** | Full access — manages members, trainers, plans, finances, and settings. |
| **Trainer** | Views assigned sessions, marks attendance, manages personal schedule. |
| **Member** | Views/manages own membership, books sessions, views payment history. |

---

## 4. Core Features

### 4.1 Authentication & Authorization
- Email/password sign-up and login via Supabase Auth.
- Role-based access control (Admin, Trainer, Member).
- Protected routes and API endpoints per role.

### 4.2 Membership Management
- **Plans**: Daily Pass, Monthly, Yearly (configurable pricing).
- **Member Profiles**: Personal info, emergency contact, health notes.
- **Membership Status**: Active, Expired, Frozen, Cancelled.
- Auto-expiry based on plan duration.
- Renewal and upgrade flows.

### 4.3 Session & Class Scheduling
- Admins/Trainers create group classes (e.g., Yoga, HIIT, Spin).
- Sessions have: title, trainer, date/time, duration, capacity.
- Members can book/cancel spots (with capacity enforcement).
- Recurring schedule support (weekly templates).

### 4.4 Attendance & Check-In
- QR code or manual check-in at the gym entrance.
- Daily attendance log per member.
- Session-specific attendance for group classes.
- Admin dashboard shows real-time occupancy.

### 4.5 Payments & Billing
- Record payments against memberships (manual entry by admin for now).
- Payment status: Paid, Pending, Overdue.
- Payment history per member.
- Revenue summary for admin (daily, weekly, monthly totals).

### 4.6 Trainer Management
- Trainer profiles: specialization, certifications, schedule.
- Assign trainers to sessions/classes.
- Trainer availability calendar.

### 4.7 Equipment & Facility (Optional / Phase 2)
- Track gym equipment inventory.
- Maintenance schedules and status.

### 4.8 Notifications (Optional / Phase 2)
- Email reminders for expiring memberships.
- Session booking confirmations.
- Payment due alerts.

---

## 5. Database Schema (High-Level)

### Tables

| Table | Key Fields |
|-------|-----------|
| `profiles` | id, user_id (FK auth.users), full_name, phone, role, avatar_url, emergency_contact, health_notes |
| `membership_plans` | id, name, type (daily/monthly/yearly), price, duration_days, description, is_active |
| `memberships` | id, member_id (FK profiles), plan_id (FK membership_plans), start_date, end_date, status |
| `sessions` | id, title, trainer_id (FK profiles), date, start_time, end_time, capacity, description, recurring |
| `session_bookings` | id, session_id (FK sessions), member_id (FK profiles), status, booked_at |
| `attendance` | id, member_id (FK profiles), check_in_time, check_out_time, session_id (nullable) |
| `payments` | id, member_id (FK profiles), membership_id (FK memberships), amount, method, status, paid_at |
| `trainers` | id, profile_id (FK profiles), specialization, certifications, bio |

---

## 6. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14+ (App Router), React, TypeScript, Tailwind CSS |
| Backend/API | Next.js Route Handlers + Supabase client |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage (avatars, documents) |
| Deployment | Vercel (recommended) |

---

## 7. Pages / Routes

```
/                       → Landing / Marketing page
/login                  → Login
/register               → Sign-up (member by default)

/dashboard              → Role-based dashboard redirect
/dashboard/admin        → Admin overview (stats, revenue, members)
/dashboard/trainer      → Trainer schedule & sessions
/dashboard/member       → Member home (membership status, upcoming sessions)

/members                → Admin: member list, search, filter
/members/[id]           → Member detail / edit

/memberships            → Admin: manage plans
/memberships/new        → Create/edit plan

/sessions               → Session/class schedule (calendar view)
/sessions/[id]          → Session detail, booking

/attendance             → Admin: attendance log
/payments               → Admin: payment records & revenue
/trainers               → Admin: trainer list
/trainers/[id]          → Trainer profile

/profile                → Self-service profile edit
/profile/payments       → Member: own payment history
```

---

## 8. Non-Functional Requirements

- **Performance**: Pages load in under 2s; use server components where possible.
- **Security**: Row-Level Security (RLS) policies on all tables; no client-side admin access.
- **Responsiveness**: Mobile-first, works on tablets and desktops.
- **Accessibility**: WCAG 2.1 AA baseline.

---

## 9. MVP Scope (Phase 1)

1. Auth (sign-up, login, role assignment).
2. Membership plans CRUD (admin).
3. Member registration & membership purchase flow.
4. Session scheduling & booking.
5. Manual check-in / attendance log.
6. Payment recording & history.
7. Admin dashboard with key metrics.

---

## 10. Success Metrics

- Members can self-register and purchase a plan in under 2 minutes.
- Admin can see total active members, revenue this month, and today's attendance from the dashboard.
- Zero unauthorized data access (validated via RLS tests).

---

## 11. Open Questions

- Should we integrate an online payment gateway (Stripe/PayMongo) in Phase 1 or keep it manual?
- Do we need multi-branch/gym support?
- Should members be able to rate/review trainers?
