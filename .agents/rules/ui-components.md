---
description: "Mandatory policy for shadcn/ui components in src/components/ui/"
---

# UI Components Policy (`src/components/ui/`)

- The `src/components/ui/` directory strictly contains base components installed and managed by **shadcn/ui**.
- **DO NOT DIRECTLY EDIT OR MODIFY** any files inside `src/components/ui/`.
- When customization (e.g., height, background, border, typography) or display fix is needed:
  1. Always customize from the calling parent component using targeted Tailwind CSS classes (e.g., use descendant selectors like `[&_select]:...` or `[&_input]:...` to target the inner element instead of overriding wrapper styles).
  2. Or create a custom wrapper / composite component outside of `src/components/ui/`.
