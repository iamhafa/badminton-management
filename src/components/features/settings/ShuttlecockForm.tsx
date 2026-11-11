'use client';

import { FieldError } from '@/components/form/FieldError';
import { MoneyInput } from '@/components/form/MoneyInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { shuttlecockFormSchema, type ShuttlecockDraft } from '@/libs/form-schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Plus, X } from 'lucide-react';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { useRef } from 'react';
import { Controller, useForm, type Control, type FieldErrors } from 'react-hook-form';

const EMPTY_SHUTTLECOCK: ShuttlecockDraft = { name: '', tubePrice: 0 };

/** Trả về thông báo lỗi (VD: trùng tên) để hiện dưới ô tên, hoặc null nếu lưu thành công. */
export type ShuttlecockSubmit = (values: ShuttlecockDraft) => Promise<string | null>;

/** Ô giá 1 ống mặc định, có hậu tố "đ/ống". */
function TubePriceField({
  control,
  errors,
  label,
}: {
  control: Control<ShuttlecockDraft>;
  errors: FieldErrors<ShuttlecockDraft>;
  label: string;
}) {
  return (
    <div className="relative min-w-0 flex-1">
      <Controller
        control={control}
        name="tubePrice"
        render={({ field }) => (
          <MoneyInput
            {...field}
            aria-label={label}
            aria-invalid={!!errors.tubePrice}
            placeholder="Giá 1 ống mặc định"
            className="pr-14"
          />
        )}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">đ/ống</span>
    </div>
  );
}

/** Form thêm loại cầu mới (nằm phía trên danh sách). */
export function ShuttlecockAddForm({ disabled, onSubmit }: { disabled: boolean; onSubmit: ShuttlecockSubmit }) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ShuttlecockDraft>({
    resolver: zodResolver(shuttlecockFormSchema),
    defaultValues: EMPTY_SHUTTLECOCK,
    mode: 'onChange',
  });

  const submit = handleSubmit(async (values) => {
    const message = await onSubmit(values);
    if (message) setError('name', { message });
    else reset(EMPTY_SHUTTLECOCK);
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          {...register('name')}
          aria-label="Tên loại cầu mới"
          aria-invalid={!!errors.name}
          placeholder="Tên loại cầu (VD: Thành Công)"
          className="min-w-0 flex-1"
        />
        <TubePriceField control={control} errors={errors} label="Giá 1 ống mặc định của loại cầu mới" />
        <Button type="submit" disabled={disabled || !isValid || isSubmitting}>
          <Plus /> Thêm
        </Button>
      </div>
      <FieldError message={(errors.name ?? errors.tubePrice)?.message} />
    </form>
  );
}

/** Form sửa trực tiếp trên một dòng của danh sách. Enter để lưu, Escape để hủy. */
export function ShuttlecockEditForm({
  initial,
  disabled,
  onSubmit,
  onCancel,
}: {
  initial: ShuttlecockDraft;
  disabled: boolean;
  onSubmit: ShuttlecockSubmit;
  onCancel: () => void;
}) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ShuttlecockDraft>({
    resolver: zodResolver(shuttlecockFormSchema),
    defaultValues: initial,
    mode: 'onChange',
  });

  const formRef = useRef<HTMLFormElement>(null);
  useEscapeKey(formRef, onCancel);

  const submit = handleSubmit(async (values) => {
    const message = await onSubmit(values);
    if (message) setError('name', { message });
  });

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:flex-nowrap">
      <Input {...register('name')} autoFocus aria-label="Tên loại cầu" aria-invalid={!!errors.name} className="min-w-0 flex-1" />
      <TubePriceField control={control} errors={errors} label="Giá 1 ống mặc định" />
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        aria-label="Lưu"
        title="Lưu"
        disabled={disabled || !isValid || isSubmitting}
        className="text-primary"
      >
        <Check />
      </Button>
      <Button type="button" variant="ghost" size="icon" aria-label="Hủy" title="Hủy" onClick={onCancel}>
        <X />
      </Button>
      <FieldError message={(errors.name ?? errors.tubePrice)?.message} className="basis-full text-xs text-destructive" />
    </form>
  );
}
