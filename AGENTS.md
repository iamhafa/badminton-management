<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Architecture & Conventions

## 1. Directory Structure

```text
src/
├── app/                                    # Next.js App Router (pages and layouts)
│   ├── calculator/page.tsx                 # Main calculator page (/calculator)
│   ├── history/page.tsx                    # Match & billing history (/history)
│   ├── settings/                           # Settings pages (groups, courts, shuttlecocks)
│   └── layout.tsx                          # Root layout with ConfirmProvider & Header
│
├── components/
│   ├── common/                             # Shared display widgets (e.g. RoleBadge)
│   ├── features/                           # Feature-scoped components and schemas
│   │   ├── calculator/
│   │   │   ├── BillSummaryCard.tsx         # Bill summary breakdown and save trigger
│   │   │   ├── GuestForm.tsx               # Guest player creation form
│   │   │   ├── ParticipantSelector.tsx     # Player selection checklist
│   │   │   ├── SessionCostForm.tsx         # Court, shuttlecock, water, fee inputs
│   │   │   └── schemas/
│   │   │       └── guest.schema.ts         # guestFormSchema & GuestDraft (inline Zod)
│   │   │
│   │   ├── history/
│   │   │   └── HistoryList.tsx             # Paginated/expandable session history
│   │   │
│   │   └── settings/
│   │       ├── CourtForm.tsx
│   │       ├── GroupForm.tsx
│   │       ├── MemberForm.tsx
│   │       ├── ShuttlecockForm.tsx
│   │       ├── RosterManager.tsx
│   │       ├── SettingsNav.tsx
│   │       └── schemas/                    # Feature-colocated form schemas
│   │           ├── court.schema.ts         # courtFormSchema & CourtDraft
│   │           ├── group.schema.ts         # groupFormSchema & GroupDraft
│   │           ├── member.schema.ts        # memberFormSchema & MemberDraft
│   │           ├── shuttlecock.schema.ts   # shuttlecockFormSchema & ShuttlecockDraft
│   │           └── index.ts                # Barrel export for settings schemas
│   │
│   ├── form/                               # Shared form inputs (MoneyInput, FieldError)
│   ├── layout/                             # Global header and navigation
│   └── ui/                                 # Base shadcn/ui components (DO NOT MODIFY DIRECTLY)
│
├── context/                                # Lightweight global UI contexts (ConfirmContext, ConnectionContext)
├── hooks/                                  # Reusable hooks (useCalculator, useConfirm, useEscapeKey)
├── libs/
│   └── firebase/                           # Data Access Layer & Firebase SDK wrapper only
│       ├── api/                            # Class-based APIs (CourtApi, GroupApi, ShuttlecockApi, SessionApi)
│       ├── client/                         # FirebaseClient singleton app initialization
│       ├── constant/                       # Firestore collection name constants
│       ├── helper/                         # Firestore doc parser and timestamp conversion helpers
│       ├── schema/                         # Firestore data validation schemas (database-level Zod schemas)
│       └── index.ts                        # Public barrel exports for Firebase APIs
│
├── styles/
│   └── globals.css                         # Tailwind CSS global styles and theme variables
├── types/                                  # Pure TypeScript interfaces & domain entities (Court, Group, Player, SessionBill)
└── utils/                                  # Pure utility functions (no external service dependencies)
    ├── date.ts                             # Date formatting, weekdays, timestamps (nowIso, formatDateVN)
    ├── format.ts                           # Currency (formatVND), gender label, payable descriptions, constants
    └── messenger.ts                        # Social export builder for Messenger / Zalo (buildMessengerText)
```

## 2. Layer Responsibilities & Rules

1. **`src/libs/`**:
   - Strictly reserved for external service integrations and third-party SDK wrappers.
   - Currently contains only `firebase/`. Never place pure utility functions, calculation helpers, or UI form schemas directly inside `src/libs/`.

2. **Form Schemas & Feature-Colocation**:
   - UI form validation schemas (used with `react-hook-form` via `zodResolver`) are colocated within their respective feature directories: `src/components/features/<feature>/schemas/<entity>.schema.ts`.
   - Each schema defines its validation rules directly with inline Zod calls (e.g. `z.string().trim().min(1, '...')`, `z.number().int().positive('...')`).
   - Distinct from database schemas in `src/libs/firebase/schema/` (which validate documents read from Firestore).

3. **`src/utils/`**:
   - Pure, stateless helper functions without side effects or SDK dependencies.
   - Keep file names concise without redundant `-utils` suffixes (`date.ts`, `format.ts`, `messenger.ts`).

4. **`src/components/ui/`**:
   - Base primitives installed and managed by **shadcn/ui** (using `@base-ui/react`).
   - **DO NOT MODIFY** files in `src/components/ui/` directly. Always customize styling from parent components using Tailwind utility classes or create higher-level wrapper components.

5. **Contexts vs Page State**:
   - Avoid monolithic ("God") contexts. Pages fetch their own data directly via Firebase class APIs (`CourtApi`, `GroupApi`, `ShuttlecockApi`, `SessionApi`).
   - `src/context/` is reserved only for lightweight global UI states (e.g., `ConfirmContext`, `ConnectionContext`).

6. **Routing & Redirects**:
   - Managed centrally in `next.config.ts` (`redirects`):
     - `/` -> `/calculator` (permanent 308)
     - `/settings` -> `/settings/groups` (temporary 307)
   - Active routes: `/calculator`, `/history`, `/settings/groups`, `/settings/courts`, `/settings/shuttlecocks`.

## 3. Code Standards & Verification

Before finalizing any task or committing changes:

- TypeScript check: `npx tsc --noEmit -p .`
- Linting: `npx oxlint src`
- Formatting: `npx oxfmt "src/**/*.{ts,tsx,json}" "*.json" ".*.json"`
