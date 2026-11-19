'use client';

import { useQueryCourts } from '@/hooks/useQueryCourts';
import { useMutateDeleteGroup, useMutateSaveGroup, useQueryGroups } from '@/hooks/useQueryGroups';
import { useQuerySessions } from '@/hooks/useQuerySessions';
import { confirm } from '@/stores/confirm.store';
import { ConnectionState, useConnectionStore } from '@/stores/connection.store';
import type { TGroupSave } from '@/types/group.type';
import type { TMemberDraft } from '@/types/player.type';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { GroupDraft } from '../schemas/group.schema';
import { deleteGroupConfirmOptions } from '../utils/delete-group';

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
  const { mutateAsync: deleteGroup } = useMutateDeleteGroup();

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
    const updated: TGroupSave = {
      ...group,
      ...draft,
      default_court_id: draft.default_court_id || null, // form dùng '' cho "chưa chọn"
    };
    try {
      await saveGroup(updated);
      setIsEditing(false);
      toast.success(`Đã cập nhật thông tin nhóm "${draft.name}"`);
      return null;
    } catch (err) {
      return `Lưu thất bại: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  async function handleDelete(): Promise<void> {
    if (!group) return;
    const sessionCount: number = sessions.filter((s) => s.group_id === group.id).length;
    if (!(await confirm(deleteGroupConfirmOptions(group, sessionCount)))) return;
    try {
      await deleteGroup(group.id);
      toast.success(`Đã xóa nhóm "${group.name}"`);
      router.push('/settings/groups');
    } catch (err) {
      toast.error(`Xóa thất bại: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  async function handleSaveMembers(members: TMemberDraft[]): Promise<void> {
    if (!group) return;
    const updated: TGroupSave = { ...group, members };
    try {
      await saveGroup(updated);
      toast.success('Đã lưu danh sách thành viên');
    } catch (err) {
      toast.error(`Lưu thành viên thất bại: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  function courtName(id: string | null): string | undefined {
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
    handleDelete,
    handleSaveMembers,
  };
}
