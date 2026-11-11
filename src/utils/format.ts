import type { TPlayer } from '@/types/player.types';
import type { TSessionBill } from '@/types/session.types';

export const SHUTTLES_PER_TUBE = 12;

/** Các mức trần nữ chọn nhanh (dùng ở form tính tiền và form nhóm). */
export const FEMALE_CAP_PRESETS = [40000, 50000, 60000];

/** Tổng tiền thực thu sau làm tròn (có thể lệch vài nghìn so với tổng chi phí). */
export function sumRoundedPayable(bill: TSessionBill): number {
  return bill.playerBreakdowns.reduce((sum, p) => sum + p.roundedPayable, 0);
}

/** 50000 -> '50.000đ' */
export function formatVND(amount: number): string {
  return `${Math.round(amount).toLocaleString('vi-VN')}đ`;
}

export function genderLabel(gender: TPlayer['gender']): string {
  return gender === 'FEMALE' ? 'Nữ' : 'Nam';
}

/** Mô tả số tiền phải đóng / hoàn lại của 1 người. */
export function describePayable(amount: number): string {
  if (amount < 0) return `Hoàn lại ${formatVND(-amount)}`;
  return formatVND(amount);
}
