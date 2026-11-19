# Project Architecture & System Design

## 1. System Overview

Badminton Management is a Next.js (App Router) web app for a badminton club: it splits the cost of each session (court, shuttlecocks, optional drinking water) between players, applies a per-group female price cap, and stores session history in Supabase (Postgres).

Stack: Next.js 16 (Turbopack, `cacheComponents`, `typedRoutes`, React Compiler), React 19, TypeScript, Tailwind CSS v4, shadcn/ui on `@base-ui/react`, TanStack Query, Zustand, react-hook-form + zod, Supabase (Postgres) via `@supabase/supabase-js`.

All pages are Client Components that load data in the browser through TanStack Query.

---

## 2. Directory Structure & Colocation Strategy

The codebase uses **route-based feature colocation**: components, hooks, form schemas and pure helpers that only one route needs live inside that route's folder. Shared code lives in the top-level `src/` folders.

```text
src/
├── app/                                    # Next.js App Router
│   ├── layout.tsx                          # Root layout (QueryProvider, HeaderLayout, ConfirmDialog, Toaster)
│   ├── loading.tsx                         # Suspense fallback (uses LoadingState)
│   ├── error.tsx, global-error.tsx, not-found.tsx
│   │
│   ├── calculator/                         # /calculator (session cost calculation)
│   │   ├── components/                     # CalculatorBillSummaryCard, CalculatorParticipantSelector,
│   │   │                                   # CalculatorSessionCostForm, CalculatorGuestForm
│   │   ├── hooks/useCalculator.ts          # Screen state: group/court/shuttlecock selection, players, guests, water toggle, reset
│   │   ├── utils/bill.ts                   # Pure bill math: calculateBill, rounding, female cap split
│   │   ├── schemas/guest.schema.ts         # Guest form schema
│   │   └── page.tsx
│   │
│   ├── history/                            # /history (saved sessions)
│   │   ├── components/                     # HistoryEmptyStates (loading / empty / all-settled),
│   │   │                                   # HistorySessionCard (expandable session, payment marks, delete),
│   │   │                                   # HistoryPaymentControl (per-player paid toggle, transfer only), HistoryMonthHeader
│   │   ├── hooks/useHistoryPage.ts         # queries, filters, payment / delete handlers (page state)
│   │   ├── utils/filter.ts                 # ALL_GROUPS, buildGroupFilterOptions, filterSessionsByGroup, sessionGroupName
│   │   ├── utils/month.ts                  # groupSessionsByMonth (with month total / outstanding), sessionDateParts
│   │   ├── utils/payment.ts                # getPaymentSummary, unpaidPlayerIds, formatPaidAt
│   │   └── page.tsx
│   │
│   └── settings/                           # /settings/*
│       ├── layout.tsx                      # Settings tab bar (inline nav, Client Component)
│       ├── groups/                         # /settings/groups and /settings/groups/[id]
│       │   ├── page.tsx                    # Group summary list + create group
│       │   ├── [id]/page.tsx               # Group detail: edit settings, delete, manage members
│       │   ├── hooks/                      # useGroupsPage, useGroupDetailPage
│       │   ├── components/                 # SettingsGroupForm, SettingsGroupRosterManager, SettingsGroupMemberForm
│       │   └── schemas/                    # group.schema.ts, member.schema.ts
│       ├── courts/                         # /settings/courts
│       │   ├── page.tsx
│       │   ├── hooks/useCourtsPage.ts
│       │   ├── components/SettingsCourtForm.tsx
│       │   └── schemas/court.schema.ts
│       └── shuttlecocks/                   # /settings/shuttlecocks
│           ├── page.tsx
│           ├── hooks/useShuttlecocksPage.ts
│           ├── components/SettingsShuttlecockForm.tsx
│           └── schemas/shuttlecock.schema.ts
│
├── components/                             # Cross-route reusable UI
│   ├── common/                             # ConfirmDialog, LoadingState, RoleBadge (+ GenderTag)
│   ├── form/                               # MoneyInput, FieldError
│   ├── layout/HeaderLayout.tsx             # App header, main tabs, cloud status indicator
│   ├── provider/QueryProvider.tsx          # QueryClient + browser online/offline listener
│   └── ui/                                 # shadcn/ui primitives — DO NOT EDIT DIRECTLY
│
├── hooks/                                  # Shared TanStack Query hooks
│   ├── useQueryCourts.ts                   # useQueryCourts, useMutateSaveCourt, useMutateDeleteCourt
│   ├── useQueryGroups.ts                   # useQueryGroups, useMutateSaveGroup, useMutateDeleteGroup
│   ├── useQuerySessions.ts                 # useQuerySessions, useQueryUnsettledSessions, useMutateSaveSession,
│   │                                       # useMutateDeleteSession, useMutateUpdatePayments
│   └── useQueryShuttlecocks.ts             # useQueryShuttlecocks, useMutateShuttlecock, useMutateSetDefaultShuttlecock, useMutateDeleteShuttlecock
│
├── libs/supabase/                          # Data access layer only
│   ├── client/supabase.client.ts           # SupabaseClientApi base class: lazy client (env validated with zod), isNetworkError
│   ├── types/database.type.ts              # Generated by `pnpm db:types` — do not edit by hand
│   ├── api/                                # Static class APIs: CourtApi, GroupApi, SessionApi, ShuttlecockApi
│   └── index.ts
│
├── stores/                                 # Zustand UI stores
│   ├── confirm.store.ts                    # confirm(): promise-based confirmation dialog
│   └── connection.store.ts                 # cloudStatus: 'connecting' | 'online' | 'offline'
│
├── styles/globals.css                      # Tailwind CSS v4
├── types/                                  # Domain types (*.type.ts)
└── utils/                                  # Pure helpers
    ├── date.ts                             # Date parsing/formatting, weekday, nowIso, todayIso
    └── format.ts                           # formatVND, describePayable, SHUTTLES_PER_TUBE, presets
```

