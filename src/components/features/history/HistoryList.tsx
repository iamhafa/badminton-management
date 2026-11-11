'use client';

import RoleBadge, { GenderTag } from '@/components/common/RoleBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useConfirm } from '@/hooks/useConfirm';
import type { TGroup } from '@/types/group.types';
import type { TSessionBill } from '@/types/session.types';
import { formatDateTimeVN } from '@/utils/date';
import { describePayable, formatVND } from '@/utils/format';
import { buildMessengerText } from '@/utils/messenger';
import { cn } from 'cn';
import { Check, ChevronDown, Copy, LoaderCircle, MapPin, RotateCcw, Trash2, UsersRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useBoolean, useCopyToClipboard, useTimeout } from 'usehooks-ts';

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
const COPIED_LABEL_MS = 2000;

export default function HistoryList({ sessions, groups, loading, error, cloudOnline, onRefresh, onDelete }: HistoryListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [groupFilter, setGroupFilter] = useState<string>(ALL_GROUPS);
  const confirm = useConfirm();

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
        <p className="text-sm text-muted-foreground">Đang tải lịch sử...</p>
      ) : visibleSessions.length === 0 ? (
        <Card className="border border-dashed ring-0">
          <CardContent className="text-center text-muted-foreground">Chưa có buổi chơi nào được lưu.</CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {visibleSessions.map((bill) => {
            const expanded = expandedId === bill.id;
            return (
              <li key={bill.id}>
                <Card className="py-0">
                  <Collapsible open={expanded} onOpenChange={(open) => setExpandedId(open ? (bill.id ?? null) : null)}>
                    <CollapsibleTrigger className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/50">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold">{bill.title}</div>
                        <div className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <UsersRound className="size-3" />
                            {groupNameOf(bill)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3" />
                            {bill.courtName || 'Chưa rõ sân'}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {bill.totalCount} người ({bill.maleCount} nam, {bill.femaleCount} nữ) · Nam{' '}
                          {formatVND(bill.roundedMaleUnit)} · Nữ {formatVND(bill.roundedFemaleUnit)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-primary">{formatVND(bill.totalCost)}</div>
                        <div className="text-[11px] text-muted-foreground">Lưu lúc {formatDateTimeVN(bill.createdAt)}</div>
                      </div>
                      <ChevronDown
                        className={cn('size-4 shrink-0 text-muted-foreground transition-transform', expanded && 'rotate-180')}
                      />
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="border-t p-4">
                        <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground sm:grid-cols-4">
                          <span>Sân: {formatVND(bill.courtFee)}</span>
                          <span>
                            Cầu{bill.shuttleBrand ? ` ${bill.shuttleBrand}` : ''}: {formatVND(bill.shuttleTotalCost)} (
                            {bill.shuttlesUsed} quả)
                          </span>
                          <span>Nước: {formatVND(bill.waterFee)}</span>
                          <span>
                            {bill.hoursPlayed} giờ · Trần nữ {formatVND(bill.femaleCap)}
                          </span>
                        </div>

                        <ul className="divide-y">
                          {bill.playerBreakdowns.map((p) => (
                            <li key={p.id} className="flex items-center gap-2 py-1.5">
                              <span className="min-w-0 truncate">
                                {p.name}
                                {p.type === 'GUEST' && (
                                  <span
                                    className={cn(
                                      'ml-1 text-xs',
                                      p.guestSource === 'FACEBOOK' ? 'text-blue-600 font-semibold' : 'text-muted-foreground',
                                    )}
                                  >
                                    ({p.guestSource === 'FACEBOOK' ? 'vãng lai FB' : 'vãng lai'})
                                  </span>
                                )}
                                {p.waterCredit > 0 && (
                                  <span className="ml-1 text-xs text-amber-600">· ứng nước {formatVND(p.waterCredit)}</span>
                                )}
                                {p.drinksWater === false && bill.waterFee > 0 && (
                                  <span className="ml-1 text-xs text-muted-foreground">· không nước</span>
                                )}
                              </span>
                              <RoleBadge role={p.role} />
                              <GenderTag gender={p.gender} className="ml-auto" />
                              <span
                                className={cn('w-28 shrink-0 text-right font-medium', p.roundedPayable < 0 && 'text-amber-600')}
                              >
                                {describePayable(p.roundedPayable)}
                              </span>
                            </li>
                          ))}
                        </ul>

                        <div className="mt-3 flex justify-end gap-2">
                          <CopyBillButton bill={bill} groupName={groupNameOf(bill)} />
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(bill)}
                            disabled={deletingId === bill.id || !cloudOnline}
                          >
                            {deletingId === bill.id ? <LoaderCircle className="animate-spin" /> : <Trash2 />}
                            Xóa
                          </Button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** Nút copy bill. Mỗi buổi chơi có trạng thái "Đã copy" riêng và tự trở về nhãn cũ sau `COPIED_LABEL_MS`. */
function CopyBillButton({ bill, groupName }: { bill: TSessionBill; groupName: string }) {
  const [, copy] = useCopyToClipboard();
  const { value: copied, setTrue: markCopied, setFalse: resetCopied } = useBoolean(false);
  useTimeout(resetCopied, copied ? COPIED_LABEL_MS : null);

  async function handleCopy() {
    if (await copy(buildMessengerText({ ...bill, groupName }))) {
      markCopied();
      toast.success('Đã copy bill, dán vào Messenger nhé!');
    } else {
      toast.error('Không copy được, hãy thử lại.');
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
      {copied ? <Check /> : <Copy />}
      {copied ? 'Đã copy' : 'Copy Bill'}
    </Button>
  );
}
