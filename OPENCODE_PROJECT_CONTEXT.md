# OpenCode Project Context — Company Technical Assignment

> **Purpose:** This file is the context/source-of-truth document to give to OpenCode before asking it to build the project.
>
> **Important:** This document contains the requirements that are currently known from the assignment material and the project discussion. Do **not invent business requirements that are not stated here**. Where a functional requirement is not explicitly known, inspect any additional material available in the workspace before deciding on implementation.

---

## 1. Project Intent

This is a **company technical evaluation / hiring assignment**.

The goal is not to produce a basic student demo. The project should look like a small, real-world production application built by a professional engineering team.

The reviewer may:

- clone the repository from scratch
- run the application
- inspect the source code
- inspect the frontend architecture
- inspect TypeScript usage
- inspect the backend architecture
- test API behavior
- test scheduling/background processing
- test Redis/BullMQ behavior
- restart services
- verify persistence
- inspect email functionality
- review the README
- ask the candidate to explain implementation decisions and code

Therefore, prioritize:

**Correctness + clean architecture + reliability + maintainability + polished UI/UX + excellent documentation.**

Do not optimize for "looks like an assignment."

Optimize for:

> **"Looks like a real company engineering team built it."**

---

# 2. Known Technical Requirements

The assignment explicitly references the following backend infrastructure:

- Node.js / Express backend
- Database
- Redis
- BullMQ
- BullMQ worker
- Scheduling
- Ethereal Email

The system therefore needs a clear architecture around persistent application state and asynchronous/scheduled processing.

A high-level conceptual flow is:

```text
User
  ↓
Frontend
  ↓
Express REST API
  ↓
Database
  ↓
Redis / BullMQ
  ↓
BullMQ Worker
  ↓
Scheduled/background processing
  ↓
Ethereal Email
```

The exact domain/business entities and user-facing functionality must come from the actual assignment requirements. Do not fabricate them.

---

# 3. Backend Expectations

Build a clean Express backend with clear separation of concerns.

Prefer an architecture similar to:

```text
Routes
  ↓
Controllers
  ↓
Services
  ↓
Repositories / Data Access
  ↓
Database
```

Additional infrastructure should be separated:

```text
queues/
workers/
email/
config/
middleware/
utils/
types/
```

Avoid putting all business logic inside route handlers.

### Backend quality requirements

Implement:

- proper request validation
- meaningful HTTP status codes
- centralized error handling
- consistent API responses
- typed request/response models where appropriate
- configuration through environment variables
- safe error messages
- useful server-side logging
- graceful shutdown where appropriate
- clean dependency boundaries

Do not expose secrets.

Do not hardcode credentials.

---

# 4. Database Requirements

Persistent application state must live in a real database rather than only in process memory.

Design the schema based on the actual assignment requirements.

Consider:

- relationships
- constraints
- indexes
- timestamps
- status fields
- unique constraints
- data integrity
- migrations

The database must remain the source of truth for persistent application state.

---

# 5. Redis + BullMQ Requirements

Redis and BullMQ are explicitly part of the assignment.

Use them for reliable background/scheduled processing.

Separate:

- queue configuration
- job creation
- worker processing
- job lifecycle/status
- retry handling
- failure handling

Avoid fake scheduling based primarily on:

```text
setTimeout()
setInterval()
```

The scheduling mechanism must be designed so that important scheduled state is not lost merely because the backend or worker restarts.

Consider:

- delayed jobs
- scheduled jobs
- retries
- exponential/fixed backoff where appropriate
- failed jobs
- duplicate jobs
- idempotency
- worker restart
- graceful shutdown
- recovery after restart

Do not over-engineer this into microservices. Keep it simple and reliable.

---

# 6. Persistence After Restart

This is an explicit requirement.

The application must handle restart scenarios correctly.

The intended behavior is conceptually:

