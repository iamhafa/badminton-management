---
name: usehooks-ts
description: Use when utilizing, adding, or refactoring React utility hooks from usehooks-ts (such as useBoolean, useLocalStorage, useEventListener, useCopyToClipboard, useMediaQuery, or handling SSR hydration).
---

# `usehooks-ts` Guide & Best Practices (Next.js App Router)

`usehooks-ts` is a lightweight, zero-dependency, type-safe collection of React utility hooks. This skill provides the core mental model, essential hooks, and Next.js SSR hydration guardrails for our project.

---

## 1. Core Principles & Next.js SSR Safety

In Next.js App Router, components are prerendered on the server where browser globals (`window`, `document`, `localStorage`) do not exist.

### Rule 1: Guard Browser-Only State with `useIsClient`
When reading from `localStorage`, window dimensions, or media queries, initial HTML rendered on the server must match the initial HTML on the client to avoid **Hydration Mismatch** errors.

```tsx
import { useIsClient, useLocalStorage } from 'usehooks-ts';

export default function CalculatorPage() {
  const isClient = useIsClient();
  const [draft, setDraft] = useLocalStorage('session_draft', defaultDraft);

  // Avoid rendering client-only localStorage data during server prerender
  if (!isClient) {
    return <LoadingSkeleton />;
  }

  return <CalculatorForm draft={draft} onChange={setDraft} />;
}
```

### Rule 2: Prefer `usehooks-ts` Over Custom Reinvented Wheels
Before writing custom `useEffect` listeners for window resize, keyboard shortcuts, local storage, copy-to-clipboard, or boolean toggles, always check `usehooks-ts` first.

---

## 2. Essential Hooks & Usage Patterns in Our Codebase

### A. State & UI Toggles: `useBoolean`
Replaces messy `useState(false)` and manual inline callbacks (`() => setOpen(true)`, `() => setOpen(false)`, `() => setOpen(prev => !prev)`).

```tsx
import { useBoolean } from 'usehooks-ts';

export function MemberList() {
  const { value: isAdding, setTrue: openAdd, setFalse: closeAdd, toggle } = useBoolean(false);

  return (
    <div>
      <button onClick={openAdd}>Thêm thành viên</button>
      {isAdding && <AddMemberForm onCancel={closeAdd} />}
    </div>
  );
}
```
- **Returns**: `{ value, setValue, setTrue, setFalse, toggle }`.
- All methods are memoized with stable references across renders.

---

### B. Persistent State: `useLocalStorage`
Synchronizes state with `window.localStorage` and listens to cross-tab storage events automatically.

```tsx
import { useLocalStorage } from 'usehooks-ts';

const [recentVenues, setRecentVenues] = useLocalStorage<string[]>('badminton_recent_venues', []);
```

- In `usehooks-ts` v3+, you can pass `{ initializeWithValue: false }` if you want to delay reading storage until mount to prevent hydration mismatch.

---

### C. Clipboard Interaction: `useCopyToClipboard`
Provides safe, modern clipboard access with fallback support.

```tsx
import { useBoolean, useCopyToClipboard, useTimeout } from 'usehooks-ts';

export function ShareBillButton({ billText }: { billText: string }) {
  const [, copy] = useCopyToClipboard();
  const { value: copied, setTrue: setCopied, setFalse: resetCopied } = useBoolean(false);

  // Auto-reset copied badge after 2 seconds
  useTimeout(resetCopied, copied ? 2000 : null);

  const handleCopy = async () => {
    const success = await copy(billText);
    if (success) {
      setCopied();
      toast.success('Đã sao chép hóa đơn!');
    }
  };

  return (
    <button onClick={handleCopy}>
      {copied ? 'Đã sao chép ✓' : 'Sao chép hóa đơn'}
    </button>
  );
}
```

---

### D. Safe Timers: `useTimeout` & `useInterval`
Declarative timers that automatically pause and clean up on component unmount or when delay is `null`.

```tsx
import { useTimeout } from 'usehooks-ts';

// Passing null pauses/cancels the timer; passing a number starts it
useTimeout(() => {
  console.log('Timer finished');
}, isRunning ? 3000 : null);
```

---

### E. Global & Window Events: `useEventListener`
Listens to native events on `window`, `document`, or specific element refs with automatic listener removal on unmount.

```tsx
import { useEventListener } from 'usehooks-ts';
import { useConnectionStore } from '@/stores/connection.store';

export function ConnectionWatcher() {
  const setOnline = useConnectionStore((s) => s.setOnline);
  const setOffline = useConnectionStore((s) => s.setOffline);

  // Listen to browser online/offline events safely
  useEventListener('online', setOnline);
  useEventListener('offline', setOffline);

  return null;
}
```

---

### F. Click Outside & Escapes: `useOnClickOutside`
Ideal for custom dropdowns, popovers, or floating search panels.

```tsx
import { useRef } from 'react';
import { useOnClickOutside } from 'usehooks-ts';

export function CustomDropdown({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, onClose);

  return <div ref={ref}>Dropdown Menu</div>;
}
```

---

### G. Responsive & Breakpoints: `useMediaQuery`
Detects media queries dynamically with automatic updates when window resizes.

```tsx
import { useMediaQuery } from 'usehooks-ts';

export function ResponsiveView() {
  // Matches Tailwind 'sm' breakpoint (640px)
  const isMobile = useMediaQuery('(max-width: 639px)');

  return isMobile ? <MobileDrawer /> : <DesktopSidebar />;
}
```

---

## 3. Quick Reference Matrix

| Need | Hook | Return Values / Signature |
| :--- | :--- | :--- |
| Modal/toggle state | `useBoolean(false)` | `{ value, setTrue, setFalse, toggle, setValue }` |
| Local persistence | `useLocalStorage(key, default)` | `[value, setValue]` |
| Copy text to clipboard | `useCopyToClipboard()` | `[copiedText, copyFn]` |
| Window/DOM events | `useEventListener(event, handler)` | `void` |
| Close on outside click | `useOnClickOutside(ref, handler)` | `void` |
| Media queries (mobile/desktop) | `useMediaQuery(query)` | `boolean` |
| SSR Client Check | `useIsClient()` | `boolean` |
| Declarative timer | `useTimeout(callback, delay \| null)` | `void` |
| Periodic interval | `useInterval(callback, delay \| null)` | `void` |
| Debounce value/input | `useDebounceValue(value, delay)` | `[debouncedValue, setDebouncedValue]` |

---

## 4. Checklist for Usage

1. [ ] Never read `localStorage` or `window` in component render without guarding with `useIsClient` or `typeof window !== 'undefined'`.
2. [ ] Replace manual `const [show, setShow] = useState(false)` with `useBoolean` whenever toggle/open/close controls are needed.
3. [ ] Use `useTimeout(fn, condition ? ms : null)` rather than raw `setTimeout` inside `useEffect` to prevent unmount memory leaks.
4. [ ] In `useEventListener`, ensure handler functions are memoized (`useCallback`) if they depend on changing component state.

