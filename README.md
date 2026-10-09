# ScheduledMail

A production-quality email scheduling application built with TypeScript, Express, React, Redis, BullMQ, and Ethereal Email.

## Overview

ScheduledMail allows users to create and manage scheduled emails. Users provide a recipient, subject, message content, and a scheduled date/time. The system persists this data in a database, uses Redis + BullMQ for reliable delayed job processing, and sends emails via Ethereal Email when the scheduled time arrives.

## Features

- **Schedule emails** with recipient, subject, message, and date/time
- **Dashboard** with email list, status filtering, and pagination
- **Email detail view** with activity log
- **Real-time status tracking** (pending, processing, sent, failed)
- **Cancel and delete** scheduled emails
- **Toast notifications** for success/error feedback
- **Loading, empty, and error states** throughout
- **Responsive design** across desktop, tablet, and mobile
- **Accessible** forms with proper labels and error associations

## Architecture

```text
User
  |
  v
React Frontend (Vite + TypeScript + Tailwind)
  |
  v
Express REST API
  |
  v
Prisma ORM (SQLite)
  |
  v
Redis + BullMQ (Job Queue)
  |
  v
BullMQ Worker (Separate Process)
  |
  v
Ethereal Email (SMTP)
```

## Tech Stack

| Layer        | Technology                                    |
|-------------|-----------------------------------------------|
| Frontend    | React 18, TypeScript, Vite, Tailwind CSS     |
| Backend     | Node.js, Express, TypeScript                 |
| Database    | SQLite via Prisma ORM                        |
| Queue       | Redis + BullMQ                               |
| Worker      | BullMQ Worker (independent process)          |
| Email       | Nodemailer + Ethereal Email                  |
| Validation  | Zod (backend), custom (frontend)             |

## Project Structure

```text
scheduled-mail/
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API communication
│   │   ├── types/          # TypeScript types
│   │   └── ...
│   └── ...
│
├── backend/                # Express backend
│   ├── src/
│   │   ├── config/         # Database, app config
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic
│   │   ├── routes/         # API routes
│   │   ├── queues/         # BullMQ queue setup
│   │   ├── workers/        # Background job processor
│   │   ├── email/          # Email service
│   │   ├── middleware/     # Validation, error handling
│   │   ├── types/          # TypeScript types, validation
│   │   └── index.ts        # Server entry point
│   └── prisma/
│       └── schema.prisma   # Database schema
│
├── shared/                 # Shared types (optional)
├── docker-compose.yml      # Redis service
├── .env.example
├── .gitignore
└── README.md
```

## Prerequisites

- **Node.js** 18+ (recommended: 20 LTS)
- **Redis** 6+ (can use Docker)
- **npm** or **yarn**

## Environment Variables

Create a `.env.example` at the project root:

```env
# Database
DATABASE_URL="file:./dev.db"

# Redis
REDIS_HOST="127.0.0.1"
REDIS_PORT="6379"

# Ethereal Email (auto-generated at runtime if left empty)
ETHEREAL_HOST=""
ETHEREAL_PORT=""
ETHEREAL_USER=""
ETHEREAL_PASS=""

# Server
PORT="3001"
NODE_ENV="development"

# Frontend
VITE_API_URL="http://localhost:3001"
```

## Installation

### 1. Clone and install dependencies

```bash
git clone <repository-url>
cd scheduled-mail

# Backend
cd backend
cp ../.env.example .env
npm install
npx prisma generate
npx prisma db push

# Frontend
cd ../frontend
npm install
```

### 2. Start Redis

**Option A: Docker (recommended)**
```bash
docker compose up -d
```

**Option B: Local Redis**
```bash
redis-server
```

## Running the Application

You need to run **4 processes** in separate terminals:

```bash
# Terminal 1: Backend API
cd backend
npm run dev

# Terminal 2: BullMQ Worker
cd backend
npm run worker

# Terminal 3: Frontend
cd frontend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api

## Ethereal Email Setup

Ethereal Email is a fake SMTP service for testing. No real emails are sent.

**Automatic (recommended):**
Leave `ETHEREAL_*` variables empty. The app will create a test account on startup and log the credentials and preview URLs to the console.

**Manual:**
1. Go to https://ethereal.email
2. Click "Create Ethereal Account"
3. Copy the SMTP credentials into your `.env` file
4. After sending an email, check the Ethereal dashboard or use the preview URL logged in the console

## Scheduling Architecture

1. User creates a scheduled email via the frontend form
2. Backend validates the input and stores the email in the database (status: `pending`)
3. Backend adds a **delayed job** to the BullMQ queue with the appropriate delay
4. The BullMQ worker waits for the job to become available
5. When the scheduled time arrives, the worker picks up the job
6. Worker sends the email via Ethereal SMTP
7. Worker updates the email status in the database (`sent` or `failed`)
8. On failure, BullMQ retries with exponential backoff (up to 3 attempts)

## Persistence on Restart

- **Database**: All email data is persisted in SQLite. Restarting the backend does not lose any data.
- **BullMQ/Redis**: Delayed jobs survive Redis restarts (if Redis persistence is configured) and BullMQ automatically recovers pending jobs on worker restart.
- **Recovery flow**: On restart, the worker re-connects to Redis and resumes processing any pending/failed jobs from the queue. The database retains all email records and their status.

## API Overview

| Method | Endpoint                | Description                  |
|--------|------------------------|------------------------------|
| GET    | /api/health            | Health check                 |
| GET    | /api/emails            | List emails (paginated)      |
| GET    | /api/emails/:id        | Get email detail + logs      |
| POST   | /api/emails            | Create scheduled email       |
| PUT    | /api/emails/:id        | Update scheduled email       |
| PATCH  | /api/emails/:id/cancel | Cancel a pending email       |
| DELETE | /api/emails/:id        | Delete an email              |
| GET    | /api/emails/stats      | Get status statistics        |

### Query Parameters (GET /api/emails)

- `page` (number, default: 1)
- `pageSize` (number, default: 10)
- `status` (string: pending | processing | sent | failed)

## Testing

```bash
# Backend type checking
cd backend
npx tsc --noEmit

# Frontend type checking
cd frontend
npx tsc --noEmit

# Frontend production build
cd frontend
npm run build
```

## Build

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

## Design Decisions

- **SQLite**: Used for simplicity and zero-configuration. In production, switch to PostgreSQL by changing `provider` in `prisma/schema.prisma`.
- **Separate Worker Process**: The BullMQ worker runs independently, making it easy to scale and restart without affecting the API server.
- **Ethereal Email**: Provides a safe way to test email delivery without sending real emails.
- **Zod Validation**: Backend validation with Zod ensures type-safe request validation with clear error messages.
- **Tailwind CSS**: Utility-first CSS for rapid, consistent UI development.

## Trade-offs

- **SQLite vs PostgreSQL**: SQLite is used for simplicity. A production system would use PostgreSQL.
- **No authentication**: Authentication is not part of the current assignment requirements. The app is designed for single-user demonstration.
- **No real email provider**: Ethereal is used as specified in the assignment. Swapping to a real SMTP provider requires changing the email configuration.
