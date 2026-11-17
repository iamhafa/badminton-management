import type { TPaymentMethod, TSession, TSessionPlayer } from '@/types/session.type';
import { format, isValid, parseISO } from 'date-fns';

// Các hàm thuần về tình trạng chuyển tiền của 1 buổi chơi.
// Quy ước theo số tiền đã làm tròn của từng người (`rounded_payable`):
// > 0: phải chuyển tiền; < 0: được hoàn tiền (VD: người ứng tiền nước); = 0: không cần làm gì.
// Trạng thái chuyển tiền nằm ngay trên từng người: `paid_method` / `paid_at` (null = chưa chuyển).

export const PAYMENT_METHODS: TPaymentMethod[] = ['TRANSFER', 'CASH'];

export const PAYMENT_METHOD_LABELS: Record<TPaymentMethod, { short: string; long: string }> = {
  TRANSFER: { short: 'CK', long: 'Chuyển khoản' },
  CASH: { short: 'TM', long: 'Tiền mặt' },
};

export type TPaymentSummary = {
  /** Số người cần chuyển hoặc được hoàn (số tiền khác 0). */
  dueCount: number;
  /** Trong số đó, bao nhiêu người đã được đánh dấu. */
  doneCount: number;
  /** Tổng tiền những người chưa chuyển (chỉ tính người phải trả). */
  outstanding: number;
  /** Tổng tiền chưa hoàn cho những người được hoàn. */
  refundPending: number;
  /** Mọi người cần chuyển / được hoàn đều đã được đánh dấu. */
  settled: boolean;
};

/** Người này có cần chuyển hoặc được hoàn tiền không. */
export function needsPayment(player: TSessionPlayer): boolean {
  return player.rounded_payable !== 0;
}

export function getPaymentSummary(session: TSession): TPaymentSummary {
  let dueCount = 0;
  let doneCount = 0;
  let outstanding = 0;
  let refundPending = 0;
  for (const p of session.session_players) {
    if (!needsPayment(p)) continue;
    dueCount++;
    if (p.paid_method) {
      doneCount++;
    } else if (p.rounded_payable > 0) {
      outstanding += p.rounded_payable;
    } else {
      refundPending += -p.rounded_payable;
    }
  }
  return { dueCount, doneCount, outstanding, refundPending, settled: doneCount === dueCount };
}

/** Id những người còn cần đánh dấu (chưa chuyển / chưa hoàn). */
export function unpaidPlayerIds(session: TSession): string[] {
  return session.session_players.filter((p) => needsPayment(p) && !p.paid_method).map((p) => p.player_id);
}

/** ISO -> 'HH:mm dd/MM' (ngắn gọn để hiện cạnh nhãn đã chuyển). */
export function formatPaidAt(paidAt: string | null): string {
  if (!paidAt) return '';
  const date = parseISO(paidAt);
  return isValid(date) ? format(date, 'HH:mm dd/MM') : '';
}
