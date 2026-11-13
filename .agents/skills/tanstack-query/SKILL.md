---
name: tanstack-query
description: Use when writing, modifying, or debugging data fetching, query caching, mutations, or TanStack Query hooks and providers.
---

# TanStack Query (React Query v5) Best Practices & Core Defaults

This skill documents the core mental model, essential defaults, and production-tested patterns of **TanStack Query v5** tailored for this codebase.

---

## 1. The Core Mental Model: `staleTime` vs `gcTime`

The most common source of confusion in TanStack Query is confusing "stale data" with "cached data".

```
[ Fetched ] ──(staleTime elapsed)──> [ Stale (still in memory) ] ──(gcTime elapsed, no observers)──> [ Garbage Collected ]
    │                                              │                                                             │
    ▼                                              ▼                                                             ▼
Component reads cache;               Component reads cache, but                   Cache destroyed;
no background fetch.                 triggers background refetch.                 must show loading state.
```

### `staleTime` (Default: `0ms`)
- **What it means**: How long fetched data is considered "fresh".
- **Default behavior**: At `0`, data is immediately stale upon arrival. Any component mount, window focus, or network reconnect triggers a background refetch.
- **In our project**: In `QueryProvider.tsx`, we set `defaultOptions.queries.staleTime = 60_000` (1 minute). Navigating between pages within 1 minute does not refetch data unnecessarily.

### `gcTime` (Formerly `cacheTime`, Default: `5 minutes`)
- **What it means**: How long **inactive** queries (no mounted component currently uses them) remain in memory before garbage collection.
- **Default behavior**: When a component unmounts, the query becomes inactive. If the user returns to that screen within 5 minutes, data is served instantly from cache while a background refetch runs.

> [!IMPORTANT]
> - `staleTime` determines **when to trigger a network request**.
> - `gcTime` determines **how long unused memory is retained**.

---

## 2. The 5 Important Defaults & How They Affect Us

TanStack Query ships with aggressive defaults to keep UI synchronized with the server:

### 1. Window Focus Refetching (`refetchOnWindowFocus: true`)
- When the user switches tabs and returns, stale queries refetch automatically in the background.
- Users always see fresh data without manually refreshing the browser.

### 2. Network Reconnect Refetching (`refetchOnReconnect: true`)
- When the device regains internet connection, stale queries refetch automatically.
- Works hand-in-hand with our `ConnectionWatcher` to restore online status.

### 3. Query Retries (`retry: 3` with Exponential Backoff)
- **Default**: Fails 3 times (~1s, ~2s, ~4s delays) before throwing an error to the UI.
- **Our Override**: In `QueryProvider.tsx`, we configure `retry: 1`. In mobile web apps with Firestore, failing faster provides immediate feedback to the user rather than hanging for 7+ seconds.

### 4. Component Mount Refetching (`refetchOnMount: true`)
- If data in the cache is stale, mounting the component triggers a background fetch while rendering the existing cached data immediately (stale-while-revalidate).

### 5. Structural Sharing (`structuralSharing: true`)
- TanStack Query compares new data results against previous data results structurally (by reference and value).
- If an array of 50 items has only 1 item updated, the other 49 item references remain unchanged, preventing unnecessary React component re-renders.

---

## 3. Proven Patterns in Our Codebase

### Pattern A: Type-Safe `initialData` with Instant Revalidation

**The Problem**:
If you set `initialData: []` without `initialDataUpdatedAt`, TanStack Query treats `[]` as fresh data fetched at `Date.now()`. If `staleTime = 60_000`, the real `queryFn` **will not run for 60 seconds**, leaving the UI empty or stuck in connecting status!

**The Correct Solution**:
Combine `initialData: []` with `initialDataUpdatedAt: 0`:

```typescript
export function useQueryGroups() {
  return useQuery<TGroup[], Error, TGroup[]>({
    queryKey: ['groups'],
    queryFn: () => GroupApi.fetchAll(),
    initialData: [],          // TypeScript guarantees data is never undefined
    initialDataUpdatedAt: 0,   // Tells Query: "This initial data was fetched at epoch 0 (infinitely stale)"
    select: (groups) => groups.filter((g) => !g.deletedAt),
  });
}
```

- **Benefit 1**: TypeScript types `data` as `TGroup[]`, never `TGroup[] | undefined`. No need for defensive `groups?.map()` or `(groups ?? []).find()`.
- **Benefit 2**: TanStack immediately recognizes the data is stale on mount and triggers the background `queryFn` without delay.

---

### Pattern B: Selectors (`select`) for Derived Data

Instead of fetching separate endpoints or doing inline filtering in pages, use the `select` option:

```typescript
// Base query
export function useQueryCourts() {
  return useQuery({
    queryKey: ['courts'],
    queryFn: () => CourtApi.fetchAll(),
    initialData: [],
    initialDataUpdatedAt: 0,
    select: (courts) => courts.filter((c) => !c.deletedAt), // Only active courts
  });
}

// Specialized selector hook sharing the same cache
export function useHiddenCourts() {
  return useQuery({
    queryKey: ['courts'],
    queryFn: () => CourtApi.fetchAll(),
    initialData: [],
    initialDataUpdatedAt: 0,
    select: (courts) => courts.filter((c) => !!c.deletedAt), // Only hidden courts
  });
}
```

- **Structural Sharing with `select`**: If `courts` refetches but the filtered result has identical elements, the returned array reference is preserved, preventing consumer re-renders.

---

### Pattern C: Mutations & Cache Invalidation

Always pair `useMutation` with explicit `queryClient.invalidateQueries`:

```typescript
export function useMutateSaveCourt() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (court: TCourt) => CourtApi.save(court),
    onSuccess: () => {
      // Marks the 'courts' query as stale and immediately triggers active observer refetch
      queryClient.invalidateQueries({ queryKey: ['courts'] });
    },
  });
}
```

- Use **exact query keys arrays**: `queryKey: ['courts']`, `queryKey: ['groups', groupId]`.
- Avoid manually editing cache arrays unless implementing complex optimistic updates. Simple invalidation is less error-prone and keeps client/server in sync.

---

### Pattern D: Global QueryCache Observers (Cloud Status Sync)

In `src/components/layout/QueryProvider.tsx`, the global `QueryCache` listens to every query event:

```typescript
queryCache: new QueryCache({
  onSuccess: () => useConnectionStore.getState().setOnline(),
  onError: () => useConnectionStore.getState().setOffline(),
})
```

- Every successful query automatically confirms cloud connectivity.
- Any network error immediately switches the UI indicator to offline mode without boilerplate code in individual hooks.

---

## 4. Checklist for New Query Hooks

When authoring a new hook in `src/hooks/`:

1. [ ] Query keys must be an array: `['sessions']`, not `'sessions'`.
2. [ ] For array lists, provide `initialData: []` and `initialDataUpdatedAt: 0`.
3. [ ] If filtering active/deleted items, do it inside `select: (...)`.
4. [ ] In mutations, always call `queryClient.invalidateQueries({ queryKey: [...] })` in `onSuccess`.
5. [ ] Do not catch and suppress errors in `queryFn` — let errors throw so TanStack Query and `onError` observers can handle retry and offline detection.

