---
name: zustand
description: Use when creating, modifying, or refactoring client-side global UI stores, Zustand actions, selectors, or state subscriptions in React/Next.js.
---

# Zustand (v5) Best Practices & Architecture Guide

Zustand is a minimalistic, unopinionated, hook-based state management library built on top of `useSyncExternalStore`. This skill documents the mental model, selector discipline, and architectural boundaries for our codebase.

---

## 1. Architectural Boundary: Zustand vs TanStack Query

A critical convention in our project architecture (see `.agents/ARCHITECTURE.md`):

```
┌───────────────────────────────────────┐   ┌────────────────────────────────────────┐
│             Zustand Stores            │   │          TanStack Query Hooks          │
│             (`src/stores/`)           │   │             (`src/hooks/`)             │
├───────────────────────────────────────┤   ├────────────────────────────────────────┤
│ • Ephemeral, synchronous UI state     │   │ • Asynchronous server data             │
│ • Modal / dialog open/close states     │   │ • Firestore documents (Courts, Groups) │
│ • Imperative triggers (confirm dialog)│   │ • Cache revalidation & invalidation    │
│ • Client connectivity flags           │   │ • Background refetch & stale-time      │
└───────────────────────────────────────┘   └────────────────────────────────────────┘
```

> [!CAUTION]
> **Never replicate server data in Zustand.** If an entity comes from Firestore, manage it with TanStack Query (`useQueryCourts`, `useQueryGroups`). Zustand is reserved strictly for lightweight UI orchestration.

---

## 2. Store Creation & TypeScript Pattern (v5)

Always use the **curried `create<T>()(...)`** pattern recommended in Zustand v5:

```typescript
import { create } from 'zustand';

export interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  toggleSidebar: VoidFunction;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIState>()((set) => ({
  theme: 'light',
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
}));
```

- **Functional updates (`set((state) => ...)`):** Use when new state depends on previous state.
- **Direct updates (`set({ key: value })`):** Zustand performs a shallow merge at the root level by default.

---

## 3. Selector Discipline (Preventing Re-Render Explosions)

Zustand subscribes components to store updates via selectors.

### ❌ Anti-pattern: Destructuring the entire store
```typescript
// BAD: Re-renders whenever ANY property in the store changes!
const { sidebarOpen, theme } = useUIStore();
```

### ✅ Best Practice 1: Atomic Selectors
Subscribe only to the specific slice of state your component renders:

```typescript
// GOOD: Only re-renders when `cloudStatus` changes!
const isOnline = useConnectionStore((state) => state.cloudStatus === 'online');
```

### ✅ Best Practice 2: Multi-property Selection with `useShallow`
If a component genuinely needs multiple properties, use `useShallow` from `zustand/react/shallow` to shallow-compare the resulting object:

```typescript
import { useShallow } from 'zustand/react/shallow';

const { setOnline, setOffline } = useConnectionStore(
  useShallow((state) => ({
    setOnline: state.setOnline,
    setOffline: state.setOffline,
  }))
);
```

---

## 4. Reading & Writing Outside React (`getState` & `setState`)

One of Zustand's greatest strengths is that stores are plain JavaScript objects accessible anywhere—including utility functions, API callbacks, and TanStack Query Cache listeners.

### Example: Syncing with QueryCache
In `src/components/layout/QueryProvider.tsx`:

```typescript
import { useConnectionStore } from '@/stores/connection.store';

queryCache: new QueryCache({
  // Direct store write outside React render tree:
  onSuccess: () => useConnectionStore.getState().setOnline(),
  onError: () => useConnectionStore.getState().setOffline(),
})
```

---

## 5. Advanced Pattern: Promise-Based Imperative UI (`confirm.store.ts`)

Instead of writing `<Dialog open={isOpen} onOpenChange={...}>` in every component, use Zustand to power an imperative `await confirm(...)` helper:

```typescript
// 1. Store holds resolver promise
export const useConfirmStore = create<ConfirmState>()((set, get) => ({
  isOpen: false,
  options: undefined,
  resolver: () => {},
  confirm: (options) => {
    get().resolver(false); // Cancel previous pending dialog
    return new Promise<boolean>((resolve) =>
      set({ isOpen: true, options, resolver: resolve })
    );
  },
  settle: (value) => {
    get().resolver(value);
    set({ isOpen: false, resolver: () => {} });
  },
}));

// 2. Export clean imperative function
export const confirm = (options: ConfirmOptions) =>
  useConfirmStore.getState().confirm(options);

// 3. Usage anywhere in UI handlers:
async function handleDelete() {
  const ok = await confirm({
    title: 'Xóa sân này?',
    destructive: true,
  });
  if (ok) {
    // Proceed with deletion
  }
}
```

---

## 6. Next.js App Router & SSR Safety

1. **Client-Side Stores:** Global stores in `src/stores/` must only be consumed by Client Components (`'use client'`).
2. **Never access `window` or `document` during store creation:** If an action accesses browser APIs (e.g. `window.location.reload()`), ensure it is only invoked inside client-side callbacks, never at module evaluation time.
3. **Persist Middleware Hydration:** If using `persist` middleware with `localStorage`, handle hydration explicitly or use `useIsClient()` to avoid hydration mismatch.

---

## 7. Checklist for New Zustand Stores

1. [ ] Check boundary: Is this server data? If yes, use **TanStack Query**, not Zustand.
2. [ ] Filename must end with `.store.ts` inside `src/stores/`.
3. [ ] Use curried syntax: `create<State>()((set, get) => ({ ... }))`.
4. [ ] Define state types with an explicit interface (`export interface EntityState`).
5. [ ] Colocate actions inside the store object alongside state variables.
6. [ ] In React components, always use atomic selectors: `useStore((s) => s.value)`.

