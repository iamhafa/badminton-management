# Project Architecture & System Design

## 1. System Overview

Badminton Management is a Next.js (App Router) progressive web application built to streamline badminton club session tracking, member roster management, court cost calculation, and split-bill accounting with affirmative support for female cap discounts and social messenger exports.

---

## 2. Directory Structure & Colocation Strategy

The codebase adheres strictly to **feature-colocation** under Next.js App Router: components, schemas, and sub-hooks specific to a route reside inside that route's folder. Shared primitives and global abstractions reside in root-level `src/` modules.

```text
src/
├── app/                                    # Next.js App Router
│   ├── layout.tsx                          # Root layout (Header, QueryProvider, ConfirmDialog, Toaster)
│   ├── not-found.tsx, error.tsx            # Global fallbacks & boundaries
│   │
│   ├── calculator/                         # Route: /calculator (Main billing session)
│   │   ├── components/                     # BillSummaryCard, ParticipantSelector, SessionCostForm, GuestForm
│   │   ├── hooks/                          # useCalculator (Session calculation engine & drafts)
│   │   ├── schemas/                        # guest.schema.ts
│   │   └── page.tsx
│   │
│   ├── history/                            # Route: /history (Session bill archive)
│   │   ├── components/                     # HistoryList (expandable cards, delete/restore)
│   │   └── page.tsx
│   │
│   └── settings/                           # Route: /settings (Club & asset configurations)
│       ├── layout.tsx                      # Settings navigation tabs (SettingsNav)
│       ├── groups/                         # /settings/groups & /settings/groups/[id]
│       │   ├── [id]/page.tsx               # Dedicated group detail & roster management
│       │   ├── components/                 # GroupForm, MemberForm, RosterManager
│       │   ├── schemas/                    # group.schema.ts, member.schema.ts
│       │   └── page.tsx                    # Read-only group summary list
│       ├── courts/                         # /settings/courts
│       │   ├── components/                 # CourtForm
│       │   ├── schemas/                    # court.schema.ts
│       │   └── page.tsx
│       └── shuttlecocks/                   # /settings/shuttlecocks
│           ├── components/                 # ShuttlecockForm
│           ├── schemas/                    # shuttlecock.schema.ts
│           └── page.tsx
│
├── components/                             # Cross-route reusable UI components
│   ├── common/                             # Shared display widgets (ConfirmDialog, RoleBadge, LoadingState)
│   ├── form/                               # Shared form inputs (MoneyInput, FieldError)
│   ├── layout/                             # Shell layout (Header, ConnectionWatcher, QueryProvider)
│   └── ui/                                 # Base shadcn/ui primitives (@base-ui/react) — DO NOT EDIT DIRECTLY
│
├── hooks/                                  # Global data fetching hooks (TanStack Query wrappers)
│   ├── useQueryCourts.ts                   # useCourts, useActiveCourts, useHiddenCourts, useSaveCourt
│   ├── useQueryGroups.ts                   # useGroups, useActiveGroups, useHiddenGroups, useSaveGroup
│   ├── useQuerySessions.ts                 # useSessions, useSaveSession, useDeleteSession
│   └── useQueryShuttlecocks.ts             # useShuttlecocks, useActiveShuttlecocks, useSetDefaultShuttlecock
│
├── libs/
│   └── firebase/                           # Data Access Layer (DAL) & Firebase SDK wrapper only
│       ├── api/                            # Class-based APIs (CourtApi, GroupApi, ShuttlecockApi, SessionApi)
│       ├── constant/                       # Firestore collection constants
│       ├── firestore/                      # Firestore client initialization & offline cache config
│       ├── helper/                         # Doc parsers and timestamp converters
│       └── schema/                         # Database-level Zod validation schemas
│
├── stores/                                 # Lightweight UI stores (Zustand)
│   ├── confirm.store.ts                    # Imperative confirm() dialog trigger
│   └── connection.store.ts                 # Cloud connectivity status watcher
│
├── styles/
│   └── globals.css                         # Tailwind CSS v4 styles & CSS custom variables
├── types/                                  # Pure TypeScript domain interfaces & types (*.types.ts)
└── utils/                                  # Pure stateless utility functions (no external SDK dependencies)
    ├── date.ts                             # Date formatting, weekdays, nowIso
    ├── format.ts                           # formatVND, gender labels, currency helpers
    └── messenger.ts                        # Social export string builder (Zalo/Messenger)
```

