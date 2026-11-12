'use client';

import { ROLE_LABELS } from '@/components/common/RoleBadge';
import { FieldError } from '@/components/form/FieldError';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Plus, X } from 'lucide-react';
import { useForm, type UseFormRegister } from 'react-hook-form';
import { memberFormSchema, type MemberDraft } from './schemas/member.schema';

const EMPTY_MEMBER: MemberDraft = { name: '', gender: 'MALE', role: '' };

/** Trả về thông báo lỗi (VD: trùng tên, lưu thất bại) để hiện dưới ô tên, hoặc null nếu thành công. */
export type MemberSubmit = (values: MemberDraft) => Promise<string | null>;

function GenderSelect({ register }: { register: UseFormRegister<MemberDraft> }) {
  return (
    <NativeSelect {...register('gender')} aria-label="Giới tính">
      <NativeSelectOption value="MALE">Nam</NativeSelectOption>
      <NativeSelectOption value="FEMALE">Nữ</NativeSelectOption>
    </NativeSelect>
  );
}

/** Form thêm thành viên mới (nằm phía trên danh sách). Giới tính được giữ lại sau khi thêm. */
export function MemberAddForm({ disabled, onSubmit }: { disabled: boolean; onSubmit: MemberSubmit }) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isValid, isSubmitting },
  } = useForm<MemberDraft>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: EMPTY_MEMBER,
    mode: 'onChange',
  });

  const submit = handleSubmit(async (values) => {
    const message = await onSubmit(values);
    if (message) setError('name', { message });
    else reset({ ...EMPTY_MEMBER, gender: values.gender });
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          {...register('name')}
          aria-label="Tên thành viên mới"
          aria-invalid={!!errors.name}
          placeholder="Tên thành viên"
          className="min-w-0 flex-1"
        />
        <div className="flex gap-2">
          <GenderSelect register={register} />
          <Button type="submit" disabled={disabled || !isValid || isSubmitting}>
            <Plus /> Thêm
          </Button>
        </div>
      </div>
      <FieldError message={errors.name?.message} />
    </form>
  );
}

/** Form sửa trực tiếp trên một dòng của danh sách (tên, giới tính, vai trò). Enter để lưu, Escape để hủy. */
export function MemberEditForm({
  initial,
  disabled,
  onSubmit,
  onCancel,
}: {
  initial: MemberDraft;
  disabled: boolean;
  onSubmit: MemberSubmit;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isValid, isSubmitting },
  } = useForm<MemberDraft>({ resolver: zodResolver(memberFormSchema), defaultValues: initial, mode: 'onChange' });

  const submit = handleSubmit(async (values) => {
    const message = await onSubmit(values);
    if (message) setError('name', { message });
  });

  return (
    <form onSubmit={submit} noValidate className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
      <Input
        {...register('name')}
        autoFocus
        aria-label="Tên thành viên"
        aria-invalid={!!errors.name}
        placeholder="Tên thành viên"
        className="min-w-0 flex-1"
      />
      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        <GenderSelect register={register} />
        <NativeSelect {...register('role')} aria-label="Vai trò" className="flex-1 sm:flex-none">
          <NativeSelectOption value="">Thành viên</NativeSelectOption>
          <NativeSelectOption value="LEADER">{ROLE_LABELS.LEADER}</NativeSelectOption>
          <NativeSelectOption value="VICE_LEADER">{ROLE_LABELS.VICE_LEADER}</NativeSelectOption>
        </NativeSelect>
        <div className="flex items-center gap-1 shrink-0 ml-auto sm:ml-0">
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            aria-label="Lưu"
            title="Lưu"
            disabled={disabled || !isValid || isSubmitting}
            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 size-8"
          >
            <Check className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Hủy"
            title="Hủy"
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground size-8"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
      <FieldError message={errors.name?.message} className="basis-full text-xs text-destructive" />
    </form>
  );
}
