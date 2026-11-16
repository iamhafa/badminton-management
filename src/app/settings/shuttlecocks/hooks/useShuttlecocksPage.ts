'use client';

import { useMutateSetDefaultShuttlecock, useMutateShuttlecock, useQueryShuttlecocks } from '@/hooks/useQueryShuttlecocks';
import { confirm } from '@/stores/confirm.store';
import { ConnectionState, useConnectionStore } from '@/stores/connection.store';
import type { TShuttlecock } from '@/types/shuttlecock.types';
import { nowIso } from '@/utils/date';
import { useState } from 'react';
import { toast } from 'sonner';
import type { ShuttlecockDraft } from '../schemas/shuttlecock.schema';

/** State và thao tác của trang Loại cầu. `page.tsx` chỉ lo hiển thị. */
export function useShuttlecocksPage() {
  const cloudOnline: boolean = useConnectionStore((state: ConnectionState) => state.cloudStatus === 'online');
  const { mutateAsync: saveShuttlecock } = useMutateShuttlecock();
  const { mutateAsync: setDefaultShuttlecock } = useMutateSetDefaultShuttlecock();
  const [editingId, setEditingId] = useState<string | null>(null);
  const { data: shuttlecocks, isPending: loading, error: loadError } = useQueryShuttlecocks();

  const loadErrorMessage = loadError
    ? `Không tải được danh sách loại cầu: ${loadError instanceof Error ? loadError.message : String(loadError)}`
    : null;
  const disabled = !cloudOnline;

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
      tubePrice: values.tubePrice,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    try {
      await saveShuttlecock(newShuttlecock);
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
    const updated: TShuttlecock = { ...shuttlecock, name, tubePrice: values.tubePrice, updatedAt: nowIso() };
    try {
      await saveShuttlecock(updated);
      setEditingId(null);
      toast.success(`Đã cập nhật loại cầu "${name}"`);
      return null;
    } catch (err) {
      return `Lưu thất bại: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  async function handleHide(shuttlecock: TShuttlecock): Promise<void> {
    const ok = await confirm({
      title: `Ẩn loại cầu "${shuttlecock.name}"?`,
      description:
        'Loại cầu sẽ không còn hiện khi tính tiền. Lịch sử các buổi đã chơi dùng loại cầu này vẫn giữ nguyên, và bạn có thể khôi phục bất cứ lúc nào.',
      confirmLabel: 'Ẩn loại cầu',
      destructive: true,
    });
    if (!ok) return;
    const updated: TShuttlecock = { ...shuttlecock, deletedAt: nowIso(), updatedAt: nowIso() };
    try {
      await saveShuttlecock(updated);
      toast.success(`Đã ẩn loại cầu "${shuttlecock.name}"`);
    } catch (err) {
      toast.error(`Ẩn thất bại: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async function handleSetDefault(shuttlecock: TShuttlecock): Promise<void> {
    if (shuttlecock.isDefault) return;
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
    editingId,
    setEditingId,
    handleAdd,
    handleSaveEdit,
    handleHide,
    handleSetDefault,
  };
}
