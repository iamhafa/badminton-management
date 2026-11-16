'use client';

import { useMutateSaveCourt, useQueryCourts } from '@/hooks/useQueryCourts';
import { useQueryGroups } from '@/hooks/useQueryGroups';
import { confirm } from '@/stores/confirm.store';
import { ConnectionState, useConnectionStore } from '@/stores/connection.store';
import type { TCourt } from '@/types/court.types';
import type { TGroup } from '@/types/group.types';
import { nowIso } from '@/utils/date';
import { useState } from 'react';
import { toast } from 'sonner';
import type { CourtDraft } from '../schemas/court.schema';

/** State và thao tác của trang Sân cầu lông. `page.tsx` chỉ lo hiển thị. */
export function useCourtsPage() {
  const cloudIsOnline: boolean = useConnectionStore((state: ConnectionState) => state.cloudStatus === 'online');
  const { data: courts, isPending: loadingCourts, error: courtsError } = useQueryCourts();
  const { data: groups, isPending: loadingGroups, error: groupsError } = useQueryGroups();
  const { mutateAsync: saveCourt, isPending: savingCourt } = useMutateSaveCourt();

  const loading: boolean = loadingCourts || loadingGroups || savingCourt;
  const loadError = courtsError ?? groupsError;
  const loadErrorMessage = loadError
    ? `Không tải được danh sách sân: ${loadError instanceof Error ? loadError.message : String(loadError)}`
    : null;
  const [editingId, setEditingId] = useState<string | null>(null);
  const disabled: boolean = !cloudIsOnline;

  function findDuplicate(name: string, exceptId?: string): TCourt | undefined {
    const key: string = name.trim().toLowerCase();
    return courts.find((v) => v.id !== exceptId && v.name.trim().toLowerCase() === key);
  }

  /** Các nhóm đang dùng sân này làm sân mặc định. */
  function groupsUsing(courtId: string): TGroup[] {
    return groups.filter((g) => g.defaultCourtId === courtId);
  }

  async function handleAdd(values: CourtDraft): Promise<string | null> {
    const name: string = values.name.trim();

    if (findDuplicate(name)) {
      return `Sân "${name}" đã có trong danh sách.`;
    }

    const now: string = nowIso();
    const newCourt: TCourt = {
      id: crypto.randomUUID(),
      name,
      address: values.address.trim(),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    try {
      await saveCourt(newCourt);
      toast.success(`Đã thêm sân "${name}"`);
      return null;
    } catch (err) {
      return `Lưu thất bại: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  async function handleSaveEdit(court: TCourt, values: CourtDraft): Promise<string | null> {
    const name: string = values.name.trim();

    if (findDuplicate(name, court.id)) {
      return `Sân "${name}" đã có trong danh sách.`;
    }

    const updated: TCourt = { ...court, name, address: values.address.trim(), updatedAt: nowIso() };
    try {
      await saveCourt(updated);
      setEditingId(null);
      toast.success(`Đã cập nhật sân "${name}"`);
      return null;
    } catch (err) {
      return `Lưu thất bại: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  async function handleHide(court: TCourt): Promise<void> {
    const using: TGroup[] = groupsUsing(court.id);
    const usingNote: string =
      using.length > 0 ? ` Sân đang là sân mặc định của nhóm ${using.map((g) => `"${g.name}"`).join(', ')}.` : '';
    const ok: boolean = await confirm({
      title: `Ẩn sân "${court.name}"?`,
      description: `Sân sẽ không còn hiện khi tính tiền. Lịch sử các buổi đã chơi ở sân này vẫn giữ nguyên, và bạn có thể khôi phục sân bất cứ lúc nào.${usingNote}`,
      confirmLabel: 'Ẩn sân',
      destructive: true,
    });
    if (!ok) return;
    const updated: TCourt = { ...court, deletedAt: nowIso(), updatedAt: nowIso() };
    try {
      await saveCourt(updated);
      toast.success(`Đã ẩn sân "${court.name}"`);
    } catch (err) {
      toast.error(`Ẩn thất bại: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return {
    courts,
    cloudIsOnline,
    disabled,
    loading,
    loadErrorMessage,
    editingId,
    setEditingId,
    groupsUsing,
    handleAdd,
    handleSaveEdit,
    handleHide,
  };
}
