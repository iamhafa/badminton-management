'use client';
import { FieldError } from '@/components/form/FieldError';
import { MoneyInput } from '@/components/form/MoneyInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatVND, SHUTTLES_PER_TUBE } from '@/utils/format';
import { zodResolver } from '@hookform/resolvers/zod';
import { useId } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { shuttlecockFormSchema, type ShuttlecockDraft } from '../schemas/shuttlecock.schema';
interface SettingsShuttlecockFormProps {
  initial: ShuttlecockDraft;
  submitLabel: string;
  disabled?: boolean;
  /** Trả về thông báo lỗi (VD: trùng tên) để hiện dưới ô tên, hoặc null nếu lưu thành công. */
  onSubmit: (values: ShuttlecockDraft) => Promise<string | null>;
  onCancel: () => void;
}
/** Form thêm/sửa loại cầu, hiện trong khung xanh khi bấm "Thêm loại cầu" hoặc nút sửa. Escape để hủy. */
export default function SettingsShuttlecockForm({
  initial,
  submitLabel,
  disabled,
  onSubmit,
  onCancel,
}: SettingsShuttlecockFormProps) {
  const uid = useId();
  const {
    register,
    control,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ShuttlecockDraft>({
    resolver: zodResolver(shuttlecockFormSchema),
    defaultValues: initial,
    mode: 'onChange',
  });
  const tubePrice: number = watch('tube_price');
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
            Tên loại cầu
          </Label>
          <Input id={`${uid}-name`} {...register('name')} autoFocus aria-invalid={!!errors.name} placeholder="VD: Thành Công" />
          <FieldError message={errors.name?.message} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${uid}-price`} className="text-xs font-semibold text-gray-600">
            Giá 1 ống ({SHUTTLES_PER_TUBE} quả)
          </Label>
          <div className="relative">
            <Controller
              control={control}
              name="tube_price"
              render={({ field }) => (
                <MoneyInput id={`${uid}-price`} {...field} aria-invalid={!!errors.tube_price} className="pr-14" />
              )}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              đ/ống
            </span>
          </div>
          {errors.tube_price ? (
            <FieldError message={errors.tube_price.message} />
          ) : (
            tubePrice > 0 && (
              <p className="text-[11px] text-gray-500">
                ≈ {formatVND(Math.round(tubePrice / SHUTTLES_PER_TUBE))}/quả. Khi tính tiền vẫn sửa được giá.
              </p>
            )
          )}
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
