<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Architecture & Conventions

> **Comprehensive Architecture Guide:**
> Detailed architecture, data flow diagrams, and layer responsibilities are documented in [.agents/ARCHITECTURE.md](.agents/ARCHITECTURE.md). Always consult this document when architecting new features, modifying state stores, or integrating database APIs.

## 1. Directory Structure & Colocation

The project enforces route-based feature colocation under `src/app/<feature>/`:

```text
src/
├── app/                                    # Next.js App Router
│   ├── calculator/                         # Route: /calculator (components/, hooks/, schemas/, page.tsx)
│   ├── history/                            # Route: /history (components/, page.tsx)
│   ├── settings/                           # Route: /settings (layout.tsx, groups/, courts/, shuttlecocks/)
│   └── layout.tsx                          # Root layout (Header, QueryProvider, ConfirmDialog)
│
├── components/                             # Cross-route shared UI
│   ├── common/                             # Shared display widgets (ConfirmDialog, RoleBadge, LoadingState)
│   ├── form/                               # Shared form inputs (MoneyInput, FieldError)
│   ├── layout/                             # Shell layout (Header, ConnectionWatcher, QueryProvider)
│   └── ui/                                 # Base shadcn/ui components (@base-ui/react) — DO NOT EDIT DIRECTLY
│
├── hooks/                                  # Global data queries (useQueryGroups, useQueryCourts, etc.)
├── libs/
│   └── firebase/                           # Data Access Layer & Firebase SDK wrappers ONLY (api/, schema/)
├── stores/                                 # Lightweight global UI stores (confirm.store, connection.store)
├── styles/                                 # globals.css (Tailwind CSS v4)
├── types/                                  # Pure TypeScript domain interfaces & types (*.types.ts)
└── utils/                                  # Pure stateless utility functions (date.ts, format.ts, messenger.ts)
```

## 2. Core Architectural Rules

1. **`src/libs/`**:
   - Strictly reserved for external service integrations (Firebase SDK wrapper and Data Access Layer).
   - Never place pure utility functions, calculation helpers, UI form schemas, or React hooks inside `src/libs/`.

2. **Form Schemas & Feature Colocation**:
   - UI form validation schemas (used with `react-hook-form` via `@hookform/resolvers/zod`) are colocated within their feature route: `src/app/<route>/schemas/<entity>.schema.ts`.
   - Distinct from database validation schemas in `src/libs/firebase/schema/` (which validate raw Firestore documents).

3. **`src/components/ui/`**:
   - Base primitives installed and managed by **shadcn/ui** (using `@base-ui/react`).
   - **DO NOT MODIFY** files in `src/components/ui/` directly. Always customize styling from parent components using Tailwind utility classes or create wrapper components.

4. **Data Fetching vs Global UI State**:
   - Server data is managed exclusively via **TanStack Query** hooks in `src/hooks/useQuery*.ts`.
   - `src/stores/` (Zustand) is reserved only for lightweight global UI states (`confirm.store.ts`, `connection.store.ts`). Avoid monolithic ("God") stores or contexts.

5. **`src/utils/`**:
   - Pure, stateless helper functions without side effects or SDK dependencies. Keep filenames concise without redundant `-utils` suffixes (`date.ts`, `format.ts`, `messenger.ts`).

6. **Routing & Redirects**:
   - Managed centrally in `next.config.ts`:
     - `/` -> `/calculator` (permanent 308)
     - `/settings` -> `/settings/groups` (temporary 307)
   - Active routes: `/calculator`, `/history`, `/settings/groups`, `/settings/groups/[id]`, `/settings/courts`, `/settings/shuttlecocks`.

## 3. Code Standards & Verification

Before finalizing any task or committing changes, run:

- TypeScript check: `npx tsc --noEmit -p .`
- Linting: `pnpm lint` (or `npx oxlint src`)
- Formatting: `pnpm format` (or `npx oxfmt "src/**/*.{ts,tsx,json}" "*.json" ".*.json"`)
