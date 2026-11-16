'use client';

import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { confirm } from '@/stores/confirm.store';
import type { TGroup } from '@/types/group.types';
import type { TSessionBill } from '@/types/session.types';
import { formatVND } from '@/utils/format';
import { cn } from 'cn';
import { Calculator, CalendarDays, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { groupSessionsByMonth } from '../utils/month';
import HistoryMonthHeader from './HistoryMonthHeader';
import HistorySessionCard from './HistorySessionCard';

interface HistoryListProps {
  sessions: TSessionBill[];
  /** Tất cả nhóm (gồm cả nhóm đã ẩn) để hiện tên và bộ lọc. */
  groups: TGroup[];
  loading: boolean;
  error: string | null;
  cloudOnline: boolean;
  onRefresh: () => void;
  onDelete: (id: string) => Promise<void>;
}

const ALL_GROUPS = '__all__';
const SKELETON_CARDS = 3;

export default function HistoryList({ sessions, groups, loading, error, cloudOnline, onRefresh, onDelete }: HistoryListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [groupFilter, setGroupFilter] = useState<string>(ALL_GROUPS);

  /** Tên nhóm lưu trong buổi chơi; nếu thiếu thì lấy tên hiện tại của nhóm. */
  function groupNameOf(bill: TSessionBill): string {
    return bill.groupName || groups.find((g) => g.id === bill.groupId)?.name || 'Không rõ nhóm';
  }

  // Bộ lọc chỉ gồm các nhóm có buổi chơi đã lưu, theo thứ tự nhóm.
  const filterOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of sessions) counts.set(s.groupId, (counts.get(s.groupId) ?? 0) + 1);
    const known = groups.filter((g) => counts.has(g.id)).map((g) => ({ id: g.id, name: g.name, count: counts.get(g.id)! }));
    const unknown = [...counts.keys()]
      .filter((id) => !groups.some((g) => g.id === id))
      .map((id) => ({ id, name: sessions.find((s) => s.groupId === id)?.groupName || 'Không rõ nhóm', count: counts.get(id)! }));
    return [...known, ...unknown];
  }, [sessions, groups]);

  const visibleSessions = groupFilter === ALL_GROUPS ? sessions : sessions.filter((s) => s.groupId === groupFilter);
  const months = useMemo(() => groupSessionsByMonth(visibleSessions), [visibleSessions]);

  async function handleDelete(bill: TSessionBill) {
    if (!bill.id) return;
    const ok = await confirm({
      title: 'Xóa buổi chơi này?',
      description: `Buổi "${bill.title}" (${bill.totalCount} người, ${formatVND(bill.totalCost)}) sẽ bị xóa vĩnh viễn khỏi lịch sử.`,
      confirmLabel: 'Xóa',
      destructive: true,
    });
    if (!ok) return;
    setDeletingId(bill.id);
    try {
      await onDelete(bill.id);
      toast.success(`Đã xóa buổi ${bill.title}.`);
    } catch (err) {
      toast.error(`Xóa thất bại: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Lịch sử buổi chơi ({visibleSessions.length})</h2>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading || !cloudOnline}>
          <RotateCcw className={cn(loading && 'animate-spin')} /> Tải lại
        </Button>
      </div>

      {filterOptions.length > 1 && (
        <fieldset className="flex min-w-0 flex-wrap gap-1.5">
          <legend className="sr-only">Lọc theo nhóm</legend>
          {[{ id: ALL_GROUPS, name: 'Tất cả', count: sessions.length }, ...filterOptions].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setGroupFilter(opt.id)}
              aria-pressed={groupFilter === opt.id}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                groupFilter === opt.id
                  ? 'border-[#0a6c44] bg-[#0a6c44] text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
              )}
            >
              {opt.name} ({opt.count})
            </button>
          ))}
        </fieldset>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading && sessions.length === 0 ? (
        <HistorySkeleton />
      ) : visibleSessions.length === 0 ? (
        <HistoryEmpty />
      ) : (
        <div className="flex flex-col gap-3">
          {months.map((month) => (
            <section key={month.key} className="flex flex-col gap-2" aria-label={month.label}>
              <HistoryMonthHeader label={month.label} count={month.sessions.length} total={month.total} />
              <ul className="flex flex-col gap-2.5">
                {month.sessions.map((bill) => (
                  <li key={bill.id}>
                    <HistorySessionCard
                      bill={bill}
                      groupName={groupNameOf(bill)}
                      expanded={expandedId === bill.id}
                      onExpandedChange={(open) => setExpandedId(open ? (bill.id ?? null) : null)}
                      deleting={deletingId === bill.id}
                      cloudOnline={cloudOnline}
                      onDelete={() => handleDelete(bill)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

/** Khung xám giữ chỗ trong lúc tải lịch sử lần đầu. */
function HistorySkeleton() {
  return (
    <ul role="status" aria-label="Đang tải lịch sử" className="flex flex-col gap-2.5">
      {Array.from({ length: SKELETON_CARDS }, (_, i) => (
        <li key={i} className="flex animate-pulse items-center gap-3 rounded-xl border bg-white p-3 sm:p-4">
          <div className="h-14 w-12 shrink-0 rounded-lg bg-gray-100" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-3.5 w-1/3 rounded bg-gray-100" />
            <div className="h-3 w-1/2 rounded bg-gray-100" />
            <div className="h-4 w-2/5 rounded-full bg-gray-100" />
          </div>
          <div className="h-5 w-20 rounded bg-gray-100" />
        </li>
      ))}
    </ul>
  );
}

/** Chưa có buổi chơi nào (hoặc nhóm đang lọc chưa có buổi nào). */
function HistoryEmpty() {
  return (
    <Card className="border border-dashed ring-0">
      <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-emerald-50">
          <CalendarDays className="size-6 text-emerald-600" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="font-semibold text-gray-800">Chưa có buổi chơi nào được lưu</p>
          <p className="text-xs text-muted-foreground">Tính tiền và bấm "Lưu vào Lịch sử", buổi chơi sẽ hiện ở đây.</p>
        </div>
        <Link href="/calculator" className={buttonVariants({ size: 'sm', className: 'gap-1.5' })}>
          <Calculator className="size-3.5" /> Tính tiền buổi đầu tiên
        </Link>
      </CardContent>
    </Card>
  );
}
