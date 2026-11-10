'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useBadminton } from '@/contexts/BadmintonContext';
import { useConfirm } from '@/hooks/useConfirm';
import { formatVND, SHUTTLES_PER_TUBE } from '@/libs/calculator';
import type { Shuttlecock } from '@/types/badminton';
import { Check, EyeOff, Feather, Pencil, Plus, RotateCcw, X } from 'lucide-react';
import moment from 'moment';
import { useState } from 'react';

type ShuttlecockDraft = { name: string; tubePrice: number };
const EMPTY_DRAFT: ShuttlecockDraft = { name: '', tubePrice: 0 };

/** Ô nhập giá ống: hiển thị có dấu phân cách hàng nghìn, chỉ nhận chữ số. */
function TubePriceInput({
  value,
  onChange,
  label,
  onEnter,
  onEscape,
}: {
  value: number;
  onChange: (price: number) => void;
  label: string;
  onEnter?: () => void;
  onEscape?: () => void;
}) {
  return (
    <div className="relative min-w-0 flex-1">
      <Input
        inputMode="numeric"
        value={value ? value.toLocaleString('vi-VN') : ''}
        aria-label={label}
        placeholder="Giá 1 ống mặc định"
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '');
          onChange(digits ? Number(digits) : 0);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onEnter?.();
          if (e.key === 'Escape') onEscape?.();
        }}
        className="pr-14"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">đ/ống</span>
    </div>
  );
}