---

## 3. Layer Responsibilities & Boundaries

### 3.1. Routes (`src/app/<route>/`)

- `page.tsx` contains UI (JSX) only. It reads everything it needs from one route hook.
- Route hooks (`hooks/use*.ts`) hold page state and handlers: loading/error flags, duplicate-name checks, create/update/delete handlers, toasts, confirm dialogs.
- Pure calculations go in the route's `utils/` (no React), so they can be tested and reused.
- A route never imports from another route. When a second route needs something, move it to the shared folders.

### 3.2. Component naming

- Every component file under `src/app/` is prefixed with its top-level screen name: `Calculator*` in `/calculator`, `History*` in `/history`, `Settings<Entity>*` in `/settings/*` (`SettingsCourtForm`, `SettingsGroupForm`, `SettingsGroupMemberForm`, `SettingsGroupRosterManager`, `SettingsShuttlecockForm`). Named exports use the same prefix. New route components follow the same rule.

### 3.3. `src/libs/` (data access layer)

- Only the Supabase client and the four class APIs. All database reads and writes go through them.
- Multi-table writes call Postgres functions with `rpc` so they run in one transaction.
- Never put UI state, React hooks, calculation helpers or form schemas here.

### 3.4. `src/components/ui/` (design system primitives)

- Managed by **shadcn/ui** on `@base-ui/react`. **DO NOT MODIFY.** Customize via props, `className`, or wrapper components.

### 3.5. `src/hooks/` vs `src/stores/`

- Server data (Supabase) goes only through TanStack Query hooks in `src/hooks/`.
- Zustand stores hold only small global UI state (`confirm.store.ts`, `connection.store.ts`). No large stores or contexts.

### 3.6. `src/utils/`

- Stateless, deterministic, no React / DOM / network dependencies. Concise file names (`date.ts`, not `date-utils.ts`).

---

## 4. Data Flow

```
page.tsx (UI only)
   │ uses
   ▼
route hook (useCourtsPage, useCalculator, ...)
   │ uses
   ▼
TanStack Query hooks (useQuery*, useMutate*)  ──►  QueryCache onSuccess/onError ──► connection.store
   │ call
   ▼
Supabase class APIs (CourtApi, GroupApi, ...)
   │
   ▼
Supabase (Postgres, REST via PostgREST)
```

1. **Queries**
   - Query hooks use `initialData: []` with `initialDataUpdatedAt: 0`, so `data` is never `undefined` and a fetch runs on mount.
   - There is no soft delete. Groups, courts and shuttlecocks are hard-deleted (`GroupApi.delete`, `CourtApi.delete`, `ShuttlecockApi.delete`): `members.group_id` is `on delete cascade`; `sessions.group_id`, `sessions.court_id`, `sessions.shuttlecock_id` and `groups.default_court_id` are `on delete set null`, and sessions keep `group_name` / `court_name` / `shuttle_brand`, so history is unaffected. The history group filter keys sessions of deleted groups by their saved `group_name` (`sessionGroupKey`). The delete mutations also invalidate `['groups']` / `['sessions']`.
   - Defaults (set in `QueryProvider`): `staleTime` 60 s, `retry` 1.

