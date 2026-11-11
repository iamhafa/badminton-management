'use client';

import { FieldError } from '@/components/form/FieldError';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Plus, X } from 'lucide-react';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { courtFormSchema, type CourtDraft } from './schema/court.schema';

const EMPTY_COURT: CourtDraft = { name: '', address: '' };

/** Trả về thông báo lỗi (VD: trùng tên) để hiện dưới ô tên, hoặc null nếu lưu thành công. */
export type CourtSubmit = (values: CourtDraft) => Promise<string | null>;

/** Form thêm sân mới (nằm phía trên danh sách). */
export function CourtAddForm({ disabled, onSubmit }: { disabled: boolean; onSubmit: CourtSubmit }) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isValid, isSubmitting },
  } = useForm<CourtDraft>({ resolver: zodResolver(courtFormSchema), defaultValues: EMPTY_COURT, mode: 'onChange' });

  const submit = handleSubmit(async (values) => {
    const message = await onSubmit(values);
    if (message) setError('name', { message });
    else reset(EMPTY_COURT);
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          {...register('name')}
          aria-label="Tên sân mới"
          aria-invalid={!!errors.name}
          placeholder="Tên sân (VD: Sân Mỹ Đình)"
          className="min-w-0 flex-1"
        />
        <Input
          {...register('address')}
          aria-label="Địa chỉ sân mới"
          placeholder="Địa chỉ (không bắt buộc)"
          className="min-w-0 flex-1"
        />
        <Button type="submit" disabled={disabled || !isValid || isSubmitting}>
          <Plus /> Thêm sân
        </Button>
      </div>
      <FieldError message={errors.name?.message} />
    </form>
  );
}

/** Form sửa trực tiếp trên một dòng của danh sách. Enter để lưu, Escape để hủy. */
export function CourtEditForm({
  initial,
  disabled,
  onSubmit,
  onCancel,
}: {
  initial: CourtDraft;
  disabled: boolean;
  onSubmit: CourtSubmit;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isValid, isSubmitting },
  } = useForm<CourtDraft>({ resolver: zodResolver(courtFormSchema), defaultValues: initial, mode: 'onChange' });

  const formRef = useRef<HTMLFormElement>(null);
  useEscapeKey(formRef, onCancel);

  const submit = handleSubmit(async (values) => {
    const message = await onSubmit(values);
    if (message) setError('name', { message });
  });

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:flex-nowrap">
      <Input {...register('name')} autoFocus aria-label="Tên sân" aria-invalid={!!errors.name} className="min-w-0 flex-1" />
      <Input {...register('address')} aria-label="Địa chỉ sân" placeholder="Địa chỉ" className="min-w-0 flex-1" />
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
      <FieldError message={errors.name?.message} className="basis-full text-xs text-destructive" />
    </form>
  );
}
