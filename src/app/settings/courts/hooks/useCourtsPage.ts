'use client';
import { useMutateDeleteCourt, useMutateSaveCourt, useQueryCourts } from '@/hooks/useQueryCourts';
import { useQueryGroups } from '@/hooks/useQueryGroups';
import { confirm } from '@/stores/confirm.store';
import { ConnectionState, useConnectionStore } from '@/stores/connection.store';
import type { TCourt } from '@/types/court.type';
import type { TGroup } from '@/types/group.type';
import { nowIso } from '@/utils/date';
import { useState } from 'react';
import { toast } from 'sonner';
import type { CourtDraft } from '../schemas/court.schema';
/** State và thao tác của trang Sân cầu lông. `page.tsx` chỉ lo hiển thị. */
export function useCourtsPage() {
  const cloudIsOnline: boolean = useConnectionStore((state: ConnectionState) => state.cloudStatus === 'online');
  const { data: courts, isPending: loadingCourts, error: courtsError } = useQueryCourts();
  const { data: groups, isPending: loadingGroups, error: groupsError } = useQueryGroups();
  const { mutateAsync: saveCourt } = useMutateSaveCourt();
  const { mutateAsync: deleteCourt } = useMutateDeleteCourt();
  const loading: boolean = loadingCourts || loadingGroups;
  const loadError = courtsError ?? groupsError;
  const loadErrorMessage = loadError
    ? `Không tải được danh sách sân: ${loadError instanceof Error ? loadError.message : String(loadError)}`
    : null;
  /** Mỗi lúc chỉ mở 1 form: `'new'` = form thêm sân, id = form sửa sân đó, null = không mở form nào. */
  const [formTarget, setFormTarget] = useState<'new' | string | null>(null);
  const creating: boolean = formTarget === 'new';
  const editingId: string | null = formTarget === 'new' ? null : formTarget;
  const disabled: boolean = !cloudIsOnline;
  function openCreating(): void {
    setFormTarget('new');
  }
  function openEditing(id: string): void {
    setFormTarget(id);
  }
  function closeForm(): void {
    setFormTarget(null);
  }
  function findDuplicate(name: string, exceptId?: string): TCourt | undefined {
    const key: string = name.trim().toLowerCase();
    return courts.find((v) => v.id !== exceptId && v.name.trim().toLowerCase() === key);
  }
  /** Các nhóm đang dùng sân này làm sân mặc định. */
  function groupsUsing(courtId: string): TGroup[] {
    return groups.filter((g) => g.default_court_id === courtId);
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
      created_at: now,
      updated_at: now,
    };
    try {
      await saveCourt(newCourt);
      closeForm();
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
    const updated: TCourt = { ...court, name, address: values.address.trim() };
    try {
      await saveCourt(updated);
      closeForm();
      toast.success(`Đã cập nhật sân "${name}"`);
      return null;
    } catch (err) {
      return `Lưu thất bại: ${err instanceof Error ? err.message : String(err)}`;
    }
  }
  async function handleDelete(court: TCourt): Promise<void> {
    const using: TGroup[] = groupsUsing(court.id);
    const usingNote: string =
      using.length > 0
        ? ` Nhóm ${using.map((g) => `"${g.name}"`).join(', ')} đang dùng sân này làm sân mặc định sẽ chuyển về "chưa chọn sân".`
        : '';
    const ok: boolean = await confirm({
      title: `Xóa sân "${court.name}"?`,
      description: `Sân sẽ bị xóa vĩnh viễn và không khôi phục được. Các buổi chơi đã lưu vẫn giữ nguyên tên sân.${usingNote}`,
      confirmLabel: 'Xóa sân',
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteCourt(court.id);
      if (editingId === court.id) closeForm();
      toast.success(`Đã xóa sân "${court.name}"`);
    } catch (err) {
      toast.error(`Xóa thất bại: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return {
    courts,
    cloudIsOnline,
    disabled,
    loading,
    loadErrorMessage,
    creating,
    editingId,
    openCreating,
    openEditing,
    closeForm,
    groupsUsing,
    handleAdd,
    handleSaveEdit,
    handleDelete,
  };
}