```text
Application running
       ↓
User creates/schedules something
       ↓
Persistent state stored in database
       ↓
Background job scheduled through BullMQ/Redis
       ↓
Backend/worker restarts
       ↓
Persistent state remains available
       ↓
Queue/worker resumes correctly
       ↓
Scheduled processing continues
```

Actually test this.

Do not claim restart persistence works unless it has been verified.

Document the restart/recovery architecture in the README.

---

# 7. Ethereal Email

Ethereal Email is explicitly required for email functionality/testing.

Create a clean email service abstraction.

For example:

```text
Worker
  ↓
Email Service
  ↓
Ethereal SMTP
```

Email configuration must be environment-based.

Provide:

```text
.env.example
```

with placeholders only.

Never commit:

- passwords
- API keys
- SMTP credentials
- private tokens
- real secrets

The README must explain how to configure Ethereal Email and how to inspect test emails.

---

# 8. Frontend Requirements

The frontend must use TypeScript properly and should be built as a professional SaaS-style application.

The assignment explicitly expects:

### Clean folder structure

Use logical separation such as:

```text
src/
├── components/
├── pages/
├── layouts/
├── hooks/
├── services/
├── types/
├── utils/
├── lib/
└── ...
```

Adapt the structure to the actual application instead of creating unnecessary folders.

Avoid:

- giant components
- giant files
- random utility dumping grounds
- duplicated logic
- tightly coupled modules
- unnecessary abstraction

---

# 9. Reusable UI Components

The assignment explicitly expects reusable UI components, including things such as:

- buttons
- inputs
- tables
- modals

Build a consistent component system where appropriate.

Potential reusable components include:

```text
Button
Input
Select
Textarea
FormField
Modal / Dialog
Table
Badge
Card
Toast
Spinner
Skeleton
EmptyState
ErrorState
PageHeader
ConfirmDialog
```

Do not duplicate the same UI pattern across multiple pages.

---

# 10. DRY Code

Follow the **Don't Repeat Yourself** principle.

Avoid:

- duplicated API logic
- duplicated validation
- duplicated formatting
- duplicated UI patterns
- repeated business logic
- repeated error handling

For example, API communication should be centralized into appropriate service modules instead of scattering raw fetch/HTTP logic throughout components.

Do not create abstractions merely for the sake of abstraction.

---

# 11. TypeScript Requirements

The assignment specifically expects:

> Types/interfaces for API responses and props.

Use strong TypeScript throughout.

Create types/interfaces for:

- domain entities
- API request payloads
- API responses
- API errors
- component props
- form state
- job/scheduling state
- status values
- shared contracts

Avoid using:

```typescript
any
```

as a shortcut.

Avoid excessive type assertions.

Where frontend and backend share stable contracts, consider shared types if this improves maintainability.

---

# 12. UI/UX Standard

The UI/UX is very important.

The application should feel:

- modern
- professional
- simple
- clean
- polished
- intuitive
- responsive
- accessible
- consistent

Think:

> **Professional SaaS product**

Not:

> Student project / hackathon prototype.

### Visual principles

Prefer:

- strong visual hierarchy
- clean typography
- consistent spacing
- restrained colors
- clear button hierarchy
- subtle borders
- purposeful shadows
- consistent radius
- uncluttered layouts

Avoid:

- excessive gradients
- excessive animations
- visual clutter
- too many colors
- oversized headings
- unnecessary decorative elements
- excessive cards
- gimmicky UI

Usability is more important than visual effects.

---

# 13. Required UX States

The assignment explicitly calls out:

### Loading indicators

Every meaningful async operation should provide feedback.

Examples:

- initial data loading
- refreshing
- creating
- updating
- deleting
- submitting forms

### Empty states

Never leave a blank screen when there is simply no data.

Provide a useful message and, where appropriate, a clear next action.

### Error handling

The assignment explicitly expects basic error messages/toasts.

Handle:

- API failures
- validation errors
- network failures
- failed mutations
- background-job failures where they surface in the UI

