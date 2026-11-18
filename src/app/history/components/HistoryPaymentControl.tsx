'use client';

import type { TSessionPlayer } from '@/types/session.type';
import { cn } from 'cn';
import { Check } from 'lucide-react';
import { formatPaidAt, needsPayment } from '../utils/payment';

interface HistoryPaymentControlProps {
  player: TSessionPlayer;
  disabled: boolean;
  /** `true` = đánh dấu đã thu (chuyển khoản), `false` = bỏ đánh dấu. */
  onChange: (paid: boolean) => void;
}

/**
 * Nút trạng thái thanh toán của 1 người (mọi khoản thu đều là chuyển khoản):
 * - Chưa đóng: nút bo tròn màu cam [Chưa đóng]. Chạm để xác nhận đã thu.
 * - Đã thu: chữ "✓ Đã thu" màu xanh lá. Chạm lại để bỏ đánh dấu.
 * Cả hai trạng thái cùng chiều rộng để cột số tiền không bị xô lệch, và có vùng chạm
 * rộng hơn phần nhìn thấy (`after:-inset-2`) để dễ bấm trên điện thoại.
 */
export default function HistoryPaymentControl({ player, disabled, onChange }: HistoryPaymentControlProps) {
  if (!needsPayment(player)) return null;
  const refund = player.rounded_payable < 0;
  const verb = refund ? 'đã hoàn' : 'đã thu';
  const unpaidLabel = refund ? 'Chưa hoàn' : 'Chưa đóng';
  const paidLabel = refund ? 'Đã hoàn' : 'Đã thu';
  const isPaid = Boolean(player.paid_method);

  const base = cn(
    'relative inline-flex h-7 w-20 shrink-0 items-center justify-center gap-1 rounded-full text-xs whitespace-nowrap',
    'touch-manipulation select-none transition-[color,background-color,border-color,transform] duration-150',
    'after:absolute after:-inset-x-1 after:-inset-y-2 active:scale-95',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
  );

  if (isPaid) {
    return (
      <button
        type="button"
        onClick={() => onChange(false)}
        disabled={disabled}
        title={`${player.name} ${verb} lúc ${formatPaidAt(player.paid_at)}. Chạm để bỏ đánh dấu.`}
        className={cn(base, 'font-semibold text-emerald-700 hover:bg-emerald-50 active:bg-emerald-100')}
      >
        <Check className="size-3.5 stroke-[2.5]" />
        <span>{paidLabel}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onChange(true)}
      disabled={disabled}
      title={`Chạm để xác nhận ${player.name} ${verb}`}
      className={cn(
        base,
        'group border font-medium',
        'border-amber-300 bg-amber-50/70 text-amber-800',
        'hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700',
        'active:border-emerald-400 active:bg-emerald-50 active:text-emerald-700',
      )}
    >
      <span className="group-hover:hidden">{unpaidLabel}</span>
      <span className="hidden group-hover:inline">Xác nhận</span>
    </button>
  );
}
