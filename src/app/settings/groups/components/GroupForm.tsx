'use client';

import { FieldError } from '@/components/form/FieldError';
import { MoneyInput } from '@/components/form/MoneyInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import type { TCourt } from '@/types/court.types';
import { FEMALE_CAP_PRESETS } from '@/utils/format';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from 'cn';
import { useId } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { groupFormSchema, type GroupDraft } from '../schemas/group.schema';

interface GroupFormProps {
  initial: GroupDraft;
  courts: TCourt[];
  submitLabel: string;
  disabled?: boolean;
  /** Trả về thông báo lỗi để hiển thị (VD: trùng tên), hoặc null nếu lưu thành công. */
  onSubmit: (draft: GroupDraft) => Promise<string | null>;
  onCancel?: () => void;
}

export default function GroupForm({ initial, courts, submitLabel, disabled, onSubmit, onCancel }: GroupFormProps) {
  const uid = useId();
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isValid, isSubmitting },
  } = useForm<GroupDraft>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: initial,
    mode: 'onChange',
  });

  const submit = handleSubmit(async (values) => {
    const message = await onSubmit(values);
    if (message) setError('root.server', { message });
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${uid}-name`} className="text-xs font-semibold text-gray-600">
          Tên nhóm
        </Label>
        <Input id={`${uid}-name`} {...register('name')} autoFocus aria-invalid={!!errors.name} placeholder="VD: Vụt Cầu Lông" />
        <FieldError message={errors.name?.message} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${uid}-cap`} className="text-xs font-semibold text-gray-600">
            Mức trần ưu tiên nữ
          </Label>
          <Controller
            control={control}
            name="femaleCap"
            render={({ field }) => (
              <>
                <div className="relative">
                  <MoneyInput id={`${uid}-cap`} {...field} aria-invalid={!!errors.femaleCap} className="pr-16" />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    VNĐ/nữ
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {FEMALE_CAP_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => field.onChange(preset)}
                      className={cn(
                        'rounded px-2.5 py-0.5 text-xs font-semibold border transition-all',
                        field.value === preset
                          ? 'bg-[#fce7f3] border-[#f472b6] text-[#be185d]'
                          : 'bg-[#f1f5f9] border-transparent text-gray-600 hover:bg-gray-200',
                      )}
                    >
                      {preset / 1000}k
                    </button>
                  ))}
                </div>
              </>
            )}
          />
          <FieldError message={errors.femaleCap?.message} />
          <p className="text-[11px] text-gray-500">
            Mỗi bạn nữ trả tối đa số tiền này (chưa gồm tiền nước). Nếu chia đều vượt mức trần, phần còn thiếu do các bạn nam chia
            nhau.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${uid}-court`} className="text-xs font-semibold text-gray-600">
            Sân hay chơi (không bắt buộc)
          </Label>
          <NativeSelect id={`${uid}-court`} {...register('defaultCourtId')} className="w-full">
            <NativeSelectOption value="">Chưa chọn</NativeSelectOption>
            {courts.map((v) => (
              <NativeSelectOption key={v.id} value={v.id}>
                {v.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <p className="text-[11px] text-gray-500">Tự điền khi chọn nhóm này ở màn hình tính tiền.</p>
        </div>
      </div>

      <FieldError message={errors.root?.server?.message} />

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Hủy
          </Button>
        )}
        <Button type="submit" disabled={disabled || !isValid || isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
