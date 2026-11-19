<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Architecture & Conventions

> **Comprehensive Architecture Guide:**
> Detailed architecture, data flow and layer responsibilities are documented in [.agents/ARCHITECTURE.md](.agents/ARCHITECTURE.md). Consult it before adding features, changing stores, or touching the data layer.

## 1. Directory Structure & Colocation

Code is colocated per route under `src/app/<route>/`. Shared code lives in the top-level `src/` folders.

```text
src/
├── app/                                    # Next.js App Router
│   ├── layout.tsx                          # Root layout (QueryProvider, HeaderLayout, ConfirmDialog, Toaster)
│   ├── loading.tsx, error.tsx, global-error.tsx, not-found.tsx
│   ├── calculator/                         # /calculator: components/, hooks/, schemas/, utils/, page.tsx
│   ├── history/                            # /history: components/, hooks/, utils/, page.tsx
│   └── settings/                           # /settings/*
│       ├── layout.tsx                      # Settings tab bar (inline, Client Component)
│       ├── courts/                         # components/, hooks/, schemas/, page.tsx
│       ├── groups/                         # components/, hooks/, schemas/, page.tsx, [id]/page.tsx
│       └── shuttlecocks/                   # components/, hooks/, schemas/, page.tsx
│
├── components/                             # Cross-route shared UI
│   ├── common/                             # ConfirmDialog, LoadingState, RoleBadge (+ GenderTag)
│   ├── form/                               # MoneyInput, FieldError
│   ├── layout/                             # HeaderLayout (app header + cloud status indicator)
│   ├── provider/                           # QueryProvider (QueryClient + online/offline listener)
│   └── ui/                                 # shadcn/ui primitives (@base-ui/react) — DO NOT EDIT DIRECTLY
│
├── hooks/                                  # Shared TanStack Query hooks (useQuery*, useMutate*)
├── libs/supabase/                          # Data access layer only: client/supabase.client.ts, types/database.type.ts, api/
├── stores/                                 # Zustand UI stores: confirm.store, connection.store
├── styles/                                 # globals.css (Tailwind CSS v4)
├── types/                                  # Domain types (*.type.ts)
└── utils/                                  # Pure helpers: date.ts, format.ts
```

## 2. Core Architectural Rules

1. **Colocation & boundaries**:
   - Code used by only one route lives in that route's folder (`components/`, `hooks/`, `schemas/`, `utils/`).
   - Move it to the shared `src/` folders only when a second route needs it.
   - Routes must not import from each other (e.g. `app/calculator` must not import from `app/settings`). Shared code must not import from `src/app/`.

2. **`page.tsx` is UI only**:
   - `page.tsx` holds the screen's main layout and JSX. Do not wrap the whole screen in one big component (e.g. a `HistoryList` rendered alone by the page); `components/` only holds smaller pieces (cards, forms, headers, empty states).
   - Page state and handlers live in a route hook: `app/calculator/hooks/useCalculator.ts`, `app/settings/<tab>/hooks/use<Tab>Page.ts` (`useCourtsPage`, `useShuttlecocksPage`, `useGroupsPage`, `useGroupDetailPage`), `app/history/hooks/useHistoryPage.ts`.
   - Pure calculations live in the route's `utils/` (e.g. `app/calculator/utils/bill.ts` for `calculateBill`). No React there.

3. **Component naming**:
   - Every component file under `src/app/` is prefixed with its top-level screen name, so it is easy to find and never collides with shared components:
     - `/calculator` -> `Calculator*` (`CalculatorBillSummaryCard`, `CalculatorSessionCostForm`, ...)
     - `/history` -> `History*` (`HistorySessionCard`, `HistoryPaymentControl`, ...)
     - `/settings/*` -> `Settings<Entity>*` (`SettingsCourtForm`, `SettingsGroupForm`, `SettingsGroupMemberForm`, `SettingsGroupRosterManager`, `SettingsShuttlecockForm`)
   - Named exports follow the same prefix (`SettingsCourtAddForm`, `SettingsCourtEditForm`, ...).
   - New route components must follow this prefix rule.