The user should always understand what happened.

### Success feedback

For important actions, clearly indicate success.

Use:

- toast notifications
- inline success messages
- status updates

where appropriate.

---

# 14. Forms

Forms should have:

- clear labels
- sensible grouping
- validation
- useful validation messages
- sensible defaults
- disabled submit while processing
- success feedback
- failure feedback

Do not allow confusing states where the user cannot tell whether an action was submitted.

---

# 15. Responsive Design

The frontend should work properly across:

- desktop
- laptop
- tablet
- mobile

Do not merely shrink the desktop design.

Pay attention to:

- navigation
- tables
- forms
- dialogs
- spacing
- touch targets
- content hierarchy

---

# 16. Accessibility

Implement sensible accessibility practices:

- semantic HTML
- keyboard navigation
- visible focus states
- accessible labels
- correct button semantics
- accessible dialogs
- proper form error associations
- sufficient contrast
- meaningful loading/error/empty messages

---

# 17. Security

Implement reasonable production-level security without unnecessary complexity.

Consider:

- environment variables
- input validation
- safe error responses
- CORS configuration
- secure headers where appropriate
- request limits where appropriate
- secret protection
- safe logging

Never commit secrets.

---

# 18. Testing

Add meaningful tests around important behavior.

Prioritize:

- core business logic
- validation
- important API endpoints
- scheduling behavior
- worker behavior
- critical frontend interactions

Also run:

- TypeScript type checking
- linting
- production build
- relevant tests
- basic integration verification

Do not create meaningless tests just to increase test count.

---

# 19. README / Documentation Requirements

The assignment explicitly requires a README.

The README must explain:

## Project Overview

What the application does and what problem it solves.

## Features

Major implemented functionality.

## Tech Stack

Technologies used and their purpose.

## Architecture

Explain the major components and their relationships.

At minimum explain the relationship between:

```text
Frontend
Backend / Express
Database
Redis
BullMQ
Worker
Ethereal Email
```

## Project Structure

Explain important directories.

## Prerequisites

Everything required to run the project.

## Environment Variables

Document all required environment variables.

Provide:

```text
.env.example
```

without real secrets.

## Backend Setup

Explain how to run:

- Express backend
- database
- Redis
- BullMQ worker

## Frontend Setup

Explain how to install dependencies and run the frontend.

## Ethereal Email Setup

Explain configuration and how to inspect test emails.

## Scheduling

Explain exactly how scheduling works.

## Persistence on Restart

Explain exactly how persistent state and scheduled/background jobs behave across restart.

## API Overview

Document important endpoints.

## Testing

Explain test commands.

## Build

Explain production build commands.

## Design Decisions

Explain important architectural decisions briefly.

## Trade-offs

Explain intentional simplifications where useful.

A reviewer should be able to clone the repository and understand how to run the complete system without guessing.

---

# 20. GitHub Submission Requirements

The assignment explicitly requires:

1. A **private GitHub repository**.
2. A monorepo is acceptable.
3. Backend and frontend can be separate folders.
4. Repository access must be granted to:
   - `Mitrajit`
   - `Yadav036`
5. A README must be included with setup and architecture documentation.

Do not put credentials or secrets into GitHub.

---

# 21. Recommended Repository Organization

Use a clean structure appropriate for the final implementation.

A possible structure:

