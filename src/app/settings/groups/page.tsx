'use client';

import LoadingState from '@/components/common/LoadingState';
import GroupForm from './components/GroupForm';
import type { GroupDraft } from './schemas/group.schema';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQueryCourts } from '@/hooks/useQueryCourts';
import { useMutateSaveGroup, useQueryGroups } from '@/hooks/useQueryGroups';
import { useQuerySessions } from '@/hooks/useQuerySessions';
import { confirm } from '@/stores/confirm.store';
import { ConnectionState, useConnectionStore } from '@/stores/connection.store';
import type { TGroup } from '@/types/group.types';
import { nowIso } from '@/utils/date';
import { formatVND } from '@/utils/format';
import { ChevronRight, EyeOff, MapPin, Plus, Users, Venus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useBoolean } from 'usehooks-ts';

const NEW_GROUP_DRAFT: GroupDraft = { name: '', femaleCap: 50000, defaultCourtId: '' };

export default function GroupsManager() {
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

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Nhóm của tôi</CardTitle>
          <CardDescription>Chọn một nhóm để xem và chỉnh sửa thành viên cũng như thiết lập riêng của nhóm đó.</CardDescription>
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
          {loadErrorMessage && <p className="text-xs text-destructive">{loadErrorMessage}</p>}
          {courts.length === 0 && !loading && (
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
                courts={courts}
                submitLabel="Tạo nhóm"
                disabled={disabled}
                onSubmit={handleCreate}
                onCancel={closeCreating}
              />
            </div>
          )}
          {loading ? (
            <LoadingState />
          ) : groups.length === 0 && !creating ? (
            <p className="text-muted-foreground">Chưa có nhóm nào. Bấm "Tạo nhóm" để bắt đầu.</p>
          ) : null}
        </CardContent>
      </Card>

      {/* Danh sách các nhóm: chỉ hiển thị tóm tắt, click vào nhóm để vào trang chi tiết */}
      {groups.map((group: TGroup) => {
        const maleCount: number = group.members.filter((m) => m.gender === 'MALE').length;
        const femaleCount: number = group.members.length - maleCount;
        const sessionCount: number = sessions.filter((s) => s.groupId === group.id).length;
        const defaultCourt: string | undefined = courtName(group.defaultCourtId);

        return (
          <Card key={group.id} size="sm" className="hover:border-emerald-400/80 transition-colors">
            <CardHeader className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">
                  <Link
                    href={`/settings/groups/${group.id}`}
                    className="hover:text-emerald-700 hover:underline inline-flex items-center gap-1.5"
                  >
                    {group.name}
                  </Link>
                </CardTitle>
                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href={`/settings/groups/${group.id}`}
                    className={buttonVariants({
                      variant: 'outline',
                      size: 'sm',
                      className:
                        'gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 h-7 px-2',
                    })}
                  >
                    Chi tiết
                    <ChevronRight className="size-3.5" />
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Ẩn nhóm"
                    title="Ẩn nhóm"
                    onClick={() => handleHide(group)}
                    disabled={disabled}
                    className="text-muted-foreground hover:text-destructive size-7"
                  >
                    <EyeOff className="size-3.5" />
                  </Button>
                </div>
              </div>

              <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
                <span className="inline-flex items-center gap-1 shrink-0">
                  <Users className="size-3.5 text-emerald-600" />
                  {group.members.length} người ({maleCount} nam, {femaleCount} nữ)
                </span>
                <span className="inline-flex items-center gap-1 shrink-0 text-[#be185d] font-medium">
                  <Venus className="size-3.5" />
                  Trần nữ {formatVND(group.femaleCap)}
                </span>
                <span className="inline-flex items-start gap-1 text-gray-700">
                  <MapPin className="size-3.5 shrink-0 text-gray-500 mt-0.5" />
                  <span className="wrap-break-word">{defaultCourt ?? 'Chưa chọn sân hay chơi'}</span>
                </span>
                <span className="inline-flex items-center gap-1 shrink-0 text-gray-500">{sessionCount} buổi đã lưu</span>
              </CardDescription>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
}
