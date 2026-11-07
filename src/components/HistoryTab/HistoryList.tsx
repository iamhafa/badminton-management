'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { buildMessengerText, describePayable, formatVND } from '@/libs/calculator';
import { formatDateTimeVN } from '@/libs/date-utils';
import { cn, copyToClipboard } from '@/libs/utils';
import type { SessionBill } from '@/types/badminton';
import { Check, ChevronDown, Copy, LoaderCircle, RotateCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useConfirm } from '../../hooks/useConfirm';
import RoleBadge, { GenderTag } from '../RoleBadge';

interface HistoryListProps {
  sessions: SessionBill[];
  loading: boolean;
  error: string | null;
  cloudOnline: boolean;
  onRefresh: () => void;
  onDelete: (id: string) => Promise<void>;
}

export default function HistoryList({ sessions, loading, error, cloudOnline, onRefresh, onDelete }: HistoryListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { confirm, confirmDialog } = useConfirm();

  async function handleCopy(bill: SessionBill) {
    if (await copyToClipboard(buildMessengerText(bill))) {
      setCopiedId(bill.id ?? null);
      toast.success('Đã copy bill, dán vào Messenger nhé!');
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      toast.error('Không copy được, hãy thử lại.');
    }
  }

  async function handleDelete(bill: SessionBill) {
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
        <h2 className="text-base font-semibold">Lịch sử buổi chơi ({sessions.length})</h2>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading || !cloudOnline}>
          <RotateCcw className={cn(loading && 'animate-spin')} /> Tải lại
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading && sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">Đang tải lịch sử...</p>
      ) : sessions.length === 0 ? (
        <Card className="border border-dashed ring-0">
          <CardContent className="text-center text-muted-foreground">Chưa có buổi chơi nào được lưu.</CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {sessions.map((bill) => {
            const expanded = expandedId === bill.id;
            return (
              <li key={bill.id}>
                <Card className="py-0">
                  <Collapsible open={expanded} onOpenChange={(open) => setExpandedId(open ? (bill.id ?? null) : null)}>
                    <CollapsibleTrigger className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/50">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold">{bill.title}</div>
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
                                {p.type === 'GUEST' && <span className="ml-1 text-xs text-muted-foreground">(vãng lai)</span>}
                                {p.waterCredit > 0 && (
                                  <span className="ml-1 text-xs text-amber-600">· ứng nước {formatVND(p.waterCredit)}</span>
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
                          <Button variant="outline" size="sm" onClick={() => handleCopy(bill)}>
                            {copiedId === bill.id ? <Check /> : <Copy />}
                            {copiedId === bill.id ? 'Đã copy' : 'Copy Bill'}
                          </Button>
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
      {confirmDialog}
    </section>
  );
}
