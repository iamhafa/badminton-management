'use client';

import LoadingState from '@/components/common/LoadingState';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { TGroup } from '@/types/group.type';
import { formatVND } from '@/utils/format';
import { ChevronRight, EyeOff, MapPin, Plus, Users, Venus } from 'lucide-react';
import Link from 'next/link';
import SettingsGroupForm from './components/SettingsGroupForm';
import { useGroupsPage } from './hooks/useGroupsPage';
import type { GroupDraft } from './schemas/group.schema';

const NEW_GROUP_DRAFT: GroupDraft = { name: '', female_cap: 50000, default_court_id: '' };

export default function GroupsManager() {
  const {
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
  } = useGroupsPage();

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
        <CardContent className="flex flex-col gap-3 empty:hidden">
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
              <SettingsGroupForm
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

      {/* Danh sách các nhóm: gom trong 1 card, ngăn bằng đường kẻ. Chỉ hiển thị tóm tắt, click vào nhóm để vào trang chi tiết */}
      {groups.length > 0 && (
        <Card size="sm">
          <CardContent>
            <ul className="divide-y">
              {groups.map((group: TGroup) => {
                const maleCount: number = group.members.filter((m) => m.gender === 'MALE').length;
                const femaleCount: number = group.members.length - maleCount;
                const sessionCount: number = sessions.filter((s) => s.group_id === group.id).length;
                const defaultCourt: string | undefined = courtName(group.default_court_id);

                return (
                  <li key={group.id} className="py-3 first:pt-0 last:pb-0">
                    <CardHeader className="flex flex-col items-stretch gap-2 px-0">
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
                          Trần nữ {formatVND(group.female_cap)}
                        </span>
                        <span className="inline-flex items-start gap-1 text-gray-700">
                          <MapPin className="size-3.5 shrink-0 text-gray-500 mt-0.5" />
                          <span className="wrap-break-word">{defaultCourt ?? 'Chưa chọn sân hay chơi'}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 shrink-0 text-gray-500">{sessionCount} buổi đã lưu</span>
                      </CardDescription>
                    </CardHeader>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