4. **Data model = database (no mapper)**:
   - The database is **Supabase (Postgres)**. The schema (tables, check constraints, rpc functions, triggers, RLS policies) lives in SQL migrations under `supabase/migrations/`. Develop against the local stack (`npx supabase start`, Docker); production is migrated later. Do not change the schema in a Dashboard by hand: add a migration with `npx supabase migration new <name>` and apply it with `npx supabase migration up`. Read `src/libs/supabase/types/database.type.ts` to see the current tables and functions.
   - Every table has `created_at` and `updated_at`; a `set_updated_at` trigger (moddatetime) maintains `updated_at`, so the app never sets it on updates. There is no soft delete (`deleted_at`): deleting always removes the row, and foreign keys (`on delete set null` / `cascade`) handle related rows.
   - App types use the database rows directly (snake_case, `null` for empty): `src/types/*.type.ts` only alias `Tables<'...'>` from `src/libs/supabase/types/database.type.ts` and narrow enum columns (`gender`, `role`, `paid_method`...). Do not add mapper functions that rename fields.
   - Form schemas in `src/app/<route>/schemas/` use column names too (`female_cap`, `tube_price`). Form-only quirks (a `<select>` uses `''` for "none") are converted to `null` right where the row is built.
   - `database.type.ts` is generated: after adding a migration, run `pnpm db:types:local` (from the local stack; `pnpm db:types` reads production and needs `npx supabase login`). Never edit it by hand.

5. **`src/libs/`**:
   - Only external service integrations: the Supabase client and the class APIs `CourtApi`, `GroupApi`, `SessionApi`, `ShuttlecockApi` (`src/libs/supabase/`).
   - Writes that touch several tables go through Postgres functions called with `rpc` (`save_session`, `save_group`, `set_default_shuttlecock`), so they run in one transaction.
   - Never put UI form schemas, React hooks or calculation helpers in `src/libs/`.

6. **`src/components/ui/`**:
   - Managed by **shadcn/ui**. **DO NOT MODIFY** these files. Customize from parent components with Tailwind classes or wrapper components.
   - Add new primitives with `pnpm dlx shadcn@latest add <name>` (on this machine prefix with `NODE_OPTIONS=--use-system-ca` if the registry certificate check fails).

7. **Server data vs UI state**:
   - Server data goes through **TanStack Query** hooks in `src/hooks/useQuery*.ts` only. Save mutations invalidate the matching query key; deleting a session and updating payment marks are optimistic (see ARCHITECTURE.md).
   - `src/stores/` (Zustand) holds only small global UI state (`confirm.store.ts`, `connection.store.ts`). No large "God" stores or contexts.

8. **`src/utils/`**:
   - Pure, stateless functions without React or SDK dependencies. Concise file names without `-utils` suffix.

9. **Imports**:
   - Inside the same route folder use relative paths (`./components/...`, `../schemas/...`). Everything else uses the `@/` alias.

10. **Routing & redirects** (in `next.config.ts`):
    - `/` -> `/calculator` (permanent 308), `/settings` -> `/settings/groups` (temporary 307).
    - Routes: `/calculator`, `/history`, `/settings/groups`, `/settings/groups/[id]`, `/settings/courts`, `/settings/shuttlecocks`.
    - `typedRoutes` is on: `href` and `router.push()` only accept existing routes.

## 3. Code Standards & Verification

Before finalizing any task, run:

- Route types + TypeScript: `npx next typegen && npx tsc --noEmit -p .`
  - `next typegen` refreshes route types when the dev server is not running. If `tsc` reports errors only inside `.next/dev/types/` after moving routes, the dev-server cache is stale: restart `pnpm dev` (or delete `.next/dev`).
- Linting: `pnpm lint`
- Formatting: `pnpm format`
