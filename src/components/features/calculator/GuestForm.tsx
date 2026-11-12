'use client';

import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import type { Gender } from '@/types/player.types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { guestFormSchema, type GuestDraft } from './schemas/guest.schema';

const EMPTY_GUEST: GuestDraft = { name: '', gender: 'MALE' };

/** Form thêm người chơi vãng lai: bắt buộc nhập tên. Giới tính được giữ lại sau khi thêm. */
export default function GuestForm({ onAdd }: { onAdd: (name: string, gender: Gender) => void }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isValid },
  } = useForm<GuestDraft>({
    resolver: zodResolver(guestFormSchema),
    defaultValues: EMPTY_GUEST,
    mode: 'onChange',
  });

  const submit = handleSubmit((values) => {
    onAdd(values.name, values.gender);
    reset({ ...EMPTY_GUEST, gender: values.gender });
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col sm:flex-row gap-2">
      <Input
        {...register('name')}
        placeholder="Nhập tên vãng lai"
        aria-label="Tên vãng lai"
        aria-required="true"
        className="h-10 bg-white border-gray-200 text-sm font-medium flex-1 rounded-lg"
      />
      <div className="flex gap-2 shrink-0">
        <NativeSelect
          {...register('gender')}
          aria-label="Giới tính vãng lai"
          className="[&_select]:h-10 [&_select]:bg-white [&_select]:border-gray-200 [&_select]:text-xs [&_select]:font-semibold [&_select]:rounded-lg"
        >
          <NativeSelectOption value="MALE">Nam (Vãng lai)</NativeSelectOption>
          <NativeSelectOption value="FEMALE">Nữ (Vãng lai)</NativeSelectOption>
        </NativeSelect>
        <button
          type="submit"
          disabled={!isValid}
          title={isValid ? undefined : 'Nhập tên vãng lai trước khi thêm'}
          className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#ea580c] hover:bg-[#c2410c] px-4 text-xs font-bold text-white shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#ea580c]"
        >
          <Plus className="size-4" />
          <span>Thêm vãng lai</span>
        </button>
      </div>
    </form>
  );
}
