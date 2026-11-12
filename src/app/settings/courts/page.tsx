'use client';

import { CourtAddForm, CourtEditForm } from '@/components/features/settings/CourtForm';
import type { CourtDraft } from '@/components/features/settings/schemas/court.schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConnectionState, useConnectionStore } from '@/stores/connection.store';
import { confirm } from '@/stores/confirm.store';
import LoadingState from '@/components/common/LoadingState';
import { useCourts, useSaveCourt } from '@/hooks/useQueryCourts';
import { useGroups } from '@/hooks/useQueryGroups';
import type { TCourt } from '@/types/court.types';
import type { TGroup } from '@/types/group.types';
import { nowIso } from '@/utils/date';
import { EyeOff, MapPin, Pencil, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function CourtsManager() {
  const cloudIsOnline: boolean = useConnectionStore((state: ConnectionState) => state.cloudStatus === 'online');
  const courtsQuery = useCourts();
  const groupsQuery = useGroups();
  const saveCourt = useSaveCourt();
  const courts = courtsQuery.data;
  const groups = groupsQuery.data;
  const loading = courtsQuery.isPending || groupsQuery.isPending;
  const loadError = courtsQuery.error ?? groupsQuery.error;
  const loadErrorMessage = loadError
    ? `Không tải được danh sách sân: ${loadError instanceof Error ? loadError.message : String(loadError)}`
    : null;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeCourts = useMemo(() => courts?.filter((v) => !v.deletedAt) ?? [], [courts]);
  const hiddenCourts = useMemo(() => courts?.filter((v) => v.deletedAt) ?? [], [courts]);
  const disabled = !cloudIsOnline;

  function findDuplicate(name: string, exceptId?: string): TCourt | undefined {
    const key = name.trim().toLowerCase();
    return activeCourts.find((v) => v.id !== exceptId && v.name.trim().toLowerCase() === key);
  }

  function groupsUsing(courtId: string): TGroup[] {
    return (groups ?? []).filter((g) => !g.deletedAt && g.defaultCourtId === courtId);
  }

  async function handleAdd(values: CourtDraft): Promise<string | null> {
    const name = values.name.trim();
    if (findDuplicate(name)) {
      return `Sân "${name}" đã có trong danh sách.`;
    }
    const now = nowIso();
    const newCourt: TCourt = {
      id: crypto.randomUUID(),
      name,
      address: values.address.trim(),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    try {
      await saveCourt.mutateAsync(newCourt);
      toast.success(`Đã thêm sân "${name}"`);
      return null;
    } catch (err) {
      return `Lưu thất bại: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  async function handleSaveEdit(court: TCourt, values: CourtDraft): Promise<string | null> {
    const name = values.name.trim();
    if (findDuplicate(name, court.id)) {
      return `Sân "${name}" đã có trong danh sách.`;
    }
    const updated: TCourt = { ...court, name, address: values.address.trim(), updatedAt: nowIso() };
    try {
      await saveCourt.mutateAsync(updated);
      setEditingId(null);
      toast.success(`Đã cập nhật sân "${name}"`);
      return null;
    } catch (err) {
      return `Lưu thất bại: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  async function handleHide(court: TCourt): Promise<void> {
    const using = groupsUsing(court.id);
    const ok = await confirm({
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
      await saveCourt.mutateAsync(updated);
      toast.success(`Đã ẩn sân "${court.name}"`);
    } catch (err) {
      toast.error(`Ẩn thất bại: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async function handleRestore(court: TCourt): Promise<void> {
    if (findDuplicate(court.name, court.id)) {
      setError(`Đã có sân khác tên "${court.name}". Đổi tên sân đó trước khi khôi phục.`);
      return;
    }
    setError(null);
    const updated: TCourt = { ...court, deletedAt: null, updatedAt: nowIso() };
    try {
      await saveCourt.mutateAsync(updated);
      toast.success(`Đã khôi phục sân "${court.name}"`);
    } catch (err) {
      toast.error(`Khôi phục thất bại: ${err instanceof Error ? err.message : String(err)}`);
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
        {(error ?? loadErrorMessage) && <p className="text-xs text-destructive">{error ?? loadErrorMessage}</p>}

        {loading ? (
          <LoadingState />
        ) : activeCourts.length === 0 ? (
          <p className="text-muted-foreground">Chưa có sân nào. Thêm sân đầu tiên ở ô phía trên.</p>
        ) : (
          <ul className="divide-y">
            {activeCourts.map((court) => {
              const using = groupsUsing(court.id);
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
                        {court.address ? (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3 shrink-0" />
                            <span className="truncate">{court.address}</span>
                          </p>
                        ) : null}
                        {using.length > 0 && (
                          <p className="text-xs text-muted-foreground">Sân mặc định của {using.map((g) => g.name).join(', ')}</p>
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

        {hiddenCourts.length > 0 && (
          <details className="rounded-lg border border-dashed bg-white px-3 py-2">
            <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">
              Sân đã ẩn ({hiddenCourts.length})
            </summary>
            <ul className="mt-2 divide-y">
              {hiddenCourts.map((court) => (
                <li key={court.id} className="flex items-center gap-2 py-1.5 text-sm text-muted-foreground">
                  <span className="min-w-0 flex-1 truncate">
                    {court.name}
                    {court.address ? ` · ${court.address}` : ''}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => handleRestore(court)} disabled={disabled}>
                    <RotateCcw /> Khôi phục
                  </Button>
                </li>
              ))}
            </ul>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
