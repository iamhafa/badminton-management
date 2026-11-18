'use client';
import {
  useMutateDeleteShuttlecock,
  useMutateSetDefaultShuttlecock,
  useMutateShuttlecock,
  useQueryShuttlecocks,
} from '@/hooks/useQueryShuttlecocks';
import { confirm } from '@/stores/confirm.store';
import { ConnectionState, useConnectionStore } from '@/stores/connection.store';
import type { TShuttlecock } from '@/types/shuttlecock.type';
import { nowIso } from '@/utils/date';
import { useState } from 'react';
import { toast } from 'sonner';
import type { ShuttlecockDraft } from '../schemas/shuttlecock.schema';
/** State và thao tác của trang Loại cầu. `page.tsx` chỉ lo hiển thị. */
export function useShuttlecocksPage() {
  const cloudOnline: boolean = useConnectionStore((state: ConnectionState) => state.cloudStatus === 'online');
  const { mutateAsync: saveShuttlecock } = useMutateShuttlecock();
  const { mutateAsync: setDefaultShuttlecock } = useMutateSetDefaultShuttlecock();
  const { mutateAsync: deleteShuttlecock } = useMutateDeleteShuttlecock();
  const { data, isPending: loading, error: loadError } = useQueryShuttlecocks();
  /** Loại mặc định luôn đứng đầu, các loại còn lại giữ thứ tự tạo. */
  const shuttlecocks: TShuttlecock[] = [...data].sort((a, b) => Number(b.is_default) - Number(a.is_default));
  const loadErrorMessage = loadError
    ? `Không tải được danh sách loại cầu: ${loadError instanceof Error ? loadError.message : String(loadError)}`
    : null;
  /** Mỗi lúc chỉ mở 1 form: `'new'` = form thêm loại cầu, id = form sửa loại đó, null = không mở form nào. */
  const [formTarget, setFormTarget] = useState<'new' | string | null>(null);
  const creating: boolean = formTarget === 'new';
  const editingId: string | null = formTarget === 'new' ? null : formTarget;
  const disabled = !cloudOnline;
  function openCreating(): void {
    setFormTarget('new');
  }
  function openEditing(id: string): void {
    setFormTarget(id);
  }
  function closeForm(): void {
    setFormTarget(null);
  }
  function findDuplicate(name: string, exceptId?: string): TShuttlecock | undefined {
    const key = name.trim().toLowerCase();
    return shuttlecocks.find((s) => s.id !== exceptId && s.name.trim().toLowerCase() === key);
  }
  async function handleAdd(values: ShuttlecockDraft): Promise<string | null> {
    const name = values.name.trim();
    if (findDuplicate(name)) {
      return `Loại cầu "${name}" đã có trong danh sách.`;
    }
    const now = nowIso();
    const newShuttlecock: TShuttlecock = {
      id: crypto.randomUUID(),
      name,
      tube_price: values.tube_price,
      is_default: false,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };
    try {
      await saveShuttlecock(newShuttlecock);
      closeForm();
      toast.success(`Đã thêm loại cầu "${name}"`);
      return null;
    } catch (err) {
      return `Lưu thất bại: ${err instanceof Error ? err.message : String(err)}`;
    }
  }
  async function handleSaveEdit(shuttlecock: TShuttlecock, values: ShuttlecockDraft): Promise<string | null> {
    const name = values.name.trim();
    if (findDuplicate(name, shuttlecock.id)) {
      return `Loại cầu "${name}" đã có trong danh sách.`;
    }
    const updated: TShuttlecock = { ...shuttlecock, name, tube_price: values.tube_price, updated_at: nowIso() };
    try {
      await saveShuttlecock(updated);
      closeForm();
      toast.success(`Đã cập nhật loại cầu "${name}"`);
      return null;
    } catch (err) {
      return `Lưu thất bại: ${err instanceof Error ? err.message : String(err)}`;
    }
  }
  async function handleDelete(shuttlecock: TShuttlecock): Promise<void> {
    const defaultNote: string = shuttlecock.is_default
      ? ' Đây đang là loại cầu mặc định, hãy đặt một loại khác làm mặc định sau khi xóa.'
      : '';
    const ok = await confirm({
      title: `Xóa loại cầu "${shuttlecock.name}"?`,
      description: `Loại cầu sẽ bị xóa vĩnh viễn và không khôi phục được. Các buổi chơi đã lưu vẫn giữ nguyên tên và giá cầu.${defaultNote}`,
      confirmLabel: 'Xóa loại cầu',
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteShuttlecock(shuttlecock.id);
      if (editingId === shuttlecock.id) closeForm();
      toast.success(`Đã xóa loại cầu "${shuttlecock.name}"`);
    } catch (err) {
      toast.error(`Xóa thất bại: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  async function handleSetDefault(shuttlecock: TShuttlecock): Promise<void> {
    if (shuttlecock.is_default) return;
    try {
      await setDefaultShuttlecock(shuttlecock.id);
      toast.success(`Đã đặt "${shuttlecock.name}" làm loại cầu mặc định`);
    } catch (err) {
      toast.error(`Đặt mặc định thất bại: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return {
    shuttlecocks,
    cloudOnline,
    disabled,
    loading,
    loadErrorMessage,
    creating,
    editingId,
    openCreating,
    openEditing,
    closeForm,
    handleAdd,
    handleSaveEdit,
    handleDelete,
    handleSetDefault,
  };
}
