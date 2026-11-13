---
name: react-hook-form
description: Use when building, refactoring, or validating forms with react-hook-form, zodResolver, Controller, or managing form state in React/Next.js.
---

# `react-hook-form` Best Practices & Patterns

`react-hook-form` provides performant, flexible, and extensible forms with minimal re-renders by leveraging uncontrolled components and ref subscriptions. This skill documents the core mental model, validation strategies, and integration patterns in our codebase.

---

## 1. Core Mental Model: Uncontrolled vs Controlled

```
Traditional Controlled Form (useState):
[ Keystroke ] ──> [ setState ] ──> [ Entire Form Re-renders ] (Slow on low-end mobile)

React Hook Form (register / Ref):
[ Keystroke ] ──> [ Native Input DOM ] ──> [ Zero Re-renders ] (Instant, 60fps)
```

1. **Uncontrolled First (`register`)**: Standard native elements (`<input>`, `<select>`, `<textarea>`) should always use `register`. They update DOM directly without triggering React render cycles.
2. **Controlled When Necessary (`Controller`)**: Custom UI components that don't expose a raw DOM input (e.g., custom numeric pickers, Base UI switches, `MoneyInput`, preset pills) use `<Controller />`.
3. **Selective Subscriptions (`formState`)**: `formState` uses a Proxy. **Only destructure what you actually read** (e.g., `{ errors, isSubmitting }`). Reading unused properties can trigger unnecessary renders.

---

## 2. Standard Form Architecture

In our codebase, forms follow a strict 4-part structure:

### 1. Colocated Zod Schema (`schemas/<entity>.schema.ts`)
Always infer the TypeScript type directly from the Zod schema:

```typescript
import { z } from 'zod';

export const courtFormSchema = z.object({
  name: z.string().trim().min(1, 'Tên sân không được để trống'),
  address: z.string().trim().optional(),
});

export type CourtDraft = z.infer<typeof courtFormSchema>;
```

### 2. Form Hook Initialization with `zodResolver`
Initialize `useForm` with explicit generic types and initial `defaultValues`:

```typescript
const uid = useId(); // React 19 stable a11y ID
const {
  register,
  control,
  handleSubmit,
  setError,
  formState: { errors, isSubmitting },
} = useForm<CourtDraft>({
  resolver: zodResolver(courtFormSchema),
  defaultValues: initial,
  mode: 'onChange', // Immediate validation feedback
});
```

---

## 3. Essential Integration Patterns

### Pattern A: Native Inputs with `register` & Accessibility (`aria-invalid`)
Bind standard input elements using object spreading and explicit accessible labeling:

```tsx
<div className="flex flex-col gap-1.5">
  <Label htmlFor={`${uid}-name`}>Tên sân</Label>
  <Input
    id={`${uid}-name`}
    {...register('name')}
    aria-invalid={!!errors.name}
    placeholder="VD: Sân Cầu Lông Cấp Cao"
  />
  <FieldError message={errors.name?.message} />
</div>
```

---

### Pattern B: Custom Components with `<Controller />`
When using composite widgets like `MoneyInput` or preset clickable buttons:

```tsx
<Controller
  control={control}
  name="femaleCap"
  render={({ field }) => (
    <>
      <MoneyInput
        id={`${uid}-cap`}
        {...field}
        aria-invalid={!!errors.femaleCap}
      />
      <div className="flex gap-1.5">
        {[40000, 50000, 60000].map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => field.onChange(preset)}
            className={field.value === preset ? 'active' : ''}
          >
            {preset / 1000}k
          </button>
        ))}
      </div>
    </>
  )}
/>
<FieldError message={errors.femaleCap?.message} />
```

---

### Pattern C: Server & Duplicate Name Errors (`setError('root.server')`)
Avoid storing server validation errors in local `useState`. Use React Hook Form's root error mechanism:

```typescript
const submit = handleSubmit(async (values) => {
  const errMessage = await onSubmit(values);
  if (errMessage) {
    // Set root server error without resetting form inputs
    setError('root.server', { message: errMessage });
  }
});

// Inside JSX:
<FieldError message={errors.root?.server?.message} />
```

---

### Pattern D: Dynamic Lists (`useFieldArray`)
When managing dynamic line items (such as court booking hours or extra expenses):

```typescript
const { fields, append, remove } = useFieldArray({
  control,
  name: 'items',
});

return (
  <div>
    {fields.map((item, index) => (
      <div key={item.id}>
        <Input {...register(`items.${index}.name` as const)} />
        <Button type="button" onClick={() => remove(index)}>Xóa</Button>
      </div>
    ))}
    <Button type="button" onClick={() => append({ name: '' })}>Thêm mục</Button>
  </div>
);
```

> [!TIP]
> Always use `item.id` as the React `key`, **never** the array index, because `useFieldArray` assigns persistent internal IDs for smooth animations and focus tracking.

---

## 4. Checklist for New Forms

1. [ ] Colocate validation schema in `schemas/<entity>.schema.ts`.
2. [ ] Always provide `defaultValues` to avoid uncontrolled-to-controlled React warnings.
3. [ ] Connect validation using `resolver: zodResolver(schema)`.
4. [ ] Pair every input with a stable `useId()` and `<Label htmlFor="...">` for accessibility.
5. [ ] Pass `aria-invalid={!!errors.fieldName}` to inputs so styles can highlight errors.
6. [ ] Display error messages through the shared `<FieldError message={...} />` component.
7. [ ] Pass `type="button"` on non-submit buttons inside `<form>` to prevent accidental form submission.

