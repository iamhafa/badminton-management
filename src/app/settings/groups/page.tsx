'use client';

import GroupForm from '@/components/features/settings/GroupForm';
import RosterManager from '@/components/features/settings/RosterManager';
import type { GroupDraft } from '@/components/features/settings/schemas/group.schema';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConnectionState, useConnectionStore } from '@/stores/connection.store';
import { confirm } from '@/stores/confirm.store';
import LoadingState from '@/components/common/LoadingState';
import { useCourts } from '@/hooks/useQueryCourts';
import { useGroups, useSaveGroup } from '@/hooks/useQueryGroups';
import { useSessions } from '@/hooks/useQuerySessions';
import type { TGroup } from '@/types/group.types';
import type { TPlayer } from '@/types/player.types';
import { nowIso } from '@/utils/date';
import { formatVND } from '@/utils/format';
import { cn } from 'cn';
import { ChevronDown, EyeOff, MapPin, Pencil, Plus, RotateCcw, Users, Venus } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useBoolean } from 'usehooks-ts';

const NEW_GROUP_DRAFT: GroupDraft = { name: '', femaleCap: 50000, defaultCourtId: '' };

export default function GroupsManager() {
  const cloudOnline: boolean = useConnectionStore((state: ConnectionState) => state.cloudStatus === 'online');
  const groupsQuery = useGroups();
  const courtsQuery = useCourts();
  const sessionsQuery = useSessions();
  const saveGroup = useSaveGroup();
  const groups = groupsQuery.data;
  const courts = courtsQuery.data;
  const sessions = sessionsQuery.data;
  const loading = groupsQuery.isPending || courtsQuery.isPending || sessionsQuery.isPending;
  const loadError = groupsQuery.error ?? courtsQuery.error ?? sessionsQuery.error;
  const loadErrorMessage = loadError
    ? `Không tải được danh sách nhóm: ${loadError instanceof Error ? loadError.message : String(loadError)}`
    : null;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [membersOpenId, setMembersOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { value: creating, setTrue: openCreating, setFalse: closeCreating } = useBoolean(false);

  const activeGroups = useMemo(() => groups?.filter((g) => !g.deletedAt) ?? [], [groups]);
  const hiddenGroups = useMemo(() => groups?.filter((g) => g.deletedAt) ?? [], [groups]);
  const activeCourts = useMemo(() => courts?.filter((c) => !c.deletedAt) ?? [], [courts]);
  const disabled = !cloudOnline;

  function duplicateNameError(name: string, exceptId?: string): string | null {
    const key = name.trim().toLowerCase();
    const dup = activeGroups.find((g) => g.id !== exceptId && g.name.trim().toLowerCase() === key);
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
      await saveGroup.mutateAsync(group);
      closeCreating();
      setMembersOpenId(group.id);
      toast.success(`Đã tạo nhóm "${group.name}"`);
      return null;
    } catch (err) {
      return `Lưu thất bại: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  async function handleUpdate(group: TGroup, draft: GroupDraft): Promise<string | null> {
    const dupError = duplicateNameError(draft.name, group.id);
    if (dupError) return dupError;
    const updated: TGroup = { ...group, ...draft, updatedAt: nowIso() };
    try {
      await saveGroup.mutateAsync(updated);
      setEditingId(null);
      toast.success(`Đã cập nhật nhóm "${draft.name}"`);
      return null;
    } catch (err) {
      return `Lưu thất bại: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  async function handleSaveMembers(group: TGroup, members: TPlayer[]): Promise<void> {
    const updated: TGroup = { ...group, members, updatedAt: nowIso() };
    try {
      await saveGroup.mutateAsync(updated);
      toast.success('Đã lưu danh sách thành viên');
    } catch (err) {
      toast.error(`Lưu thành viên thất bại: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async function handleHide(group: TGroup): Promise<void> {
    const ok = await confirm({
      title: `Ẩn nhóm "${group.name}"?`,
      description:
        'Nhóm sẽ không còn hiện khi tính tiền. Danh sách thành viên và lịch sử các buổi chơi của nhóm vẫn được giữ, bạn có thể khôi phục bất cứ lúc nào.',
      confirmLabel: 'Ẩn nhóm',
      destructive: true,
    });
    if (!ok) return;
    const updated: TGroup = { ...group, deletedAt: nowIso(), updatedAt: nowIso() };
    try {
      await saveGroup.mutateAsync(updated);
      if (membersOpenId === group.id) setMembersOpenId(null);
      toast.success(`Đã ẩn nhóm "${group.name}"`);
    } catch (err) {
      toast.error(`Ẩn thất bại: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async function handleRestore(group: TGroup): Promise<void> {
    const dupError = duplicateNameError(group.name, group.id);
    if (dupError) {
      setError(`${dupError} Đổi tên nhóm đó trước khi khôi phục.`);
      return;
    }
    setError(null);
    const updated: TGroup = { ...group, deletedAt: null, updatedAt: nowIso() };
    try {
      await saveGroup.mutateAsync(updated);
      toast.success(`Đã khôi phục nhóm "${group.name}"`);
    } catch (err) {
      toast.error(`Khôi phục thất bại: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  function courtName(id: string): string | undefined {
    return courts?.find((v) => v.id === id)?.name;
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Nhóm của tôi</CardTitle>
          <CardDescription>
            Mỗi nhóm có danh sách thành viên và mức trần nữ riêng. Khi tính tiền, chọn nhóm trước.
          </CardDescription>
          {!creating && (
            <CardAction>
              <Button size="sm" onClick={openCreating} disabled={disabled}>
                <Plus /> Tạo nhóm
              </Button>
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!cloudOnline && <p className="text-xs text-destructive">Chưa kết nối Cloud nên không thể chỉnh sửa.</p>}
          {(error ?? loadErrorMessage) && <p className="text-xs text-destructive">{error ?? loadErrorMessage}</p>}
          {activeCourts.length === 0 && !loading && (
            <p className="text-xs text-muted-foreground">
              Chưa có sân nào.{' '}
              <Link href="/settings/courts" className="font-semibold text-[#059669] underline">
                Thêm sân
              </Link>{' '}
              để chọn sân hay chơi cho nhóm.
            </p>
          )}
          {creating && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3">
              <GroupForm
                initial={NEW_GROUP_DRAFT}
                courts={activeCourts}
                submitLabel="Tạo nhóm"
                disabled={disabled}
                onSubmit={handleCreate}
                onCancel={closeCreating}
              />
            </div>
          )}
          {loading ? (
            <LoadingState />
          ) : activeGroups.length === 0 && !creating ? (
            <p className="text-muted-foreground">Chưa có nhóm nào. Bấm "Tạo nhóm" để bắt đầu.</p>
          ) : null}
        </CardContent>
      </Card>

      {activeGroups.map((group) => {
        const maleCount = group.members.filter((m) => m.gender === 'MALE').length;
        const femaleCount = group.members.length - maleCount;
        const sessionCount = (sessions ?? []).filter((s) => s.groupId === group.id).length;
        const defaultCourt = courtName(group.defaultCourtId);
        const membersOpen = membersOpenId === group.id;

        return (
          <div key={group.id} className="flex flex-col gap-2">
            <Card size="sm">
              <CardHeader>
                <CardTitle>{group.name}</CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="flex items-center gap-1">
                    <Users className="size-3.5" />
                    {group.members.length} người ({maleCount} nam, {femaleCount} nữ)
                  </span>
                  <span className="flex items-center gap-1 text-[#be185d]">
                    <Venus className="size-3.5" />
                    Trần nữ {formatVND(group.femaleCap)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {defaultCourt ?? 'Chưa chọn sân hay chơi'}
                  </span>
                  {defaultCourt && (
                    <span className="basis-full text-xs text-muted-foreground/80">
                      Khi tính tiền, sân này được chọn sẵn cho nhóm.
                    </span>
                  )}
                  <span>{sessionCount} buổi đã lưu</span>
                </CardDescription>
                <CardAction className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Sửa nhóm"
                    title="Sửa nhóm"
                    onClick={() => setEditingId(editingId === group.id ? null : group.id)}
                    disabled={disabled}
                    className="text-muted-foreground"
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Ẩn nhóm"
                    title="Ẩn nhóm"
                    onClick={() => handleHide(group)}
                    disabled={disabled}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <EyeOff />
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {editingId === group.id && (
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <GroupForm
                      initial={{ name: group.name, femaleCap: group.femaleCap, defaultCourtId: group.defaultCourtId }}
                      courts={activeCourts}
                      submitLabel="Lưu thay đổi"
                      disabled={disabled}
                      onSubmit={(draft) => handleUpdate(group, draft)}
                      onCancel={() => setEditingId(null)}
                    />
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="self-start"
                  onClick={() => setMembersOpenId(membersOpen ? null : group.id)}
                  aria-expanded={membersOpen}
                >
                  <Users /> {membersOpen ? 'Ẩn danh sách thành viên' : 'Quản lý thành viên'}
                  <ChevronDown className={cn('transition-transform', membersOpen && 'rotate-180')} />
                </Button>
              </CardContent>
            </Card>

            {membersOpen && (
              <RosterManager
                title={`Thành viên nhóm ${group.name}`}
                roster={group.members}
                loading={false}
                cloudOnline={cloudOnline}
                onSave={(members) => handleSaveMembers(group, members)}
              />
            )}
          </div>
        );
      })}

      {hiddenGroups.length > 0 && (
        <details className="rounded-lg border border-dashed bg-white px-3 py-2">
          <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">
            Nhóm đã ẩn ({hiddenGroups.length})
          </summary>
          <ul className="mt-2 divide-y">
            {hiddenGroups.map((group) => (
              <li key={group.id} className="flex items-center gap-2 py-1.5 text-sm text-muted-foreground">
                <span className="min-w-0 flex-1 truncate">
                  {group.name} · {group.members.length} người
                </span>
                <Button variant="outline" size="sm" onClick={() => handleRestore(group)} disabled={disabled}>
                  <RotateCcw /> Khôi phục
                </Button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
