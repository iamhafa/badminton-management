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
│   ├── history/                            # /history: components/, page.tsx
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
├── libs/firebase/                          # Data access layer only: api/, firestore/, schema/, helper/, constant/
├── stores/                                 # Zustand UI stores: confirm.store, connection.store
├── styles/                                 # globals.css (Tailwind CSS v4)
├── types/                                  # Domain types (*.types.ts)
└── utils/                                  # Pure helpers: date.ts, format.ts
```

## 2. Core Architectural Rules

1. **Colocation & boundaries**:
   - Code used by only one route lives in that route's folder (`components/`, `hooks/`, `schemas/`, `utils/`).
   - Move it to the shared `src/` folders only when a second route needs it.
   - Routes must not import from each other (e.g. `app/calculator` must not import from `app/settings`). Shared code must not import from `src/app/`.

2. **`page.tsx` is UI only**:
   - Page state and handlers live in a route hook: `app/calculator/hooks/useCalculator.ts`, `app/settings/<tab>/hooks/use<Tab>Page.ts` (`useCourtsPage`, `useShuttlecocksPage`, `useGroupsPage`, `useGroupDetailPage`).
   - Pure calculations live in the route's `utils/` (e.g. `app/calculator/utils/bill.ts` for `calculateBill`). No React there.

3. **Component naming**:
   - Every component file under `src/app/` is prefixed with its top-level screen name, so it is easy to find and never collides with shared components:
     - `/calculator` -> `Calculator*` (`CalculatorBillSummaryCard`, `CalculatorSessionCostForm`, ...)
     - `/history` -> `History*` (`HistoryList`)
     - `/settings/*` -> `Settings<Entity>*` (`SettingsCourtForm`, `SettingsGroupForm`, `SettingsGroupMemberForm`, `SettingsGroupRosterManager`, `SettingsShuttlecockForm`)
   - Named exports follow the same prefix (`SettingsCourtAddForm`, `SettingsCourtEditForm`, ...).
   - New route components must follow this prefix rule.

4. **Two kinds of schema (do not mix them up)**:
   - **Form schemas** — `src/app/<route>/schemas/<entity>.schema.ts`: validate what the user types (used by `react-hook-form` via `@hookform/resolvers/zod`). Draft types such as `CourtDraft` are inferred from them.
   - **Firestore schemas** — `src/libs/firebase/schema/<entity>.schema.ts`: validate documents read from Firestore and fill defaults for missing fields.
   - The file names are the same on purpose; the folder tells you which kind it is.

5. **`src/libs/`**:
   - Only external service integrations (Firebase SDK wrapper and the class APIs `CourtApi`, `GroupApi`, `SessionApi`, `ShuttlecockApi`).
   - Never put UI form schemas, React hooks or calculation helpers in `src/libs/`.

6. **`src/components/ui/`**:
   - Managed by **shadcn/ui**. **DO NOT MODIFY** these files. Customize from parent components with Tailwind classes or wrapper components.
   - Add new primitives with `pnpm dlx shadcn@latest add <name>` (on this machine prefix with `NODE_OPTIONS=--use-system-ca` if the registry certificate check fails).

7. **Server data vs UI state**:
   - Server data goes through **TanStack Query** hooks in `src/hooks/useQuery*.ts` only. Mutations invalidate the matching query key.
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
