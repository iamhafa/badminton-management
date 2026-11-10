'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useBadminton } from '@/contexts/BadmintonContext';
import { useConfirm } from '@/hooks/useConfirm';
import type { Court } from '@/types/badminton';
import { Check, EyeOff, MapPin, Pencil, Plus, RotateCcw, X } from 'lucide-react';
import moment from 'moment';
import { useState } from 'react';

type CourtDraft = { name: string; address: string };
const EMPTY_DRAFT: CourtDraft = { name: '', address: '' };

export default function CourtsManager() {
  const { courts, activeCourts, groups, settingsLoading, cloudOnline, handleSaveCourt } = useBadminton();
  const [newDraft, setNewDraft] = useState<CourtDraft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<CourtDraft>(EMPTY_DRAFT);
  const [error, setError] = useState<string | null>(null);
  const { confirm, confirmDialog } = useConfirm();

  const hiddenCourts = courts.filter((v) => v.deletedAt);
  const disabled = !cloudOnline;

  function findDuplicate(name: string, exceptId?: string) {
    const key = name.trim().toLowerCase();
    return activeCourts.find((v) => v.id !== exceptId && v.name.trim().toLowerCase() === key);
  }

  function groupsUsing(courtId: string) {
    return groups.filter((g) => !g.deletedAt && g.defaultCourtId === courtId);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = newDraft.name.trim();
    if (!name) return;
    if (findDuplicate(name)) {
      setError(`Sân "${name}" đã có trong danh sách.`);
      return;
    }
    setError(null);
    const now = moment().toISOString();
    await handleSaveCourt(
      { id: crypto.randomUUID(), name, address: newDraft.address.trim(), createdAt: now, updatedAt: now, deletedAt: null },
      `Đã thêm sân "${name}"`,
    );
    setNewDraft(EMPTY_DRAFT);
  }

  function startEdit(court: Court) {
    setEditingId(court.id);
    setEditDraft({ name: court.name, address: court.address });
    setError(null);
  }

  async function handleSaveEdit(court: Court) {
    const name = editDraft.name.trim();
    if (!name) return;
    if (findDuplicate(name, court.id)) {
      setError(`Sân "${name}" đã có trong danh sách.`);
      return;
    }
    setError(null);
    await handleSaveCourt(
      { ...court, name, address: editDraft.address.trim(), updatedAt: moment().toISOString() },
      `Đã cập nhật sân "${name}"`,
    );
    setEditingId(null);
  }

  async function handleHide(court: Court) {
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
    const now = moment().toISOString();
    await handleSaveCourt({ ...court, deletedAt: now, updatedAt: now }, `Đã ẩn sân "${court.name}"`);
  }

  async function handleRestore(court: Court) {
    if (findDuplicate(court.name, court.id)) {
      setError(`Đã có sân khác tên "${court.name}". Đổi tên sân đó trước khi khôi phục.`);
      return;
    }
    setError(null);
    await handleSaveCourt({ ...court, deletedAt: null, updatedAt: moment().toISOString() }, `Đã khôi phục sân "${court.name}"`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sân cầu lông</CardTitle>
        <CardDescription>Danh sách sân dùng chung cho mọi nhóm. Khi tính tiền, mỗi buổi chơi phải chọn 1 sân.</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <form onSubmit={handleAdd} className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={newDraft.name}
            onChange={(e) => setNewDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="Tên sân (VD: Sân Mỹ Đình)"
            aria-label="Tên sân mới"
            className="min-w-0 flex-1"
          />
          <Input
            value={newDraft.address}
            onChange={(e) => setNewDraft((d) => ({ ...d, address: e.target.value }))}
            placeholder="Địa chỉ (không bắt buộc)"
            aria-label="Địa chỉ sân mới"
            className="min-w-0 flex-1"
          />
          <Button type="submit" disabled={disabled || !newDraft.name.trim()}>
            <Plus /> Thêm sân
          </Button>
        </form>

        {!cloudOnline && <p className="text-xs text-destructive">Chưa kết nối Cloud nên không thể chỉnh sửa.</p>}
        {error && <p className="text-xs text-destructive">{error}</p>}

        {settingsLoading ? (
          <p className="text-muted-foreground">Đang tải danh sách sân...</p>
        ) : activeCourts.length === 0 ? (
          <p className="text-muted-foreground">Chưa có sân nào. Thêm sân đầu tiên ở ô phía trên.</p>
        ) : (
          <ul className="divide-y">
            {activeCourts.map((court) => {
              const using = groupsUsing(court.id);
              return (
                <li key={court.id} className="flex flex-wrap items-center gap-2 py-2 sm:flex-nowrap">
                  {editingId === court.id ? (
                    <>
                      <Input
                        value={editDraft.name}
                        autoFocus
                        aria-label="Tên sân"
                        onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(court);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="min-w-0 flex-1"
                      />
                      <Input
                        value={editDraft.address}
                        aria-label="Địa chỉ sân"
                        placeholder="Địa chỉ"
                        onChange={(e) => setEditDraft((d) => ({ ...d, address: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(court);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="min-w-0 flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Lưu"
                        title="Lưu"
                        onClick={() => handleSaveEdit(court)}
                        disabled={disabled || !editDraft.name.trim()}
                        className="text-primary"
                      >
                        <Check />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Hủy" title="Hủy" onClick={() => setEditingId(null)}>
                        <X />
                      </Button>
                    </>
                  ) : (
                    <>
                      <MapPin className="size-4 shrink-0 text-[#059669]" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{court.name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {court.address || 'Chưa có địa chỉ'}
                          {using.length > 0 && ` · Sân mặc định của ${using.map((g) => g.name).join(', ')}`}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Sửa"
                        title="Sửa"
                        onClick={() => startEdit(court)}
                        disabled={disabled}
                        className="text-muted-foreground"
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Ẩn"
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
          <details className="rounded-lg border border-dashed px-3 py-2">
            <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">
              Sân đã ẩn ({hiddenCourts.length})
            </summary>
            <ul className="mt-2 divide-y">
              {hiddenCourts.map((court) => (
                <li key={court.id} className="flex items-center gap-2 py-1.5 text-sm text-muted-foreground">
                  <span className="min-w-0 flex-1 truncate">{court.name}</span>
                  <Button variant="outline" size="sm" onClick={() => handleRestore(court)} disabled={disabled}>
                    <RotateCcw /> Khôi phục
                  </Button>
                </li>
              ))}
            </ul>
          </details>
        )}
      </CardContent>
      {confirmDialog}
    </Card>
  );
}

