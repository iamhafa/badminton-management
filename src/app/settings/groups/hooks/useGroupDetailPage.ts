'use client';

import { useQueryCourts } from '@/hooks/useQueryCourts';
import { useMutateSaveGroup, useQueryGroups } from '@/hooks/useQueryGroups';
import { useQuerySessions } from '@/hooks/useQuerySessions';
import { confirm } from '@/stores/confirm.store';
import { ConnectionState, useConnectionStore } from '@/stores/connection.store';
import type { TGroup } from '@/types/group.types';
import type { TPlayer } from '@/types/player.types';
import { nowIso } from '@/utils/date';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { GroupDraft } from '../schemas/group.schema';

/** State và thao tác của trang chi tiết 1 nhóm (`/settings/groups/[id]`). `page.tsx` chỉ lo hiển thị. */
export function useGroupDetailPage() {
  const router = useRouter();
  const { id: groupId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const cloudOnline: boolean = useConnectionStore((state: ConnectionState) => state.cloudStatus === 'online');
  const { data: groups, isPending: groupsPending } = useQueryGroups();
  const { data: courts, isPending: courtsPending } = useQueryCourts();
  const { data: sessions, isPending: sessionsPending } = useQuerySessions();
  const { mutateAsync: saveGroup, isPending: saveGroupPending } = useMutateSaveGroup();

  const loading: boolean = groupsPending || courtsPending || sessionsPending || saveGroupPending;
  const group = useMemo(() => groups.find((g) => g.id === groupId), [groups, groupId]);

  const [isEditing, setIsEditing] = useState<boolean>(() => searchParams.get('edit') === '1');
  const disabled = !cloudOnline;

  function duplicateNameError(name: string, exceptId?: string): string | null {
    const key = name.trim().toLowerCase();
    const dup = groups.find((g) => g.id !== exceptId && g.name.trim().toLowerCase() === key);
    return dup ? `Nhóm "${name}" đã tồn tại.` : null;
  }

  async function handleUpdate(draft: GroupDraft): Promise<string | null> {
    if (!group) return 'Không tìm thấy nhóm';
    const dupError = duplicateNameError(draft.name, group.id);
    if (dupError) return dupError;
    const updated: TGroup = { ...group, ...draft, updatedAt: nowIso() };
    try {
      await saveGroup(updated);
      setIsEditing(false);
      toast.success(`Đã cập nhật thông tin nhóm "${draft.name}"`);
      return null;
    } catch (err) {
      return `Lưu thất bại: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  async function handleHide(): Promise<void> {
    if (!group) return;
    const ok: boolean = await confirm({
      title: `Ẩn nhóm "${group.name}"?`,
      description:
        'Nhóm sẽ không còn hiện khi tính tiền. Danh sách thành viên và lịch sử các buổi chơi của nhóm vẫn được giữ, bạn có thể khôi phục bất cứ lúc nào.',
      confirmLabel: 'Ẩn nhóm',
      destructive: true,
    });
    if (!ok) return;
    const updated: TGroup = { ...group, deletedAt: nowIso(), updatedAt: nowIso() };
    try {
      await saveGroup(updated);
      toast.success(`Đã ẩn nhóm "${group.name}"`);
      router.push('/settings/groups');
    } catch (err) {
      toast.error(`Ẩn thất bại: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async function handleSaveMembers(members: TPlayer[]): Promise<void> {
    if (!group) return;
    const updated: TGroup = { ...group, members, updatedAt: nowIso() };
    try {
      await saveGroup(updated);
      toast.success('Đã lưu danh sách thành viên');
    } catch (err) {
      toast.error(`Lưu thành viên thất bại: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  function courtName(id?: string): string | undefined {
    if (!id) return undefined;
    return courts.find((v) => v.id === id)?.name;
  }

  return {
    group,
    courts,
    sessions,
    cloudOnline,
    disabled,
    loading,
    isEditing,
    setIsEditing,
    courtName,
    handleUpdate,
    handleHide,
    handleSaveMembers,
  };
}
