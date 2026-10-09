# ScheduledMail — Full Project Overview

---

## 1. What Is This Project?

**ScheduledMail** is a full-stack email scheduling application. Users compose emails, pick a date/time, and the system queues and sends them automatically at the scheduled time — no real mail server required (uses Ethereal, a fake SMTP for testing).

Built as a **company technical evaluation assignment** emphasizing production-quality code, clean architecture, reliability, and polished UI/UX.

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18 + TypeScript | UI with type safety |
| **Build Tool** | Vite 5 | Fast dev server + production bundling |
| **Styling** | Tailwind CSS 3 | Utility-first CSS framework |
| **Routing** | React Router v6 | Client-side page navigation |
| **Backend** | Node.js + Express 4 | REST API server |
| **Language** | TypeScript (strict mode) | End-to-end type safety |
| **Database** | SQLite via Prisma ORM | Persistent data storage |
| **Queue** | Redis + BullMQ 5 | Reliable delayed job processing |
| **Worker** | BullMQ Worker (separate process) | Background email sending |
| **Email** | Nodemailer + Ethereal SMTP | Fake email delivery with preview |
| **Validation** | Zod (backend) + custom (frontend) | Request + form validation |
| **Containerization** | Docker Compose | Redis service management |

---

## 3. Architecture

### High-Level Flow

```
┌─────────────────────┐
│                     │
│   React Frontend    │  Vite dev server → http://localhost:5173
│   (TypeScript +     │
│    Tailwind CSS)    │
│                     │
└─────────┬───────────┘
          │  HTTP REST (JSON)
          ▼
┌─────────────────────┐
│                     │
│   Express API       │  http://localhost:3001
│   (TypeScript)      │
│                     │
│   Routes            │
│     → Controllers   │
│       → Services    │
│         → Prisma    │
│                     │
└─────────┬───────────┘
          │  Prisma Client
          ▼
┌─────────────────────┐
│                     │
│   SQLite Database   │  Persistent file: backend/prisma/dev.db
│   (via Prisma ORM)  │
│                     │
│   Tables:           │
│   - ScheduledEmail  │
│   - EmailLog        │
│                     │
└─────────┬───────────┘
          │  BullMQ add job
          ▼
┌─────────────────────┐
│                     │
│   Redis + BullMQ    │  Job queue with delayed jobs
│                     │
│   Features:         │
│   - Delayed jobs    │
│   - Retries (3x)    │
│   - Exponential     │
│     backoff         │
│   - Job persistence │
│                     │
└─────────┬───────────┘
          │  Worker picks up job when due
          ▼
┌─────────────────────┐
│                     │
│   BullMQ Worker     │  Separate Node.js process
│   (independent)     │
│                     │
│   Responsibilities: │
│   - Process jobs    │
│   - Send emails     │
│   - Update DB       │
│   - Recovery on     │
│     restart         │
│                     │
└─────────┬───────────┘
          │  SMTP
          ▼
┌─────────────────────┐
│                     │
│   Ethereal Email    │  Fake SMTP service (testing only)
│                     │
│   - No real emails  │
│   - Preview URLs    │
│   - Console logs    │
│                     │
└─────────────────────┘
```

### Backend Architecture (Layered)

```
HTTP Request
    │
    ▼
Routes (emailRoutes.ts)
    │  URL patterns + HTTP methods
    ▼
Middleware (validate.ts)
    │  Zod schema validation
    ▼
Controllers (emailController.ts)
    │  Request/response handling
    ▼
Services (emailService.ts)
    │  Business logic + database access
    ▼
Prisma ORM (schema.prisma)
    │  Type-safe database queries
    ▼
SQLite Database
```

### Frontend Architecture

```
App.tsx (Router)
    │
    ├── Layout.tsx (Navigation shell)
    │
    ├── DashboardPage.tsx
    │     ├── StatsCards (summary counts)
    │     ├── StatusFilter (dropdown filter)
    │     ├── EmailTable (data table)
    │     │     ├── StatusBadge (color-coded status)
    │     │     ├── ConfirmDialog (cancel/delete confirmations)
    │     │     └── Pagination
    │     └── Toast notifications
    │
    ├── ScheduleEmailPage.tsx
    │     ├── FormField (reusable labeled input)
    │     ├── Client-side validation
    │     └── Loading/disabled state on submit
    │
    └── EmailDetailPage.tsx
          ├── StatusBadge
          ├── Email metadata display
          ├── Message content
          ├── Activity Log (with Ethereal preview links)
          └── Cancel/Delete actions
```

