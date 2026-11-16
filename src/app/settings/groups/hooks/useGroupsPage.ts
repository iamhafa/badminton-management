'use client';

import { useQueryCourts } from '@/hooks/useQueryCourts';
import { useMutateSaveGroup, useQueryGroups } from '@/hooks/useQueryGroups';
import { useQuerySessions } from '@/hooks/useQuerySessions';
import { confirm } from '@/stores/confirm.store';
import { ConnectionState, useConnectionStore } from '@/stores/connection.store';
import type { TGroup } from '@/types/group.types';
import { nowIso } from '@/utils/date';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useBoolean } from 'usehooks-ts';
import type { GroupDraft } from '../schemas/group.schema';

/** State và thao tác của trang danh sách nhóm. `page.tsx` chỉ lo hiển thị. */
export function useGroupsPage() {
  const router = useRouter();
  const cloudOnline: boolean = useConnectionStore((state: ConnectionState) => state.cloudStatus === 'online');
  const { data: groups, isPending: groupIsPending, error: groupError } = useQueryGroups();
  const { data: courts, isPending: courtIsPending, error: courtError } = useQueryCourts();
  const { data: sessions, isPending: sessionIsPending, error: sessionError } = useQuerySessions();
  const { mutateAsync: saveGroup, isPending: saveGroupPending } = useMutateSaveGroup();

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
    const group: TGroup = {
      id: crypto.randomUUID(),
      ...draft,
      members: [],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
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

  async function handleHide(group: TGroup): Promise<void> {
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
    } catch (err) {
      toast.error(`Ẩn thất bại: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  function courtName(id: string): string | undefined {
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
    handleHide,
  };
}
