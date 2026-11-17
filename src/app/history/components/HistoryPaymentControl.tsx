'use client';

import type { TPaymentMethod, TSessionPlayer } from '@/types/session.type';
import { cn } from 'cn';
import { Check } from 'lucide-react';
import { formatPaidAt, needsPayment, PAYMENT_METHOD_LABELS, PAYMENT_METHODS } from '../utils/payment';

interface HistoryPaymentControlProps {
  player: TSessionPlayer;
  disabled: boolean;
  /** Đánh dấu bằng hình thức `method`, hoặc `null` để bỏ đánh dấu. */
  onChange: (method: TPaymentMethod | null) => void;
}

/**
 * Trạng thái chuyển tiền của 1 người.
 * - Chưa chuyển: hai nút [CK] [TM], bấm một lần là xong.
 * - Đã chuyển: nhãn xanh kèm hình thức và giờ đánh dấu, bấm để bỏ đánh dấu.
 * Người được hoàn tiền (số tiền âm) dùng chữ "hoàn" thay cho "chuyển". Người không cần trả gì thì không hiện.
 */
export default function HistoryPaymentControl({ player, disabled, onChange }: HistoryPaymentControlProps) {
  if (!needsPayment(player)) return null;
  const refund = player.rounded_payable < 0;
  const verb = refund ? 'đã hoàn' : 'đã chuyển';

  if (player.paid_method) {
    const label = PAYMENT_METHOD_LABELS[player.paid_method];
    const paidAt = formatPaidAt(player.paid_at);
    return (
      <button
        type="button"
        onClick={() => onChange(null)}
        disabled={disabled}
        title={`${player.name} ${verb} (${label.long}) lúc ${paidAt}. Bấm để bỏ đánh dấu.`}
        className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Check className="size-3" />
        {refund ? `Đã hoàn ${label.short}` : label.short}
        <span className="font-normal text-emerald-600">· {paidAt}</span>
      </button>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1" role="group" aria-label={`Đánh dấu ${player.name} ${verb}`}>
      {PAYMENT_METHODS.map((method) => (
        <button
          key={method}
          type="button"
          onClick={() => onChange(method)}
          disabled={disabled}
          title={`Đánh dấu ${player.name} ${verb} bằng ${PAYMENT_METHOD_LABELS[method].long.toLowerCase()}`}
          className={cn(
            'rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-[11px] font-semibold text-gray-600 transition-colors',
            'hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          {PAYMENT_METHOD_LABELS[method].short}
        </button>
      ))}
    </div>
  );
}
