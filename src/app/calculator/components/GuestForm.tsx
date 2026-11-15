'use client';

import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import type { Gender } from '@/types/player.types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { guestFormSchema, type GuestDraft } from '../schemas/guest.schema';

const EMPTY_GUEST: GuestDraft = { name: '', gender: 'MALE' };

interface GuestFormProps {
  onAdd: (name: string, gender: Gender) => void;
  disabled?: boolean;
}

/** Form thêm người chơi vãng lai: bắt buộc nhập tên. Giới tính được giữ lại sau khi thêm. */
export default function GuestForm({ onAdd, disabled }: GuestFormProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { isValid },
  } = useForm<GuestDraft>({
    resolver: zodResolver(guestFormSchema),
    defaultValues: EMPTY_GUEST,
    mode: 'onChange',
  });

  const submit = handleSubmit((values) => {
    if (disabled) return;
    onAdd(values.name.trim(), values.gender);
    reset({ name: '', gender: values.gender });
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col sm:flex-row gap-2">
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <Input
            {...field}
            value={field.value ?? ''}
            disabled={disabled}
            placeholder={disabled ? 'Chọn nhóm ở Bước 1 trước khi thêm vãng lai' : 'Nhập tên vãng lai'}
            aria-label="Tên vãng lai"
            aria-required="true"
            className="h-10 bg-white border-gray-200 text-sm font-medium flex-1 rounded-lg disabled:bg-gray-50 disabled:text-gray-400"
          />
        )}
      />
      <div className="flex gap-2 shrink-0">
        <Controller
          control={control}
          name="gender"
          render={({ field }) => (
            <NativeSelect
              {...field}
              value={field.value ?? 'MALE'}
              disabled={disabled}
              aria-label="Giới tính vãng lai"
              className="[&_select]:h-10 [&_select]:bg-white [&_select]:border-gray-200 [&_select]:text-xs [&_select]:font-semibold [&_select]:rounded-lg"
            >
              <NativeSelectOption value="MALE">Nam (Vãng lai)</NativeSelectOption>
              <NativeSelectOption value="FEMALE">Nữ (Vãng lai)</NativeSelectOption>
            </NativeSelect>
          )}
        />
        <button
          type="submit"
          disabled={disabled || !isValid}
          title={disabled ? 'Vui lòng chọn nhóm trước' : isValid ? undefined : 'Nhập tên vãng lai trước khi thêm'}
          className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#ea580c] hover:bg-[#c2410c] px-4 text-xs font-bold text-white shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#ea580c]"
        >
          <Plus className="size-4" />
          <span>Thêm vãng lai</span>
        </button>
      </div>
    </form>
  );
}