export default function ShuttlecocksManager() {
  const { shuttlecocks, activeShuttlecocks, settingsLoading, cloudOnline, handleSaveShuttlecock } = useBadminton();
  const [newDraft, setNewDraft] = useState<ShuttlecockDraft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<ShuttlecockDraft>(EMPTY_DRAFT);
  const [error, setError] = useState<string | null>(null);
  const { confirm, confirmDialog } = useConfirm();

  const hiddenShuttlecocks = shuttlecocks.filter((s) => s.deletedAt);
  const disabled = !cloudOnline;

  function findDuplicate(name: string, exceptId?: string) {
    const key = name.trim().toLowerCase();
    return activeShuttlecocks.find((s) => s.id !== exceptId && s.name.trim().toLowerCase() === key);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = newDraft.name.trim();
    if (!name || newDraft.tubePrice <= 0) return;
    if (findDuplicate(name)) {
      setError(`Loại cầu "${name}" đã có trong danh sách.`);
      return;
    }
    setError(null);
    const now = moment().toISOString();
    await handleSaveShuttlecock(
      { id: crypto.randomUUID(), name, tubePrice: newDraft.tubePrice, createdAt: now, updatedAt: now, deletedAt: null },
      `Đã thêm loại cầu "${name}"`,
    );
    setNewDraft(EMPTY_DRAFT);
  }

  function startEdit(shuttlecock: Shuttlecock) {
    setEditingId(shuttlecock.id);
    setEditDraft({ name: shuttlecock.name, tubePrice: shuttlecock.tubePrice });
    setError(null);
  }

  async function handleSaveEdit(shuttlecock: Shuttlecock) {
    const name = editDraft.name.trim();
    if (!name || editDraft.tubePrice <= 0) return;
    if (findDuplicate(name, shuttlecock.id)) {
      setError(`Loại cầu "${name}" đã có trong danh sách.`);
      return;
    }
    setError(null);
    await handleSaveShuttlecock(
      { ...shuttlecock, name, tubePrice: editDraft.tubePrice, updatedAt: moment().toISOString() },
      `Đã cập nhật loại cầu "${name}"`,
    );
    setEditingId(null);
  }

  async function handleHide(shuttlecock: Shuttlecock) {
    const ok = await confirm({
      title: `Ẩn loại cầu "${shuttlecock.name}"?`,
      description:
        'Loại cầu sẽ không còn hiện khi tính tiền. Lịch sử các buổi đã chơi bằng loại cầu này vẫn giữ nguyên, và bạn có thể khôi phục bất cứ lúc nào.',
      confirmLabel: 'Ẩn loại cầu',
      destructive: true,
    });
    if (!ok) return;
    const now = moment().toISOString();
    await handleSaveShuttlecock({ ...shuttlecock, deletedAt: now, updatedAt: now }, `Đã ẩn loại cầu "${shuttlecock.name}"`);
  }

  async function handleRestore(shuttlecock: Shuttlecock) {
    if (findDuplicate(shuttlecock.name, shuttlecock.id)) {
      setError(`Đã có loại cầu khác tên "${shuttlecock.name}". Đổi tên loại cầu đó trước khi khôi phục.`);
      return;
    }
    setError(null);
    await handleSaveShuttlecock(
      { ...shuttlecock, deletedAt: null, updatedAt: moment().toISOString() },
      `Đã khôi phục loại cầu "${shuttlecock.name}"`,
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Loại cầu</CardTitle>
        <CardDescription>
          Giá ống chỉ là giá điền sẵn ({SHUTTLES_PER_TUBE} quả mỗi ống). Khi tính tiền, mỗi buổi chọn 1 loại cầu và nhập lại giá
          nếu khác.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <form onSubmit={handleAdd} className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={newDraft.name}
            onChange={(e) => setNewDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="Tên loại cầu (VD: Thành Công)"
            aria-label="Tên loại cầu mới"
            className="min-w-0 flex-1"
          />
          <TubePriceInput
            value={newDraft.tubePrice}
            onChange={(tubePrice) => setNewDraft((d) => ({ ...d, tubePrice }))}
            label="Giá 1 ống mặc định của loại cầu mới"
          />
          <Button type="submit" disabled={disabled || !newDraft.name.trim() || newDraft.tubePrice <= 0}>
            <Plus /> Thêm
          </Button>
        </form>

        {!cloudOnline && <p className="text-xs text-destructive">Chưa kết nối Cloud nên không thể chỉnh sửa.</p>}
        {error && <p className="text-xs text-destructive">{error}</p>}

        {settingsLoading ? (
          <p className="text-muted-foreground">Đang tải danh sách loại cầu...</p>
        ) : activeShuttlecocks.length === 0 ? (
          <p className="text-muted-foreground">Chưa có loại cầu nào. Thêm loại cầu đầu tiên ở ô phía trên.</p>
        ) : (
          <ul className="divide-y">
            {activeShuttlecocks.map((shuttlecock) => (
              <li key={shuttlecock.id} className="flex flex-wrap items-center gap-2 py-2 sm:flex-nowrap">
                {editingId === shuttlecock.id ? (
                  <>
                    <Input
                      value={editDraft.name}
                      autoFocus
                      aria-label="Tên loại cầu"
                      onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(shuttlecock);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="min-w-0 flex-1"
                    />
                    <TubePriceInput
                      value={editDraft.tubePrice}
                      onChange={(tubePrice) => setEditDraft((d) => ({ ...d, tubePrice }))}
                      label="Giá 1 ống mặc định"
                      onEnter={() => handleSaveEdit(shuttlecock)}
                      onEscape={() => setEditingId(null)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Lưu"
                      title="Lưu"
                      onClick={() => handleSaveEdit(shuttlecock)}
                      disabled={disabled || !editDraft.name.trim() || editDraft.tubePrice <= 0}
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
                    <Feather className="size-4 shrink-0 text-[#d97706]" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{shuttlecock.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {formatVND(shuttlecock.tubePrice)}/ống · {formatVND(shuttlecock.tubePrice / SHUTTLES_PER_TUBE)}/quả
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Sửa"
                      title="Sửa"
                      onClick={() => startEdit(shuttlecock)}
                      disabled={disabled}
                      className="text-muted-foreground"
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Ẩn"
                      title="Ẩn loại cầu"
                      onClick={() => handleHide(shuttlecock)}
                      disabled={disabled}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <EyeOff />
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        {hiddenShuttlecocks.length > 0 && (
          <details className="rounded-lg border border-dashed px-3 py-2">
            <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">
              Loại cầu đã ẩn ({hiddenShuttlecocks.length})
            </summary>
            <ul className="mt-2 divide-y">
              {hiddenShuttlecocks.map((shuttlecock) => (
                <li key={shuttlecock.id} className="flex items-center gap-2 py-1.5 text-sm text-muted-foreground">
                  <span className="min-w-0 flex-1 truncate">{shuttlecock.name}</span>
                  <Button variant="outline" size="sm" onClick={() => handleRestore(shuttlecock)} disabled={disabled}>
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

