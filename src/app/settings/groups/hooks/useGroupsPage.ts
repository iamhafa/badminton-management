'use client';

import { useQueryCourts } from '@/hooks/useQueryCourts';
import { useMutateDeleteGroup, useMutateSaveGroup, useQueryGroups } from '@/hooks/useQueryGroups';
import { useQuerySessions } from '@/hooks/useQuerySessions';
import { confirm } from '@/stores/confirm.store';
import { ConnectionState, useConnectionStore } from '@/stores/connection.store';
import type { TGroup, TGroupSave } from '@/types/group.type';
import { nowIso } from '@/utils/date';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useBoolean } from 'usehooks-ts';
import type { GroupDraft } from '../schemas/group.schema';
import { deleteGroupConfirmOptions } from '../utils/delete-group';

/** State và thao tác của trang danh sách nhóm. `page.tsx` chỉ lo hiển thị. */
export function useGroupsPage() {
  const router = useRouter();
  const cloudOnline: boolean = useConnectionStore((state: ConnectionState) => state.cloudStatus === 'online');
  const { data: groups, isPending: groupIsPending, error: groupError } = useQueryGroups();
  const { data: courts, isPending: courtIsPending, error: courtError } = useQueryCourts();
  const { data: sessions, isPending: sessionIsPending, error: sessionError } = useQuerySessions();
  const { mutateAsync: saveGroup, isPending: saveGroupPending } = useMutateSaveGroup();
  const { mutateAsync: deleteGroup } = useMutateDeleteGroup();

  const loading: boolean = groupIsPending || courtIsPending || sessionIsPending || saveGroupPending;
  const loadError = groupError ?? courtError ?? sessionError;
  const loadErrorMessage = loadError
    ? `Không tải được danh sách nhóm: ${loadError instanceof Error ? loadError.message : String(loadError)}`
    : null;
  const { value: creating, setTrue: openCreating, setFalse: closeCreating } = useBoolean(false);
  const disabled: boolean = !cloudOnline;

  function duplicateNameError(name: string, exceptId?: string): string | null {
    const key = name.trim().toLowerCase();
    const dup = groups.find((g: TGroup) => g.id !== exceptId && g.name.trim().toLowerCase() === key);
    return dup ? `Nhóm "${name}" đã tồn tại.` : null;
  }

  async function handleCreate(draft: GroupDraft): Promise<string | null> {
    const dupError = duplicateNameError(draft.name);
    if (dupError) return dupError;
    const now = nowIso();
    const group: TGroupSave = {
      id: crypto.randomUUID(),
      ...draft,
      default_court_id: draft.default_court_id || null, // form dùng '' cho "chưa chọn"
      members: [],
      created_at: now,
      updated_at: now,
    };
    try {
      await saveGroup(group);
      closeCreating();
      toast.success(`Đã tạo nhóm "${group.name}"`);
      router.push(`/settings/groups/${group.id}`);
      return null;
    } catch (err) {
      return `Lưu thất bại: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  async function handleDelete(group: TGroup): Promise<void> {
    const sessionCount: number = sessions.filter((s) => s.group_id === group.id).length;
    if (!(await confirm(deleteGroupConfirmOptions(group, sessionCount)))) return;
    try {
      await deleteGroup(group.id);
      toast.success(`Đã xóa nhóm "${group.name}"`);
    } catch (err) {
      toast.error(`Xóa thất bại: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  function courtName(id: string | null): string | undefined {
    return courts.find((court) => court.id === id)?.name;
  }

  return {
    groups,
    courts,
    sessions,
    cloudOnline,
    disabled,
    loading,
    loadErrorMessage,
    creating,
    openCreating,
    closeCreating,
    courtName,
    handleCreate,
    handleDelete,
  };
}