---

## 3. Layer Responsibilities & Architectural Boundaries

### 3.1. `src/libs/` (Data Access Layer)
- Strictly reserved for external service integrations, SDK wrappers, and database clients.
- Never put UI state, React hooks, pure calculation utilities, or UI form schemas into `src/libs/`.
- All Firestore queries pass through typed class APIs (`CourtApi`, `GroupApi`, `ShuttlecockApi`, `SessionApi`).

### 3.2. `src/components/ui/` (Design System Primitives)
- Base primitives managed by **shadcn/ui** and built on top of `@base-ui/react`.
- **DO NOT MODIFY** files in `src/components/ui/` directly. Customize appearance through props, `className`, Tailwind utilities, or higher-level wrapper components.

### 3.3. `src/stores/` vs `src/hooks/`
- Avoid monolithic "God" contexts or stores.
- Server data (Firestore) is handled exclusively by **TanStack Query** (`src/hooks/useQuery*.ts`).
- **Zustand stores** (`src/stores/`) are reserved strictly for ephemeral, global UI states (e.g. `confirm.store.ts` for imperative promise-based dialogs, `connection.store.ts` for network status).

### 3.4. `src/utils/` (Pure Utilities)
- Must be stateless and deterministic.
- Zero dependencies on React, browser DOM, or external network services.
- File names must be concise without redundant `-utils` suffixes (`date.ts`, `format.ts`, `messenger.ts`).

---

## 4. Data Flow & Synchronization

```
┌────────────────────────────────────────────────────────┐
│                   React Components                     │
└───────────▲────────────────────────────────┬───────────┘
            │ Reading                        │ Mutation
            │                                ▼
┌───────────┴──────────────┐     ┌───────────────────────┐
│   TanStack Query Hooks   │     │  useMutate* Hooks     │
│  (useActiveGroups, etc.) │     │ (Optimistic Updates)  │
└───────────▲──────────────┘     └───────────┬───────────┘
            │                                │
            │ Fetch / Cache Invalidation     ▼
┌───────────┴────────────────────────────────┴───────────┐
│          Firebase APIs (GroupApi, CourtApi...)         │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             Cloud Firestore / Local Cache              │
└────────────────────────────────────────────────────────┘
```

1. **Query Caching Pattern**:
   - TanStack Query hooks use `initialData: []` combined with `initialDataUpdatedAt: 0` to ensure type safety (data is never `undefined`) while immediately triggering background revalidation on mount.
   - Specialized selectors (e.g., `useActiveGroups`, `useHiddenGroups`) leverage the `select` option to maintain derived data without redundant fetches.

2. **Offline Resilience**:
   - `connection.store.ts` monitors Firestore network state and window online status.
   - UI mutation triggers are gracefully disabled or show warnings when offline, while reads seamlessly fall back to IndexedDB local cache.

---

## 5. Form Validation & Schemas

- **UI Validation**: Form schemas are colocated with their feature route (`src/app/<route>/schemas/<entity>.schema.ts`) and used with `react-hook-form` via `@hookform/resolvers/zod`.
- **Database Validation**: Firestore document validation lives in `src/libs/firebase/schema/` to guarantee that corrupt or malformed data from the network is caught before parsing into domain types.
- UI draft types (e.g., `GroupDraft`, `CourtDraft`) are inferred directly from Zod schemas:
  ```typescript
  export type GroupDraft = z.infer<typeof groupFormSchema>;
  ```

---

## 6. Routing & Redirection Table

Configured centrally in `next.config.ts`:
- `/` ➔ `/calculator` (Permanent 308 redirect)
- `/settings` ➔ `/settings/groups` (Temporary 307 redirect)
- Active routes:
  - `/calculator`: Main session calculation
  - `/history`: Match billing history
  - `/settings/groups`: Group summary list
  - `/settings/groups/[id]`: Group detail and member roster manager
  - `/settings/courts`: Court venue management
  - `/settings/shuttlecocks`: Shuttlecock brand and pricing settings

