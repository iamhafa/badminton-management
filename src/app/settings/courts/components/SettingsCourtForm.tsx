'use client';
import { FieldError } from '@/components/form/FieldError';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { zodResolver } from '@hookform/resolvers/zod';
import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { courtFormSchema, type CourtDraft } from '../schemas/court.schema';
interface SettingsCourtFormProps {
  initial: CourtDraft;
  submitLabel: string;
  disabled?: boolean;
  /** Trả về thông báo lỗi (VD: trùng tên) để hiện dưới ô tên, hoặc null nếu lưu thành công. */
  onSubmit: (values: CourtDraft) => Promise<string | null>;
  onCancel: () => void;
}
/** Form thêm/sửa sân, hiện trong khung xanh khi bấm "Thêm sân" hoặc nút sửa. Escape để hủy. */
export default function SettingsCourtForm({ initial, submitLabel, disabled, onSubmit, onCancel }: SettingsCourtFormProps) {
  const uid = useId();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isValid, isSubmitting },
  } = useForm<CourtDraft>({ resolver: zodResolver(courtFormSchema), defaultValues: initial, mode: 'onChange' });
  const submit = handleSubmit(async (values) => {
    const message = await onSubmit(values);
    if (message) setError('name', { message });
  });
  return (
    <form
      onSubmit={submit}
      onKeyDown={(e) => e.key === 'Escape' && onCancel()}
      noValidate
      className="flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50/40 p-3"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${uid}-name`} className="text-xs font-semibold text-gray-600">
            Tên sân
          </Label>
          <Input id={`${uid}-name`} {...register('name')} autoFocus aria-invalid={!!errors.name} placeholder="VD: Sân Mỹ Đình" />
          <FieldError message={errors.name?.message} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${uid}-address`} className="text-xs font-semibold text-gray-600">
            Địa chỉ (không bắt buộc)
          </Label>
          <Input id={`${uid}-address`} {...register('address')} placeholder="VD: đường Lê Đức Thọ, Từ Liêm" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" disabled={disabled || !isValid || isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
