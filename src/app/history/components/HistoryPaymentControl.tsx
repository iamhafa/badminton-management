'use client';

import type { TPaymentMethod, TSessionPlayer } from '@/types/session.type';
import { cn } from 'cn';
import { Check } from 'lucide-react';
import { formatPaidAt, needsPayment, PAYMENT_METHOD_LABELS } from '../utils/payment';

interface HistoryPaymentControlProps {
  player: TSessionPlayer;
  disabled: boolean;
  /** Đánh dấu bằng hình thức `method`, hoặc `null` để bỏ đánh dấu. */
  onChange: (method: TPaymentMethod | null) => void;
}

/**
 * Nút chuyển đổi trạng thái thanh toán của 1 người:
 * - Khi chưa đóng: Nút bo tròn màu cam [Chưa đóng], hover vào đổi sang màu xanh [Xác nhận]. Click để xác nhận thanh toán (mặc định CK).
 * - Sau khi click (Đã thu): Chữ "✓ Đã thu" màu xanh lá. Chạm lại để khôi phục về trạng thái "Chưa đóng".
 */
export default function HistoryPaymentControl({ player, disabled, onChange }: HistoryPaymentControlProps) {
  if (!needsPayment(player)) return null;
  const refund = player.rounded_payable < 0;
  const verb = refund ? 'đã hoàn' : 'đã thu';
  const unpaidLabel = refund ? 'Chưa hoàn' : 'Chưa đóng';
  const paidLabel = refund ? 'Đã hoàn' : 'Đã thu';

  if (player.paid_method) {
    const label = PAYMENT_METHOD_LABELS[player.paid_method];
    const paidAt = formatPaidAt(player.paid_at);
    return (
      <button
        type="button"
        onClick={() => onChange(null)}
        disabled={disabled}
        title={`${player.name} ${verb} (${label.long}) lúc ${paidAt}. Chạm để khôi phục về "${unpaidLabel}".`}
        className="inline-flex w-20.5 shrink-0 items-center justify-end gap-1 text-xs font-semibold text-emerald-700 transition-colors hover:text-emerald-800 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Check className="size-3.5 stroke-[2.5]" />
        <span>{paidLabel}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onChange('TRANSFER')}
      onContextMenu={(e) => {
        e.preventDefault();
        onChange('CASH');
      }}
      disabled={disabled}
      title={`Chạm để xác nhận ${player.name} ${verb} (mặc định Chuyển khoản, chuột phải để chọn Tiền mặt)`}
      className={cn(
        'group inline-flex h-6 w-18 shrink-0 items-center justify-center rounded-full border text-xs font-medium whitespace-nowrap transition-all select-none',
        'border-amber-300 bg-amber-50/70 text-amber-800',
        'hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700',
        'disabled:cursor-not-allowed disabled:opacity-50',
      )}
    >
      <span className="group-hover:hidden">{unpaidLabel}</span>
      <span className="hidden group-hover:inline">Xác nhận</span>
    </button>
  );
}
