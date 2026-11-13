'use client';

import LoadingState from '@/components/common/LoadingState';
import { CourtAddForm, CourtEditForm } from './components/CourtForm';
import type { CourtDraft } from './schemas/court.schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMutateSaveCourt, useQueryCourts } from '@/hooks/useQueryCourts';
import { useQueryGroups } from '@/hooks/useQueryGroups';
import { confirm } from '@/stores/confirm.store';
import { ConnectionState, useConnectionStore } from '@/stores/connection.store';
import type { TCourt } from '@/types/court.types';
import type { TGroup } from '@/types/group.types';
import { nowIso } from '@/utils/date';
import { EyeOff, MapPin, Pencil } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

export default function CourtsManager() {
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
    const ok: boolean = await confirm({
      title: `Ẩn sân "${court.name}"?`,
      description: (
        <>
          Sân sẽ không còn hiện khi tính tiền. Lịch sử các buổi đã chơi ở sân này vẫn giữ nguyên, và bạn có thể khôi phục sân bất
          cứ lúc nào.
          {using.length > 0 && <> Sân đang là sân mặc định của nhóm {using.map((g) => `"${g.name}"`).join(', ')}.</>}
        </>
      ),
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sân cầu lông</CardTitle>
        <CardDescription>Danh sách sân dùng chung cho mọi nhóm. Khi tính tiền, mỗi buổi chơi phải chọn 1 sân.</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <CourtAddForm disabled={disabled} onSubmit={handleAdd} />

        {!cloudIsOnline && <p className="text-xs text-destructive">Chưa kết nối Cloud nên không thể chỉnh sửa.</p>}
        {loadErrorMessage && <p className="text-xs text-destructive">{loadErrorMessage}</p>}

        {loading ? (
          <LoadingState />
        ) : courts.length === 0 ? (
          <p className="text-muted-foreground">Chưa có sân nào. Thêm sân đầu tiên ở ô phía trên.</p>
        ) : (
          <ul className="divide-y">
            {courts.map((court: TCourt) => {
              const using: TGroup[] = groupsUsing(court.id);

              return (
                <li key={court.id} className="flex flex-wrap items-center gap-2 py-2 sm:flex-nowrap">
                  {editingId === court.id ? (
                    <CourtEditForm
                      initial={{ name: court.name, address: court.address }}
                      disabled={disabled}
                      onSubmit={(draft) => handleSaveEdit(court, draft)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{court.name}</p>
                        {court.address && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3 shrink-0" />
                            <span className="truncate">{court.address}</span>
                          </p>
                        )}
                        {using.length > 0 && (
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                            <span>Sân mặc định của</span>
                            {using.map((group: TGroup) => (
                              <Link
                                key={group.id}
                                href={`/settings/groups/${group.id}`}
                                className="font-semibold text-[#059669] underline hover:text-emerald-800"
                              >
                                {group.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Sửa sân"
                        title="Sửa sân"
                        onClick={() => setEditingId(court.id)}
                        disabled={disabled}
                        className="text-muted-foreground"
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Ẩn sân"
                        title="Ẩn sân"
                        onClick={() => handleHide(court)}
                        disabled={disabled}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <EyeOff />
                      </Button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
