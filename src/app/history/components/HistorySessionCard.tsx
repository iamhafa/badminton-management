'use client';

import RoleBadge from '@/components/common/RoleBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { Gender } from '@/types/player.type';
import type { TPaymentMethod, TSession, TSessionPlayer } from '@/types/session.type';
import { formatDateTimeVN } from '@/utils/date';
import { describePayable, formatVND } from '@/utils/format';
import { countPlayers } from '@/utils/session';
import { cn } from 'cn';
import {
  CheckCheck,
  ChevronDown,
  CircleCheck,
  Droplet,
  Feather,
  Grid2X2,
  LoaderCircle,
  MapPin,
  Mars,
  Trash2,
  Venus,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { sessionDateParts } from '../utils/month';
import { getPaymentSummary, type TPaymentSummary } from '../utils/payment';
import HistoryPaymentControl from './HistoryPaymentControl';

interface HistorySessionCardProps {
  bill: TSession;
  groupName: string;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  deleting: boolean;
  cloudOnline: boolean;
  onDelete: () => void;
  /** Đánh dấu 1 người đã chuyển bằng `method`, hoặc `null` để bỏ đánh dấu. */
  onSetPayment: (playerId: string, method: TPaymentMethod | null) => void;
  /** Đánh dấu mọi người còn lại là đã chuyển (chuyển khoản). */
  onMarkAllPaid: () => void;
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
  onSetPayment,
  onMarkAllPaid,
}: HistorySessionCardProps) {
  const females = bill.session_players.filter((p) => p.gender === 'FEMALE');
  const males = bill.session_players.filter((p) => p.gender === 'MALE');
  const { totalCount, maleCount, femaleCount } = countPlayers(bill.session_players);
  const summary = getPaymentSummary(bill);
  const paymentDisabled = !cloudOnline;

  return (
    <Card className="py-0 transition-colors hover:border-emerald-300">
      <Collapsible open={expanded} onOpenChange={onExpandedChange}>
        <CollapsibleTrigger className="flex w-full items-center gap-3 p-3 text-left sm:p-4">
          <DateTile isoDate={bill.iso_date} />

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="truncate font-semibold text-gray-900">{groupName}</p>
            <p className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{bill.court_name || 'Chưa rõ sân'}</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {femaleCount > 0 && <RateChip gender="FEMALE" count={femaleCount} amount={bill.rounded_female_unit} />}
              {maleCount > 0 && <RateChip gender="MALE" count={maleCount} amount={bill.rounded_male_unit} />}
            </div>
            <PaymentProgress summary={summary} />
          </div>

          <div className="flex shrink-0 flex-col items-end gap-0.5">
            <span className="text-base font-bold text-[#059669] sm:text-lg">{formatVND(bill.total_cost)}</span>
            <span className="text-[11px] text-muted-foreground">{totalCount} người</span>
          </div>
          <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="flex flex-col gap-3 border-t p-3 sm:p-4">
            <CostTiles bill={bill} />

            <p className="text-[11px] text-muted-foreground">
              Trần nữ {formatVND(bill.female_cap)} · Lưu lúc {formatDateTimeVN(bill.created_at)}
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <PlayerColumn
                gender="FEMALE"
                players={females}
                bill={bill}
                paymentDisabled={paymentDisabled}
                onSetPayment={onSetPayment}
              />
              <PlayerColumn
                gender="MALE"
                players={males}
                bill={bill}
                paymentDisabled={paymentDisabled}
                onSetPayment={onSetPayment}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
              {summary.settled ? (
                <span />
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onMarkAllPaid}
                  disabled={paymentDisabled}
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                >
                  <CheckCheck /> Đánh dấu tất cả đã chuyển (CK)
                </Button>
              )}
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

/** Tiến độ thu tiền: thanh tiến độ + "5/8 đã chuyển · còn thiếu 165.000đ", hoặc nhãn "Đã thu đủ". */
function PaymentProgress({ summary }: { summary: TPaymentSummary }) {
  if (summary.dueCount === 0) return null;
  if (summary.settled) {
    return (
      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
        <CircleCheck className="size-3" /> Đã thu đủ
      </span>
    );
  }
  const percent = Math.round((summary.doneCount / summary.dueCount) * 100);
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div
        className="hidden h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-gray-200 sm:block"
        role="progressbar"
        aria-label="Tiến độ thu tiền"
        aria-valuenow={summary.doneCount}
        aria-valuemin={0}
        aria-valuemax={summary.dueCount}
      >
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
      </div>
      <span className="min-w-0 text-[11px] text-gray-600">
        {summary.doneCount}/{summary.dueCount}
        <span className="hidden sm:inline"> đã chuyển</span>
        {summary.outstanding > 0 && (
          <>
            {' · '}
            <span className="hidden sm:inline">còn </span>thiếu{' '}
            <span className="font-semibold text-amber-700">{formatVND(summary.outstanding)}</span>
          </>
        )}
        {summary.refundPending > 0 && <> · chưa hoàn {formatVND(summary.refundPending)}</>}
      </span>
    </div>
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
function CostTiles({ bill }: { bill: TSession }) {
  const hasWater = bill.water_fee > 0;
  return (
    <div className={cn('grid gap-2', hasWater ? 'grid-cols-3' : 'grid-cols-2')}>
      <CostTile
        icon={<Grid2X2 className="size-3.5" />}
        label={`Sân (${bill.hours_played}h)`}
        amount={bill.court_fee}
        className="border-emerald-200 bg-emerald-50/60 text-emerald-800"
      />
      <CostTile
        icon={<Feather className="size-3.5" />}
        label={`${bill.shuttle_brand || 'Cầu'} (${bill.shuttles_used} quả)`}
        amount={bill.shuttle_total_cost}
        className="border-[#fde68a] bg-[#fffdf0] text-[#b45309]"
      />
      {hasWater && (
        <CostTile
          icon={<Droplet className="size-3.5" />}
          label={`Nước (${bill.water_drinkers_count} người)`}
          amount={bill.water_fee}
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

interface PlayerColumnProps {
  gender: Gender;
  players: TSessionPlayer[];
  bill: TSession;
  paymentDisabled: boolean;
  onSetPayment: (playerId: string, method: TPaymentMethod | null) => void;
}

/** Danh sách người chơi của 1 giới tính, số tiền và trạng thái chuyển tiền của từng người. */
function PlayerColumn({ gender, players, bill, paymentDisabled, onSetPayment }: PlayerColumnProps) {
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
          <li key={p.player_id} className="flex items-center gap-2 px-2.5 py-1.5 text-sm">
            <span className={cn('flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-0.5', p.paid_method && 'opacity-50')}>
              <span className="truncate font-medium">{p.name}</span>
              <RoleBadge role={p.role} />
              {p.type === 'GUEST' && (
                <span
                  className={cn(
                    'text-xs',
                    p.guest_source === 'FACEBOOK' ? 'font-semibold text-blue-600' : 'text-muted-foreground',
                  )}
                >
                  {p.guest_source === 'FACEBOOK' ? 'vãng lai FB' : 'vãng lai'}
                </span>
              )}
              {p.water_credit > 0 && <span className="text-xs text-amber-600">ứng nước {formatVND(p.water_credit)}</span>}
              {!p.drinks_water && bill.water_fee > 0 && <span className="text-xs text-muted-foreground">không nước</span>}
            </span>
            <span
              className={cn(
                'shrink-0 font-semibold',
                p.rounded_payable < 0 ? 'text-amber-600' : 'text-gray-900',
                p.paid_method && 'opacity-50',
              )}
            >
              {describePayable(p.rounded_payable)}
            </span>
            <HistoryPaymentControl
              player={p}
              disabled={paymentDisabled}
              onChange={(method) => onSetPayment(p.player_id, method)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
