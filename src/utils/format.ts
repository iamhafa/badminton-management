export const SHUTTLES_PER_TUBE = 12;

/** Các mức trần nữ chọn nhanh (dùng ở form tính tiền và form nhóm). */
export const FEMALE_CAP_PRESETS = [40000, 50000, 60000];

/** 50000 -> '50.000đ' */
export function formatVND(amount: number): string {
  return `${Math.round(amount).toLocaleString('vi-VN')}đ`;
}

/** Mô tả số tiền phải đóng / hoàn lại của 1 người. */
export function describePayable(amount: number): string {
  if (amount < 0) return `Hoàn lại ${formatVND(-amount)}`;
  return formatVND(amount);
}
