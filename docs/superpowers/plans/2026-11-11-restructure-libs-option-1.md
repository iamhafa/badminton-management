# Restructure `src/libs` (Option 1: Clean Layer Separation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize `src/libs` into clean architectural layers: preserve `src/libs/firebase/` for third-party Firebase integrations, relocate UI form validation schemas to `src/schemas/form.schema.ts`, and move calculation formatters and date helpers into focused utilities under `src/utils/` (`format.ts`, `messenger.ts`, `date.ts`).

**Architecture:**

1. `src/libs/firebase/` remains the dedicated external service / Data Access Layer.
2. `src/schemas/form.schema.ts` holds all Zod form schemas and inferred draft types for React Hook Form.
3. `src/utils/` holds pure utility helpers: `date.ts` (renamed from `date-utils.ts`), `format.ts` (currency, gender, payable helpers, constants), and `messenger.ts` (social export builder).
4. Remove single-file shallow directories (`src/libs/calculation/` and `src/libs/form/`).
5. Ensure root routes (`src/app/page.tsx`, `src/app/calculator/page.tsx`, `src/app/settings/page.tsx`) correctly resolve and redirect without 404s.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Zod, date-fns, oxlint, oxfmt.

**Spec:** User request to implement Option 1 (clear layer separation between external libs, pure utils, and form schemas).

## Global Constraints

- Preserve all existing interfaces and exported functions verbatim (`formatVND`, `genderLabel`, `describePayable`, `buildMessengerText`, `SHUTTLES_PER_TUBE`, `FEMALE_CAP_PRESETS`, `sumRoundedPayable`, `nowIso`, `todayIso`, etc.).
- Comply strictly with `AGENTS.md` (Next.js 16 rules).
- Do not modify files in `src/components/ui/`.
- Ensure clean TypeScript check (`npx tsc --noEmit`), lint (`npx oxlint src`), format (`npx oxfmt`), and production build (`pnpm build`).

## Review Focus

1. Verify all 9 routes build and export cleanly as static pages (`/`, `/_not-found`, `/calculator`, `/history`, `/settings`, `/settings/courts`, `/settings/groups`, `/settings/shuttlecocks`).
2. Verify all references to `@/libs/calculation/calculator`, `@/libs/form/form-schemas`, and `@/utils/date-utils` are completely replaced.
3. Ensure no empty or dangling directories remain in `src/libs/calculation` or `src/libs/form`.
4. Ensure `buildMessengerText` accurately generates the formatted string with all breakdown tags.
5. Ensure form submission and Zod resolution continue to function smoothly across settings and calculator forms.

---

### Task 1: Create Schemas and Utility Modules

**Files:**

- Create: `src/schemas/form.schema.ts`
- Create: `src/utils/format.ts`
- Create: `src/utils/messenger.ts`
- Create: `src/utils/date.ts`

**Interfaces:**

- `src/schemas/form.schema.ts`:
  - `groupFormSchema`, `GroupDraft`
  - `courtFormSchema`, `CourtDraft`
  - `shuttlecockFormSchema`, `ShuttlecockDraft`
  - `memberFormSchema`, `MemberDraft`
  - `guestFormSchema`, `GuestDraft`
- `src/utils/format.ts`:
  - `SHUTTLES_PER_TUBE = 12`
  - `FEMALE_CAP_PRESETS = [40000, 50000, 60000]`
  - `sumRoundedPayable(bill: TSessionBill): number`
  - `formatVND(amount: number): string`
  - `genderLabel(gender: TPlayer['gender']): string`
  - `describePayable(amount: number): string`
- `src/utils/messenger.ts`:
  - `buildMessengerText(bill: TSessionBill): string`
- `src/utils/date.ts`:
  - All existing exports from `src/utils/date-utils.ts` (`nowIso`, `todayIso`, `formatDateVN`, `getWeekdayVN`, `formatDateTimeVN`, `buildSessionTitle`, etc.)

- [ ] **Step 1: Write `src/schemas/form.schema.ts`**
- [ ] **Step 2: Write `src/utils/format.ts`**
- [ ] **Step 3: Write `src/utils/messenger.ts`**
- [ ] **Step 4: Copy/move `src/utils/date-utils.ts` to `src/utils/date.ts`**

---

### Task 2: Update All Imports Across the Project

**Files:**

- Modify: `src/hooks/useCalculator.ts`
- Modify: `src/components/features/calculator/SessionCostForm.tsx`
- Modify: `src/components/features/calculator/BillSummaryCard.tsx`
- Modify: `src/components/features/calculator/GuestForm.tsx`
- Modify: `src/components/features/history/HistoryList.tsx`
- Modify: `src/components/features/settings/CourtForm.tsx`
- Modify: `src/components/features/settings/GroupForm.tsx`
- Modify: `src/components/features/settings/MemberForm.tsx`
- Modify: `src/components/features/settings/RosterManager.tsx`
- Modify: `src/components/features/settings/ShuttlecockForm.tsx`
- Modify: `src/app/settings/courts/page.tsx`
- Modify: `src/app/settings/groups/page.tsx`
- Modify: `src/app/settings/shuttlecocks/page.tsx`
- Modify: `src/libs/firebase/api/shuttlecock.api.ts`

- [ ] **Step 1: Update form schema imports to `@/schemas/form.schema`**
- [ ] **Step 2: Update calculation and format imports to `@/utils/format` and `@/utils/messenger`**
- [ ] **Step 3: Update date imports to `@/utils/date`**

---

### Task 3: Clean Up Obsolete Files and Folders

**Files:**

- Delete: `src/libs/calculation/calculator.ts` (and remove `src/libs/calculation/`)
- Delete: `src/libs/form/form-schemas.ts` (and remove `src/libs/form/`)
- Delete: `src/utils/date-utils.ts`
- Delete: `src/libs/calculator.ts` (if exists)

- [ ] **Step 1: Remove old files**
- [ ] **Step 2: Verify `src/libs/` only contains `firebase/`**

---

### Task 4: Fix Page Routing (`/`, `/calculator`, `/settings`)

**Files:**

- Create: `src/app/page.tsx` (Move Calculator page implementation here)
- Modify: `src/app/calculator/page.tsx` (Add redirect to `/`)
- Create: `src/app/settings/page.tsx` (Add redirect to `/settings/groups`)

- [ ] **Step 1: Write `src/app/page.tsx` with full CalculatorPage**
- [ ] **Step 2: Update `src/app/calculator/page.tsx` with `redirect('/')`**
- [ ] **Step 3: Ensure `src/app/settings/page.tsx` redirects to `/settings/groups`**

---

### Task 5: Verification and Build

- [ ] **Step 1: Run TypeScript compiler: `npx tsc --noEmit -p .`**
- [ ] **Step 2: Run linter: `npx oxlint src`**
- [ ] **Step 3: Run formatter: `npx oxfmt --check "src/**/\*.{ts,tsx,json}"`\*\*
- [ ] **Step 4: Run Next.js production build: `pnpm build`**
- [ ] **Step 5: Verify all 9 routes pass static generation**