2. **Mutations**
   - Save mutations invalidate their query key (`['courts']`, `['groups']`, ...) so the list is re-fetched from the database.
   - Exceptions (optimistic): `useMutateDeleteSession` removes the session from every `['sessions', ...]` cache immediately, and `useMutateUpdatePayments` applies payment marks immediately. Both restore the previous caches if the write fails. After a payment write, only `['sessions', 'unsettled']` is re-fetched (after the last of several quick writes), so a session that becomes settled leaves the "Chưa thu đủ" list.

3. **Connection status**
   - `QueryProvider` sets `connection.store` from two sources: every query success/error (`QueryCache` callbacks) and the browser `online`/`offline` events.
   - `HeaderLayout` shows the status. Pages disable edit actions while not online.
   - There is no offline persistence: without a connection, data cannot be loaded or saved.

---

## 5. Calculator Rules (summary)

- Shuttle cost = tube price / 12 × shuttles used.
- Court + shuttle cost is split evenly; if the even share is above the group's female cap and there are men, each woman pays the cap and the men split the rest.
- Water is optional (switch, off by default). When on, it is split only among players who drink; the water buyer's advance is subtracted from their amount.
- Each person's amount is rounded to the nearest 1,000đ (≥ 500đ rounds up), so the total collected can differ slightly from the total cost.
- The female cap comes from the group settings (read-only on the calculator). Saved sessions keep a copy of all values used.

### Payment tracking (History screen)

- Each `session_players` row has `paid_method` ('TRANSFER' | 'CASH' | null) and `paid_at`. `null` = not paid yet. A `check` keeps both null or both set. The UI only writes 'TRANSFER' (everyone pays by bank transfer); 'CASH' remains for old rows.
- Marking / unmarking one player shows a toast with "Hoàn tác" that restores the previous method and `paid_at`.
- Amounts come from `rounded_payable` on the same row: > 0 must pay, < 0 gets a refund (e.g. the water buyer), 0 needs nothing.
- `SessionApi.updatePayments(sessionId, playerIds, method, paidAt)` updates those two columns for the given players in one request.
- "Chưa thu đủ" filtering runs in the database: `SessionApi.fetchUnsettled()` embeds `session_players` a second time as an empty `unpaid:session_players!inner()` filtered by `paid_method is null` and `rounded_payable <> 0` (query key `['sessions', 'unsettled']`). The group filter is still applied in the browser on top of it. Per-session payment summaries and outstanding totals are computed in the browser (`app/history/utils/payment.ts`).

## 6. Data Model, Forms & Schemas

- The database schema lives in `supabase/migrations/` and is developed against the local Supabase stack (`npx supabase start`); `src/libs/supabase/types/database.type.ts` is generated from it with `pnpm db:types:local`. Every table has `created_at` / `updated_at` (trigger `set_updated_at` keeps `updated_at` current). It has tables `courts`, `shuttlecocks`, `groups`, `members`, `sessions`, `session_players`; `check` constraints for enum columns; rpc functions `save_session`, `save_group`, `set_default_shuttlecock`; RLS policies (currently public read/write because there is no login).
- There is **no mapper**: app types are the database rows (`Tables<'sessions'>`...) with enum columns narrowed in `src/types/*.type.ts`. Joined results have nested arrays (`TGroup.members`, `TSession.session_players`).
- Sessions store money results as a snapshot (`total_cost`, `rounded_*_unit`, per-player `rounded_payable`...). Display values (session title, player counts) are computed when shown (`buildSessionTitle`, `countPlayers`).
- Form schemas (`src/app/<route>/schemas/`) validate what the user types with `react-hook-form` + zod and use column names. Postgres validates stored data, so there are no read-side zod schemas.

```typescript
export type GroupDraft = z.infer<typeof groupFormSchema>; // { name, female_cap, default_court_id }
```

## 7. Routing

Configured in `next.config.ts`:

- `/` ➔ `/calculator` (permanent 308)
- `/settings` ➔ `/settings/groups` (temporary 307)

Routes:

- `/calculator`: session cost calculation
- `/history`: saved sessions
- `/settings/groups`: group list
- `/settings/groups/[id]`: group detail and members
- `/settings/courts`: courts
- `/settings/shuttlecocks`: shuttlecock types and prices

`typedRoutes` is enabled, so `href` and `router.push()` are type-checked against these routes. Route types are generated by `next dev`, `next build` or `next typegen`.
