'use client';

import RoleBadge from '@/components/common/RoleBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { Gender } from '@/types/player.types';
import type { TPlayerBreakdown, TSessionBill } from '@/types/session.types';
import { formatDateTimeVN } from '@/utils/date';
import { describePayable, formatVND } from '@/utils/format';
import { cn } from 'cn';
import { ChevronDown, Droplet, Feather, Grid2X2, LoaderCircle, MapPin, Mars, Trash2, Venus } from 'lucide-react';
import type { ReactNode } from 'react';
import { sessionDateParts } from '../utils/month';

interface HistorySessionCardProps {
  bill: TSessionBill;
  groupName: string;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  deleting: boolean;
  cloudOnline: boolean;
  onDelete: () => void;
}

/** Thẻ 1 buổi chơi trong lịch sử: tóm tắt khi đóng, chi phí + từng người + thao tác khi mở. */
export default function HistorySessionCard({
  bill,
  groupName,
  expanded,
  onExpandedChange,
  deleting,
  cloudOnline,
  onDelete,
}: HistorySessionCardProps) {
  const females = bill.playerBreakdowns.filter((p) => p.gender === 'FEMALE');
  const males = bill.playerBreakdowns.filter((p) => p.gender === 'MALE');

  return (
    <Card className="py-0 transition-colors hover:border-emerald-300">
      <Collapsible open={expanded} onOpenChange={onExpandedChange}>
        <CollapsibleTrigger className="flex w-full items-center gap-3 p-3 text-left sm:p-4">
          <DateTile isoDate={bill.isoDate} />

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="truncate font-semibold text-gray-900">{groupName}</p>
            <p className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{bill.courtName || 'Chưa rõ sân'}</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {bill.femaleCount > 0 && <RateChip gender="FEMALE" count={bill.femaleCount} amount={bill.roundedFemaleUnit} />}
              {bill.maleCount > 0 && <RateChip gender="MALE" count={bill.maleCount} amount={bill.roundedMaleUnit} />}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-0.5">
            <span className="text-base font-bold text-[#059669] sm:text-lg">{formatVND(bill.totalCost)}</span>
            <span className="text-[11px] text-muted-foreground">{bill.totalCount} người</span>
          </div>
          <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="flex flex-col gap-3 border-t p-3 sm:p-4">
            <CostTiles bill={bill} />

            <p className="text-[11px] text-muted-foreground">
              Trần nữ {formatVND(bill.femaleCap)} · Lưu lúc {formatDateTimeVN(bill.createdAt)}
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <PlayerColumn gender="FEMALE" players={females} bill={bill} />
              <PlayerColumn gender="MALE" players={males} bill={bill} />
            </div>

            <div className="flex items-center justify-end gap-2 border-t pt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                disabled={deleting || !cloudOnline}
                className="text-destructive hover:bg-red-50 hover:text-destructive"
              >
                {deleting ? <LoaderCircle className="animate-spin" /> : <Trash2 />}
                Xóa
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

/** Ô lịch nhỏ: thứ, ngày, tháng. */
function DateTile({ isoDate }: { isoDate: string }) {
  const parts = sessionDateParts(isoDate);
  return (
    <div className="flex w-12 shrink-0 flex-col items-center rounded-lg border border-emerald-200 bg-emerald-50 py-1.5 leading-none">
      <span className="text-[10px] font-bold uppercase text-emerald-700">{parts?.weekday ?? '--'}</span>
      <span className="mt-1 text-xl font-black text-gray-900">{parts?.day ?? '?'}</span>
      <span className="mt-0.5 text-[10px] text-gray-500">{parts?.month ?? ''}</span>
    </div>
  );
}

/** Nhãn mức đóng theo giới tính, cùng màu với màn hình tính tiền (hồng: nữ, xanh: nam). */
function RateChip({ gender, count, amount }: { gender: Gender; count: number; amount: number }) {
  const female = gender === 'FEMALE';
  const Icon = female ? Venus : Mars;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
        female ? 'bg-pink-100 text-[#be185d]' : 'bg-blue-100 text-[#1d4ed8]',
      )}
    >
      <Icon className="size-3" />
      {count} · {formatVND(amount)}
    </span>
  );
}

/** Ba ô chi phí: sân, cầu, nước (nếu có). */
function CostTiles({ bill }: { bill: TSessionBill }) {
  const hasWater = bill.waterFee > 0;
  return (
    <div className={cn('grid gap-2', hasWater ? 'grid-cols-3' : 'grid-cols-2')}>
      <CostTile
        icon={<Grid2X2 className="size-3.5" />}
        label={`Sân (${bill.hoursPlayed}h)`}
        amount={bill.courtFee}
        className="border-emerald-200 bg-emerald-50/60 text-emerald-800"
      />
      <CostTile
        icon={<Feather className="size-3.5" />}
        label={`${bill.shuttleBrand || 'Cầu'} (${bill.shuttlesUsed} quả)`}
        amount={bill.shuttleTotalCost}
        className="border-[#fde68a] bg-[#fffdf0] text-[#b45309]"
      />
      {hasWater && (
        <CostTile
          icon={<Droplet className="size-3.5" />}
          label={`Nước (${bill.waterDrinkersCount} người)`}
          amount={bill.waterFee}
          className="border-[#bfdbfe] bg-[#f0f7ff] text-[#1d4ed8]"
        />
      )}
    </div>
  );
}

function CostTile({ icon, label, amount, className }: { icon: ReactNode; label: string; amount: number; className: string }) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-0.5 rounded-lg border px-2.5 py-2', className)}>
      <span className="flex min-w-0 items-start gap-1 text-[11px] leading-tight font-medium">
        {icon}
        <span className="wrap-break-word">{label}</span>
      </span>
      <span className="text-sm font-bold text-gray-900">{formatVND(amount)}</span>
    </div>
  );
}

/** Danh sách người chơi của 1 giới tính và số tiền từng người. */
function PlayerColumn({ gender, players, bill }: { gender: Gender; players: TPlayerBreakdown[]; bill: TSessionBill }) {
  if (players.length === 0) return null;
  const female = gender === 'FEMALE';
  return (
    <div className="flex flex-col gap-1">
      <p
        className={cn(
          'flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide',
          female ? 'text-[#be185d]' : 'text-[#1d4ed8]',
        )}
      >
        {female ? <Venus className="size-3.5" /> : <Mars className="size-3.5" />}
        {female ? 'Nữ' : 'Nam'} ({players.length})
      </p>
      <ul className="divide-y rounded-lg border">
        {players.map((p) => (
          <li key={p.id} className="flex items-center gap-2 px-2.5 py-1.5 text-sm">
            <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <span className="truncate font-medium">{p.name}</span>
              <RoleBadge role={p.role} />
              {p.type === 'GUEST' && (
                <span
                  className={cn(
                    'text-xs',
                    p.guestSource === 'FACEBOOK' ? 'font-semibold text-blue-600' : 'text-muted-foreground',
                  )}
                >
                  {p.guestSource === 'FACEBOOK' ? 'vãng lai FB' : 'vãng lai'}
                </span>
              )}
              {p.waterCredit > 0 && <span className="text-xs text-amber-600">ứng nước {formatVND(p.waterCredit)}</span>}
              {p.drinksWater === false && bill.waterFee > 0 && <span className="text-xs text-muted-foreground">không nước</span>}
            </span>
            <span className={cn('shrink-0 font-semibold', p.roundedPayable < 0 ? 'text-amber-600' : 'text-gray-900')}>
              {describePayable(p.roundedPayable)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
