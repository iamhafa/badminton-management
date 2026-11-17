'use client';

import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { confirm } from '@/stores/confirm.store';
import type { TGroup } from '@/types/group.type';
import type { TPaymentMethod, TSession } from '@/types/session.type';
import { buildSessionTitle } from '@/utils/date';
import { formatVND } from '@/utils/format';
import { cn } from 'cn';
import { Calculator, CalendarDays, CircleCheck, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { groupSessionsByMonth } from '../utils/month';
import { getPaymentSummary, unpaidPlayerIds } from '../utils/payment';
import HistoryMonthHeader from './HistoryMonthHeader';
import HistorySessionCard from './HistorySessionCard';

interface HistoryListProps {
  sessions: TSession[];
  /** Tất cả nhóm (gồm cả nhóm đã ẩn) để hiện tên và bộ lọc. */
  groups: TGroup[];
  loading: boolean;
  error: string | null;
  cloudOnline: boolean;
  onRefresh: () => void;
  onDelete: (id: string) => Promise<void>;
  /** Ghi thay đổi chuyển tiền (`null` = bỏ đánh dấu). Trả về false nếu lưu thất bại (đã báo lỗi). */
  onUpdatePayments: (sessionId: string, playerIds: string[], method: TPaymentMethod | null) => Promise<boolean>;
}

const ALL_GROUPS = '__all__';
const SKELETON_CARDS = 3;

export default function HistoryList({
  sessions,
  groups,
  loading,
  error,
  cloudOnline,
  onRefresh,
  onDelete,
  onUpdatePayments,
}: HistoryListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [groupFilter, setGroupFilter] = useState<string>(ALL_GROUPS);
  const [unsettledOnly, setUnsettledOnly] = useState(false);

  /** Tên nhóm lưu trong buổi chơi; nếu thiếu thì lấy tên hiện tại của nhóm. */
  function groupNameOf(bill: TSession): string {
    return bill.group_name || groups.find((g) => g.id === bill.group_id)?.name || 'Không rõ nhóm';
  }

  // Bộ lọc chỉ gồm các nhóm có buổi chơi đã lưu, theo thứ tự nhóm.
  const filterOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of sessions) counts.set(s.group_id ?? '', (counts.get(s.group_id ?? '') ?? 0) + 1);
    const known = groups.filter((g) => counts.has(g.id)).map((g) => ({ id: g.id, name: g.name, count: counts.get(g.id)! }));
    const unknown = [...counts.keys()]
      .filter((id) => !groups.some((g) => g.id === id))
      .map((id) => ({
        id,
        name: sessions.find((s) => (s.group_id ?? '') === id)?.group_name || 'Không rõ nhóm',
        count: counts.get(id)!,
      }));
    return [...known, ...unknown];
  }, [sessions, groups]);

  const groupSessions = groupFilter === ALL_GROUPS ? sessions : sessions.filter((s) => (s.group_id ?? '') === groupFilter);
  const unsettledCount = groupSessions.filter((s) => !getPaymentSummary(s).settled).length;
  const visibleSessions = unsettledOnly ? groupSessions.filter((s) => !getPaymentSummary(s).settled) : groupSessions;
  const months = useMemo(() => groupSessionsByMonth(visibleSessions), [visibleSessions]);

  /** Đánh dấu / bỏ đánh dấu 1 người. Giao diện đổi ngay, lỗi thì trang tự báo và trả lại như cũ. */
  function handleSetPayment(bill: TSession, playerId: string, method: TPaymentMethod | null) {
    if (!bill.id) return;
    void onUpdatePayments(bill.id, [playerId], method);
  }

  async function handleMarkAllPaid(bill: TSession) {
    if (!bill.id) return;
    const playerIds = unpaidPlayerIds(bill);
    const count = playerIds.length;
    if (count === 0) return;
    const ok = await confirm({
      title: 'Đánh dấu tất cả đã chuyển?',
      description: `${count} người còn lại của buổi "${buildSessionTitle(bill.iso_date)}" sẽ được đánh dấu đã chuyển khoản. Bạn vẫn có thể bỏ đánh dấu từng người sau.`,
      confirmLabel: 'Đánh dấu',
    });
    if (!ok) return;
    if (await onUpdatePayments(bill.id, playerIds, 'TRANSFER')) toast.success(`Đã đánh dấu ${count} người đã chuyển.`);
  }

  async function handleDelete(bill: TSession) {
    if (!bill.id) return;
    const ok = await confirm({
      title: 'Xóa buổi chơi này?',
      description: `Buổi "${buildSessionTitle(bill.iso_date)}" (${bill.session_players.length} người, ${formatVND(bill.total_cost)}) sẽ bị xóa vĩnh viễn khỏi lịch sử.`,
      confirmLabel: 'Xóa',
      destructive: true,
    });
    if (!ok) return;
    setDeletingId(bill.id);
    try {
      await onDelete(bill.id);
      toast.success(`Đã xóa buổi ${buildSessionTitle(bill.iso_date)}.`);
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

      {sessions.length > 0 && (
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
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
          <button
            type="button"
            onClick={() => setUnsettledOnly((v) => !v)}
            aria-pressed={unsettledOnly}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
              unsettledOnly
                ? 'border-amber-600 bg-amber-600 text-white'
                : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100',
            )}
          >
            Chưa thu đủ ({unsettledCount})
          </button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading && sessions.length === 0 ? (
        <HistorySkeleton />
      ) : sessions.length === 0 ? (
        <HistoryEmpty />
      ) : visibleSessions.length === 0 ? (
        <HistoryAllSettled />
      ) : (
        <div className="flex flex-col gap-3">
          {months.map((month) => (
            <section key={month.key} className="flex flex-col gap-2" aria-label={month.label}>
              <HistoryMonthHeader
                label={month.label}
                count={month.sessions.length}
                total={month.total}
                outstanding={month.sessions.reduce((sum, s) => sum + getPaymentSummary(s).outstanding, 0)}
              />
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
                      onSetPayment={(playerId, method) => handleSetPayment(bill, playerId, method)}
                      onMarkAllPaid={() => handleMarkAllPaid(bill)}
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

/** Đang lọc "Chưa thu đủ" nhưng mọi buổi đều đã thu đủ. */
function HistoryAllSettled() {
  return (
    <Card className="border border-dashed ring-0">
      <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-emerald-50">
          <CircleCheck className="size-6 text-emerald-600" />
        </div>
        <p className="font-semibold text-gray-800">Tất cả buổi chơi đã thu đủ tiền</p>
      </CardContent>
    </Card>
  );
}

/** Chưa có buổi chơi nào được lưu. */
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
