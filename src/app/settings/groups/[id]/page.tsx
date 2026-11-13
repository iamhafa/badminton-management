'use client';

import LoadingState from '@/components/common/LoadingState';
import GroupForm from '../components/GroupForm';
import RosterManager from '../components/RosterManager';
import type { GroupDraft } from '../schemas/group.schema';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQueryCourts } from '@/hooks/useQueryCourts';
import { useMutateSaveGroup, useQueryGroups } from '@/hooks/useQueryGroups';
import { useQuerySessions } from '@/hooks/useQuerySessions';
import { confirm } from '@/stores/confirm.store';
import { ConnectionState, useConnectionStore } from '@/stores/connection.store';
import type { TGroup } from '@/types/group.types';
import type { TPlayer } from '@/types/player.types';
import { nowIso } from '@/utils/date';
import { formatVND } from '@/utils/format';
import { ArrowLeft, EyeOff, MapPin, Pencil, Users, Venus } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function GroupDetailPage() {
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

  if (loading) {
    return <LoadingState />;
  }

  if (!group) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Users className="size-6 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-gray-800">Không tìm thấy nhóm này</p>
            <p className="text-xs text-muted-foreground">Nhóm có thể đã bị ẩn hoặc liên kết không chính xác.</p>
          </div>
          <Link href="/settings/groups" className={buttonVariants({ variant: 'outline', size: 'sm', className: 'mt-2 gap-1.5' })}>
            <ArrowLeft className="size-3.5" /> Quay lại danh sách nhóm
          </Link>
        </CardContent>
      </Card>
    );
  }

  const maleCount = group.members.filter((m) => m.gender === 'MALE').length;
  const femaleCount = group.members.length - maleCount;
  const sessionCount = sessions.filter((s) => s.groupId === group.id).length;
  const defaultCourt = courtName(group.defaultCourtId);

  return (
    <div className="flex flex-col gap-4">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/settings/groups"
          className={buttonVariants({
            variant: 'ghost',
            size: 'sm',
            className: 'gap-1.5 text-xs text-muted-foreground hover:text-foreground',
          })}
        >
          <ArrowLeft className="size-3.5" />
          Danh sách nhóm
        </Link>
        {!cloudOnline && <span className="text-xs text-destructive">Offline (chỉ xem)</span>}
      </div>

      {/* Card 1: Thông tin nhóm & Thiết lập */}
      <Card size="sm">
        <CardHeader className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base sm:text-lg">{group.name}</CardTitle>
            {!isEditing && (
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  disabled={disabled}
                  className="gap-1.5 text-xs h-7 px-2"
                >
                  <Pencil className="size-3" /> Sửa thông tin
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Ẩn nhóm"
                  title="Ẩn nhóm"
                  onClick={handleHide}
                  disabled={disabled}
                  className="text-muted-foreground hover:text-destructive size-7"
                >
                  <EyeOff className="size-3.5" />
                </Button>
              </div>
            )}
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

        {isEditing && (
          <CardContent className="border-t pt-3">
            <div className="rounded-lg border bg-muted/30 p-3">
              <GroupForm
                initial={{
                  name: group.name,
                  femaleCap: group.femaleCap,
                  defaultCourtId: group.defaultCourtId,
                }}
                courts={courts}
                submitLabel="Lưu thay đổi"
                disabled={disabled}
                onSubmit={handleUpdate}
                onCancel={() => setIsEditing(false)}
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Card 2: Quản lý thành viên nhóm */}
      <RosterManager
        title={`Thành viên nhóm "${group.name}"`}
        roster={group.members}
        loading={false}
        cloudOnline={cloudOnline}
        onSave={handleSaveMembers}
      />
    </div>
  );
}
