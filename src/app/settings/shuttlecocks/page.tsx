'use client';

import type { ShuttlecockDraft } from '@/components/features/settings/schema/shuttlecock.schema';
import { ShuttlecockAddForm, ShuttlecockEditForm } from '@/components/features/settings/ShuttlecockForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useConnection } from '@/context/ConnectionContext';
import { useConfirm } from '@/hooks/useConfirm';
import { ShuttlecockApi } from '@/libs/firebase';
import type { TShuttlecock } from '@/types/shuttlecock.types';
import { nowIso } from '@/utils/date';
import { formatVND, SHUTTLES_PER_TUBE } from '@/utils/format';
import { EyeOff, Feather, Pencil, RotateCcw, Star } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function ShuttlecocksManager() {
  const { cloudOnline, setOnline, setOffline } = useConnection();
  const [shuttlecocks, setShuttlecocks] = useState<TShuttlecock[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const confirm = useConfirm();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const list = await ShuttlecockApi.fetchAll();
      setShuttlecocks(list);
      setOnline();
    } catch (err) {
      setError(`Không tải được danh sách loại cầu: ${err instanceof Error ? err.message : String(err)}`);
      setOffline();
    } finally {
      setLoading(false);
    }
  }, [setOnline, setOffline]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeShuttlecocks = useMemo(() => shuttlecocks.filter((s) => !s.deletedAt), [shuttlecocks]);
  const hiddenShuttlecocks = useMemo(() => shuttlecocks.filter((s) => s.deletedAt), [shuttlecocks]);
  const disabled = !cloudOnline;

  function findDuplicate(name: string, exceptId?: string): TShuttlecock | undefined {
    const key = name.trim().toLowerCase();
    return activeShuttlecocks.find((s) => s.id !== exceptId && s.name.trim().toLowerCase() === key);
  }

  async function handleAdd(values: ShuttlecockDraft): Promise<string | null> {
    const name = values.name.trim();
    if (findDuplicate(name)) {
      return `Loại cầu "${name}" đã có trong danh sách.`;
    }
    const now = nowIso();
    const newShuttlecock: TShuttlecock = {
      id: crypto.randomUUID(),
      name,
      tubePrice: values.tubePrice,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    try {
      await ShuttlecockApi.save(newShuttlecock);
      setShuttlecocks((prev) => [...prev, newShuttlecock].sort((a, b) => a.name.localeCompare(b.name, 'vi')));
      toast.success(`Đã thêm loại cầu "${name}"`);
      return null;
    } catch (err) {
      return `Lưu thất bại: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  async function handleSaveEdit(shuttlecock: TShuttlecock, values: ShuttlecockDraft): Promise<string | null> {
    const name = values.name.trim();
    if (findDuplicate(name, shuttlecock.id)) {
      return `Loại cầu "${name}" đã có trong danh sách.`;
    }
    const updated: TShuttlecock = { ...shuttlecock, name, tubePrice: values.tubePrice, updatedAt: nowIso() };
    try {
      await ShuttlecockApi.save(updated);
      setShuttlecocks((prev) =>
        prev.map((s) => (s.id === shuttlecock.id ? updated : s)).sort((a, b) => a.name.localeCompare(b.name, 'vi')),
      );
      setEditingId(null);
      toast.success(`Đã cập nhật loại cầu "${name}"`);
      return null;
    } catch (err) {
      return `Lưu thất bại: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  async function handleHide(shuttlecock: TShuttlecock): Promise<void> {
    const ok = await confirm({
      title: `Ẩn loại cầu "${shuttlecock.name}"?`,
      description:
        'Loại cầu sẽ không còn hiện khi tính tiền. Lịch sử các buổi đã chơi dùng loại cầu này vẫn giữ nguyên, và bạn có thể khôi phục bất cứ lúc nào.',
      confirmLabel: 'Ẩn loại cầu',
      destructive: true,
    });
    if (!ok) return;
    const updated: TShuttlecock = { ...shuttlecock, deletedAt: nowIso(), updatedAt: nowIso() };
    try {
      await ShuttlecockApi.save(updated);
      setShuttlecocks((prev) => prev.map((s) => (s.id === shuttlecock.id ? updated : s)));
      toast.success(`Đã ẩn loại cầu "${shuttlecock.name}"`);
    } catch (err) {
      toast.error(`Ẩn thất bại: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async function handleRestore(shuttlecock: TShuttlecock): Promise<void> {
    if (findDuplicate(shuttlecock.name, shuttlecock.id)) {
      setError(`Đã có loại cầu khác tên "${shuttlecock.name}". Đổi tên loại cầu đó trước khi khôi phục.`);
      return;
    }
    setError(null);
    const updated: TShuttlecock = { ...shuttlecock, deletedAt: null, updatedAt: nowIso() };
    try {
      await ShuttlecockApi.save(updated);
      setShuttlecocks((prev) => prev.map((s) => (s.id === shuttlecock.id ? updated : s)));
      toast.success(`Đã khôi phục loại cầu "${shuttlecock.name}"`);
    } catch (err) {
      toast.error(`Khôi phục thất bại: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async function handleSetDefault(shuttlecock: TShuttlecock): Promise<void> {
    if (shuttlecock.isDefault) return;
    try {
      await ShuttlecockApi.setDefault(shuttlecock.id);
      setShuttlecocks((prev) =>
        prev.map((s) => ({
          ...s,
          isDefault: s.id === shuttlecock.id,
        })),
      );
      toast.success(`Đã đặt "${shuttlecock.name}" làm loại cầu mặc định`);
    } catch (err) {
      toast.error(`Đặt mặc định thất bại: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Loại cầu lông</CardTitle>
        <CardDescription className="flex flex-col gap-0.5">
          <span>Mỗi ống 12 quả. Giá ống ở đây là giá đề xuất, khi tính tiền vẫn có thể chỉnh sửa lại.</span>
          <span className="text-xs text-amber-800">
            ⭐ Loại cầu được đánh dấu mặc định sẽ luôn được tự động chọn sẵn khi vào màn hình tính tiền.
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <ShuttlecockAddForm disabled={disabled} onSubmit={handleAdd} />

        {!cloudOnline && <p className="text-xs text-destructive">Chưa kết nối Cloud nên không thể chỉnh sửa.</p>}
        {error && <p className="text-xs text-destructive">{error}</p>}

        {loading ? (
          <p className="text-muted-foreground">Đang tải danh sách loại cầu...</p>
        ) : activeShuttlecocks.length === 0 ? (
          <p className="text-muted-foreground">Chưa có loại cầu nào. Thêm loại cầu đầu tiên ở ô phía trên.</p>
        ) : (
          <ul className="divide-y">
            {activeShuttlecocks.map((shuttlecock) => {
              const perShuttle = Math.round(shuttlecock.tubePrice / SHUTTLES_PER_TUBE);

              return (
                <li key={shuttlecock.id} className="flex flex-wrap items-center gap-2 py-2 sm:flex-nowrap">
                  {editingId === shuttlecock.id ? (
                    <ShuttlecockEditForm
                      initial={{ name: shuttlecock.name, tubePrice: shuttlecock.tubePrice }}
                      disabled={disabled}
                      onSubmit={(draft) => handleSaveEdit(shuttlecock, draft)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-semibold">{shuttlecock.name}</p>
                          {shuttlecock.isDefault && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-300">
                              <Star className="size-3 fill-amber-500 text-amber-500" /> Mặc định
                            </span>
                          )}
                        </div>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Feather className="size-3 shrink-0" />
                          <span>
                            {formatVND(shuttlecock.tubePrice)}/ống ({formatVND(perShuttle)}/quả)
                          </span>
                        </p>
                      </div>
                      {!shuttlecock.isDefault && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Đặt làm mặc định"
                          title="Đặt làm loại cầu mặc định khi tính tiền"
                          onClick={() => handleSetDefault(shuttlecock)}
                          disabled={disabled}
                          className="text-muted-foreground hover:text-amber-600"
                        >
                          <Star className="size-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Sửa loại cầu"
                        title="Sửa loại cầu"
                        onClick={() => setEditingId(shuttlecock.id)}
                        disabled={disabled}
                        className="text-muted-foreground"
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Ẩn loại cầu"
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
              );
            })}
          </ul>
        )}

        {hiddenShuttlecocks.length > 0 && (
          <details className="rounded-lg border border-dashed bg-white px-3 py-2">
            <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">
              Loại cầu đã ẩn ({hiddenShuttlecocks.length})
            </summary>
            <ul className="mt-2 divide-y">
              {hiddenShuttlecocks.map((shuttlecock) => (
                <li key={shuttlecock.id} className="flex items-center gap-2 py-1.5 text-sm text-muted-foreground">
                  <span className="min-w-0 flex-1 truncate">
                    {shuttlecock.name} · {formatVND(shuttlecock.tubePrice)}/ống
                  </span>
                  <Button variant="outline" size="sm" onClick={() => handleRestore(shuttlecock)} disabled={disabled}>
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