---

## 4. Database Schema

### ScheduledEmail Table

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Auto-generated unique ID |
| `recipient` | String | Email address |
| `subject` | String | Email subject line |
| `message` | String | Email body content |
| `scheduledAt` | DateTime | When to send |
| `status` | String | `pending` / `processing` / `sent` / `failed` / `cancelled` |
| `jobId` | String? | BullMQ job reference |
| `sentAt` | DateTime? | When it was actually sent |
| `failureReason` | String? | Error message if failed/cancelled |
| `retryCount` | Int | Number of retry attempts |
| `createdAt` | DateTime | Record creation time |
| `updatedAt` | DateTime | Last modification time |

**Indexes:** `status`, `scheduledAt`, `jobId`

### EmailLog Table

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Auto-generated unique ID |
| `scheduledEmailId` | String (FK) | Links to ScheduledEmail |
| `status` | String | Log event status |
| `message` | String? | Human-readable description |
| `createdAt` | DateTime | When this log entry was created |

**Relationship:** One ScheduledEmail → Many EmailLogs (cascade delete)

---

## 5. API Endpoints

| Method | Endpoint | Description | Request Body |
|---|---|---|---|
| `GET` | `/api/health` | Health check | — |
| `GET` | `/api/emails` | List emails (paginated) | Query: `page`, `pageSize`, `status` |
| `GET` | `/api/emails/:id` | Get email detail + activity logs | — |
| `POST` | `/api/emails` | Create scheduled email | `{ recipient, subject, message, scheduledAt }` |
| `PUT` | `/api/emails/:id` | Update scheduled email | `{ recipient?, subject?, message?, scheduledAt? }` |
| `PATCH` | `/api/emails/:id/cancel` | Cancel a pending email | — |
| `DELETE` | `/api/emails/:id` | Delete an email | — |
| `GET` | `/api/emails/stats` | Get status counts | — |

### Validation Rules (Zod)

**Create:**
- `recipient`: valid email, required
- `subject`: 1–200 characters, required
- `message`: 1–5000 characters, required
- `scheduledAt`: valid ISO datetime, must be in the future

**Update:** Same as create but all fields optional

---

## 6. Scheduling & Queue System

### How Scheduling Works

```
1. User submits form → Frontend POST /api/emails
2. Backend validates with Zod → stores in DB (status: "pending")
3. Backend adds BullMQ delayed job → delay = scheduledAt - now
4. Worker waits → job becomes available when delay expires
5. Worker picks up job → checks DB idempotency
6. Worker sends via Ethereal SMTP
7. Worker updates DB → status: "sent" or "failed"
8. On failure → BullMQ retries with exponential backoff (3 attempts)
```

### Job Configuration

```typescript
{
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 5000,    // 5s, 10s, 20s
  },
  removeOnComplete: { age: 86400, count: 100 },
  removeOnFail: { age: 604800, count: 50 },
}
```

### Idempotency

The worker checks the database status before processing:
- If email doesn't exist → skip
- If email status ≠ "pending" → skip (already sent/failed/cancelled)
- Only processes emails with status "pending"

---

## 7. Persistence & Restart Recovery

This is a **critical feature** — the system must survive crashes and restarts.

### What Survives a Restart

| Component | Survives? | How |
|---|---|---|
| Email data | Yes | SQLite file on disk |
| BullMQ delayed jobs | Yes* | Redis persistence + BullMQ internals |
| Email status | Yes | Stored in database |
| Activity logs | Yes | Stored in database |

*Requires Redis to be running (data persists in Redis memory/RDB)

### Recovery Flow on Worker Restart

```
Worker starts
    │
    ├── 1. Initialize email service (Ethereal SMTP)
    │
    ├── 2. Query DB for all emails with status "pending"
    │
    ├── 3. Split into overdue vs future:
    │     │
    │     ├── OVERDUE (scheduledAt <= now):
    │     │     → Send immediately via SMTP
    │     │     → Update DB: status = "sent"
    │     │     → Create email log entry
    │     │
    │     └── FUTURE (scheduledAt > now):
    │           → Re-add as delayed jobs to BullMQ
    │           → Wait for scheduled time
    │
    └── 4. Start listening for new jobs
```

### Verified Recovery Scenarios