```text
project/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   └── ...
│   └── ...
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── queues/
│   │   ├── workers/
│   │   ├── middleware/
│   │   ├── config/
│   │   ├── types/
│   │   └── ...
│   └── ...
│
├── shared/
│   └── ...
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

This is guidance, not a rigid requirement. Use the simplest clean architecture that fits the actual application.

---

# 22. Existing AI / Developer Skills

Before implementation, inspect the machine/workspace for existing development skills and instructions.

Relevant sources may include:

- Claude skills
- OpenCode skills
- Antigravity skills
- repository-local skills
- global coding instructions
- frontend/UI skills
- React skills
- TypeScript skills
- backend/API skills
- database skills
- testing skills
- Docker/DevOps skills

Also inspect:

```text
AGENTS.md
CLAUDE.md
README.md
CONTRIBUTING.md
.opencode/
.claude/
```

and other relevant project-specific instruction files.

Use the relevant existing skills.

Do not blindly apply unrelated skills.

If a relevant existing skill gives better engineering/UI guidance, follow it.

---

# 23. Development Philosophy

Build this like a professional engineering team.

### Favor:

- simple architecture
- strong typing
- clear naming
- small focused modules
- reusable components
- testable services
- centralized validation
- centralized error handling
- predictable API contracts
- maintainable code
- good developer experience

### Avoid:

- giant files
- copy/paste code
- unnecessary abstractions
- unnecessary dependencies
- microservices
- fake functionality
- hardcoded data
- fake scheduling
- fake persistence
- swallowed errors
- unfinished required features
- TODO placeholders for required functionality

---

# 24. Self-Review Before Completion

Before declaring the project complete, perform a company-style review.

Verify:

### Functional

- every known assignment requirement is implemented
- important user flows work
- API behavior works
- database persistence works
- Redis works
- BullMQ works
- worker works
- scheduling works
- email works
- restart behavior works

### Frontend

- clean layout
- consistent design system
- responsive UI
- reusable components
- proper loading states
- empty states
- error states
- success feedback
- accessible forms
- polished navigation

### Code

- clean folder structure
- DRY code
- strong TypeScript
- typed API contracts
- separation of concerns
- no unnecessary complexity
- no secrets
- no obvious dead code

### Infrastructure

- backend starts correctly
- frontend starts correctly
- Redis starts correctly
- worker starts correctly
- database setup is documented
- environment variables are documented
- restart/recovery has been tested

### Documentation

- README is complete
- setup instructions work
- architecture is explained
- scheduling is explained
- restart persistence is explained
- Ethereal Email setup is explained

---

# 25. Important Rule About Unknown Requirements

The current known material includes the technical/code-quality/submission requirements above, but it does not contain every possible functional/business requirement of the application.

Therefore:

1. Do not invent business functionality.
2. Search the workspace for any assignment/specification files before implementation.
3. Inspect all relevant available documents and screenshots.
4. If additional requirements are discovered, treat those as authoritative.
5. Keep this document as the engineering-quality baseline.
6. If a requirement conflicts with an actual assignment requirement, the actual assignment requirement wins.

---

# 26. Final Quality Bar

The finished project should be:

**Professional**
**Clean**
**Simple**
**Type-safe**
**Maintainable**
**Reliable**
**Responsive**
**Accessible**
**Well-tested**
**Well-documented**
**Visually polished**
**Easy to run**

The reviewer should be able to look at the project and conclude:

> "This developer understands how to build and structure a real full-stack application, not just make a UI that happens to work."

---

# 27. OpenCode Execution Instruction

When this file is provided to OpenCode:

### First

Inspect the workspace and all available project/assignment materials.

### Second

Inspect the available Claude/OpenCode/Antigravity/repository skills and use relevant ones.

### Third

Create an implementation plan based on the actual requirements.

### Fourth

Implement the project incrementally.

### Fifth

Run and test the real application.

### Sixth

Perform visual QA.

### Seventh

Perform a full code review against this document and the actual assignment.

### Eighth

Fix every issue found.

### Ninth

Finalize the README and `.env.example`.

### Tenth

Run final:

- typecheck
- lint
- tests
- build
- integration checks
- restart/persistence verification

Only then consider the project submission-ready.

---

## Final Instruction to OpenCode

**Do not start by blindly generating code.**

First understand the requirements, inspect the available skills and project environment, establish the architecture, and then implement systematically.

Build a real, polished, production-quality application suitable for a company technical evaluation.