| Scenario | Result |
|---|---|
| Worker restart with overdue email | Email sent immediately |
| Worker restart with future email | Job re-enqueued, sent on time |
| Worker restart with cancelled email | Correctly ignored |
| Worker restart with already-sent email | Correctly skipped |
| Redis restart + Worker restart | Jobs recovered from DB |
| Complete restart (all services) | Full recovery via DB + Redis |

---

## 8. Project File Structure

```
Avinash/
├── frontend/                        # React SPA
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── ConfirmDialog.tsx    # Modal confirmation dialogs
│   │   │   ├── EmptyState.tsx       # Empty + Error state components
│   │   │   ├── Layout.tsx           # App shell with navigation
│   │   │   ├── Loading.tsx          # Spinner, Skeleton, TableSkeleton
│   │   │   ├── StatusBadge.tsx      # Color-coded status pills
│   │   │   └── Toast.tsx            # Toast notification system
│   │   ├── hooks/
│   │   │   └── useApi.ts            # Generic data-fetching hook
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx    # Main email list + stats
│   │   │   ├── EmailDetailPage.tsx  # Single email view + logs
│   │   │   └── ScheduleEmailPage.tsx# Create new scheduled email
│   │   ├── services/
│   │   │   └── emailApi.ts          # Centralized API client
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript interfaces
│   │   ├── App.tsx                  # Router setup
│   │   ├── index.css                # Tailwind + custom component classes
│   │   ├── main.tsx                 # React root mount
│   │   └── vite-env.d.ts
│   ├── index.html
│   ├── tailwind.config.js           # Custom theme (colors, animations)
│   ├── postcss.config.js
│   ├── vite.config.ts               # Vite config + API proxy
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                         # Express API + Worker
│   ├── prisma/
│   │   ├── schema.prisma            # Database schema definition
│   │   └── dev.db                   # SQLite database file
│   ├── src/
│   │   ├── config/
│   │   │   ├── index.ts             # Environment config (dotenv)
│   │   │   └── database.ts          # Prisma client singleton
│   │   ├── controllers/
│   │   │   └── emailController.ts   # Request handlers
│   │   ├── services/
│   │   │   └── emailService.ts      # Business logic + DB operations
│   │   ├── routes/
│   │   │   └── emailRoutes.ts       # Express route definitions
│   │   ├── queues/
│   │   │   └── emailQueue.ts        # BullMQ queue setup
│   │   ├── workers/
│   │   │   └── email-worker.ts      # Background job processor
│   │   ├── email/
│   │   │   └── emailService.ts      # Nodemailer + Ethereal setup
│   │   ├── middleware/
│   │   │   ├── validate.ts          # Zod validation middleware
│   │   │   └── errorHandler.ts      # Centralized error handling
│   │   ├── types/
│   │   │   └── validation.ts        # Zod schemas + TypeScript types
│   │   └── index.ts                 # Server entry point
│   ├── .env                         # Environment variables
│   ├── tsconfig.json
│   └── package.json
│
├── shared/
│   └── types.ts                     # Shared TypeScript interfaces
│
├── docker-compose.yml               # Redis service
├── .env.example                     # Environment variable template
├── .gitignore
├── requirements.txt                 # Setup script
├── README.md
└── OPENCODE_PROJECT_CONTEXT.md      # Assignment requirements doc
```

---

## 9. Reusable UI Components

| Component | File | Purpose |
|---|---|---|
| `Layout` | `Layout.tsx` | App shell with sticky header + navigation |
| `StatusBadge` | `StatusBadge.tsx` | Color-coded pills for email status |
| `ConfirmDialog` | `ConfirmDialog.tsx` | Modal for cancel/delete confirmations |
| `EmptyState` | `EmptyState.tsx` | Shown when no data exists |
| `ErrorState` | `EmptyState.tsx` | Error display with retry button |
| `Spinner` | `Loading.tsx` | Animated loading spinner |
| `LoadingPage` | `Loading.tsx` | Full-page loading state |
| `Skeleton` | `Loading.tsx` | Shimmer placeholder |
| `TableSkeleton` | `Loading.tsx` | Table row skeleton loader |
| `ToastContainer` | `Toast.tsx` | Auto-dismissing notification system |
| `FormField` | `ScheduleEmailPage.tsx` | Reusable labeled form field with error |

---

## 10. CSS Component Classes (Tailwind)

Defined in `index.css` for consistent styling:

| Class | Purpose |
|---|---|
| `.btn-primary` | Cyan primary action button |
| `.btn-secondary` | Gray outlined button |
| `.btn-danger` | Red destructive action button |
| `.btn-ghost` | Transparent hover button |
| `.input-field` | Styled text input |
| `.label` | Form field label |
| `.card` | White bordered container |
| `.badge-pending` | Amber status pill |
| `.badge-processing` | Blue status pill |
| `.badge-sent` | Green status pill |
| `.badge-failed` | Red status pill |
| `.badge-cancelled` | Gray status pill |

---

## 11. Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `file:./dev.db` | SQLite database path |
| `REDIS_HOST` | `127.0.0.1` | Redis server host |
| `REDIS_PORT` | `6379` | Redis server port |
| `ETHEREAL_HOST` | `""` | SMTP host (auto-generated if empty) |
| `ETHEREAL_PORT` | `587` | SMTP port |
| `ETHEREAL_USER` | `""` | SMTP username (auto-generated if empty) |
| `ETHEREAL_PASS` | `0` | SMTP password (auto-generated if empty) |
| `PORT` | `3001` | Backend server port |
| `NODE_ENV` | `development` | Environment mode |

---

## 12. Key Design Decisions

### Why SQLite?
- Zero configuration required
- File-based, no separate server process
- Perfect for development and demonstration
- Easy to swap to PostgreSQL in production (change Prisma provider)

### Why a Separate Worker Process?
- Independent scaling (can run multiple workers)
- Worker crashes don't affect the API server
- Clear separation of concerns
- Easy restart/recovery without downtime

### Why BullMQ over simple setTimeout?
- Jobs persist across process restarts
- Built-in retry logic with backoff
- Job deduplication via jobId
- Rate limiting support
- Job lifecycle management
- Production-grade reliability

### Why Ethereal Email?
- No risk of sending real emails during development
- Every email gets a preview URL for verification
- Auto-generates test accounts on startup
- Exactly matches the assignment requirement

### Why Tailwind CSS?
- Rapid UI development with utility classes
- Consistent design system via config
- No CSS-in-JS runtime overhead
- Small production bundle with purging

---

## 13. Trade-offs & Simplifications

| Decision | Trade-off |
|---|---|
| SQLite over PostgreSQL | Simpler setup, but no concurrent write support |
| No authentication | Assignment doesn't require it; single-user demo |
| Ethereal over real SMTP | No real delivery, but safe for testing |
| No WebSocket/real-time updates | Simpler architecture; status updates on page refresh |
| No test suite | Time constraint; TypeScript checks + manual testing |
| Single Redis instance | No clustering, but sufficient for the scope |

---

## 14. How to Run

```bash
# 1. Install requirements
#    (see requirements.txt or run the setup script)

# 2. Start Redis
docker compose up -d

# 3. Start Backend (Terminal 1)
cd backend
npm run dev

# 4. Start Worker (Terminal 2)
cd backend
npm run worker

# 5. Start Frontend (Terminal 3)
cd frontend
npm run dev

# 6. Open browser
#    http://localhost:5173
```

---

## 15. Email Status Lifecycle

```
                    ┌──────────┐
                    │ pending  │ ← Initial state after creation
                    └────┬─────┘
                         │
              ┌──────────┼──────────┐
              │          │          │
              ▼          ▼          ▼
         ┌────────┐ ┌─────────┐ ┌───────────┐
         │processing│ │cancelled│ │  (deleted) │
         └────┬───┘ └─────────┘ └───────────┘
              │
         ┌────┴────┐
         │         │
         ▼         ▼
    ┌──────┐  ┌────────┐
    │ sent │  │ failed │
    └──────┘  └────┬───┘
                   │ (BullMQ retries)
                   ▼
              ┌────────┐
              │ sent ✓ │
              └────────┘
```

| Status | Description |
|---|---|
| `pending` | Scheduled, waiting for time to arrive |
| `processing` | Worker is currently sending the email |
| `sent` | Successfully delivered via Ethereal |
| `failed` | Delivery failed (after retries exhausted) |
| `cancelled` | User cancelled before it was sent |

---

## 16. Ethereal Email Preview

After the worker sends an email, the console logs a preview URL:

```
[Email] Preview: https://ethereal.email/message/apqGcwlT7djr...
```

Click this URL to see the full rendered email in the Ethereal dashboard — no real email was sent to anyone. The preview URL is also stored in the `EmailLog` and displayed as a clickable link in the email detail page.

---

*Built for the Company Technical Evaluation Assignment*
