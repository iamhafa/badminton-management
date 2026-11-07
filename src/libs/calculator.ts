import { buildSessionTitle, formatDateVN } from './date-utils';
import { ORGANIZER_ID } from '@/types/badminton';
import type { Player, PlayerBreakdown, SessionBill, SessionInput } from '@/types/badminton';

export const SHUTTLES_PER_TUBE = 12;

/** Làm tròn hàng nghìn: phần lẻ < 500đ làm tròn xuống, >= 500đ làm tròn lên. */
export function roundToThousand(amount: number): number {
  const sign = amount < 0 ? -1 : 1;
  const absVal = Math.abs(amount);
  const remainder = absVal % 1000;
  const base = Math.floor(absVal / 1000) * 1000;
  return sign * (remainder >= 500 ? base + 1000 : base);
}

/** Tiền cầu = (Giá 1 ống / 12) × Số quả đã chơi */
export function calcShuttleCost(tubePrice: number, shuttlesUsed: number): number {
  return (tubePrice / SHUTTLES_PER_TUBE) * shuttlesUsed;
}

/** Tổng chi phí = Tiền sân + Tiền cầu + Tiền nước lọc */
export function calcTotalCost(input: SessionInput): number {
  return input.courtFee + calcShuttleCost(input.tubePrice, input.shuttlesUsed) + input.waterFee;
}

/** Phân bổ phí Nam / Nữ theo mức trần ưu tiên nữ. */
export function calcGenderShares(
  totalCost: number,
  maleCount: number,
  femaleCount: number,
  femaleCap: number,
): { maleShare: number; femaleShare: number } {
  const totalCount = maleCount + femaleCount;
  if (totalCount === 0) return { maleShare: 0, femaleShare: 0 };

  const average = totalCost / totalCount;
  if (average > femaleCap && maleCount > 0) {
    return {
      femaleShare: femaleCap,
      maleShare: (totalCost - femaleCap * femaleCount) / maleCount,
    };
  }
  return { maleShare: average, femaleShare: average };
}

/** Tính toàn bộ bill cho 1 buổi chơi. `players` là danh sách người đã tham gia (cố định + vãng lai). */
export function calculateBill(input: SessionInput, players: Player[], createdAt = ''): SessionBill {
  const maleCount = players.filter((p) => p.gender === 'MALE').length;
  const femaleCount = players.filter((p) => p.gender === 'FEMALE').length;
  const totalCount = maleCount + femaleCount;

  const shuttleTotalCost = calcShuttleCost(input.tubePrice, input.shuttlesUsed);
  const totalCost = input.courtFee + shuttleTotalCost + input.waterFee;
  const { maleShare, femaleShare } = calcGenderShares(totalCost, maleCount, femaleCount, input.femaleCap);

  const playerBreakdowns: PlayerBreakdown[] = players.map((player) => {
    const baseShare = player.gender === 'FEMALE' ? femaleShare : maleShare;
    const waterCredit =
      input.waterPayerId !== ORGANIZER_ID && input.waterPayerId === player.id ? input.waterFee : 0;
    const rawNetPayable = baseShare - waterCredit;
    return {
      ...player,
      baseShare,
      waterCredit,
      rawNetPayable,
      roundedPayable: roundToThousand(rawNetPayable),
    };
  });

  return {
    ...input,
    createdAt,
    dateFormatted: formatDateVN(input.isoDate),
    title: buildSessionTitle(input.isoDate),
    shuttleTotalCost,
    totalCost,
    roundedFemaleUnit: roundToThousand(femaleShare),
    roundedMaleUnit: roundToThousand(maleShare),
    totalCount,
    maleCount,
    femaleCount,
    playerBreakdowns,
  };
}

/** Tổng tiền thực thu sau làm tròn (có thể lệch vài nghìn so với tổng chi phí). */
export function sumRoundedPayable(bill: SessionBill): number {
  return bill.playerBreakdowns.reduce((sum, p) => sum + p.roundedPayable, 0);
}

/** 50000 -> '50.000đ' */
export function formatVND(amount: number): string {
  return `${Math.round(amount).toLocaleString('vi-VN')}đ`;
}

export function genderLabel(gender: Player['gender']): string {
  return gender === 'FEMALE' ? 'Nữ' : 'Nam';
}

/** Mô tả số tiền phải đóng / hoàn lại của 1 người. */
export function describePayable(amount: number): string {
  if (amount < 0) return `Hoàn lại ${formatVND(-amount)}`;
  return formatVND(amount);
}

/** Xuất bill dạng text để dán vào Messenger / Zalo. */
export function buildMessengerText(bill: SessionBill): string {
  const lines: string[] = [];
  lines.push(`🏸 TIỀN CẦU LÔNG - ${bill.title.toUpperCase()}`);
  lines.push(`⏱ Thời gian chơi: ${bill.hoursPlayed} giờ`);
  lines.push('');
  lines.push('💰 CHI PHÍ:');
  lines.push(`• Tiền sân: ${formatVND(bill.courtFee)}`);
  const brand = bill.shuttleBrand.trim() ? ` ${bill.shuttleBrand.trim()}` : '';
  lines.push(
    `• Tiền cầu${brand} (${bill.shuttlesUsed} quả × ${formatVND(bill.tubePrice / SHUTTLES_PER_TUBE)}): ${formatVND(bill.shuttleTotalCost)}`,
  );
  if (bill.waterFee > 0) lines.push(`• Nước lọc: ${formatVND(bill.waterFee)}`);
  lines.push(`➡️ Tổng: ${formatVND(bill.totalCost)}`);
  lines.push('');
  lines.push(`👥 ${bill.totalCount} người (${bill.maleCount} nam, ${bill.femaleCount} nữ)`);
  if (bill.femaleCount > 0) lines.push(`• Nữ: ${formatVND(bill.roundedFemaleUnit)}/người`);
  if (bill.maleCount > 0) lines.push(`• Nam: ${formatVND(bill.roundedMaleUnit)}/người`);
  lines.push('');
  lines.push('📋 CHI TIẾT:');
  bill.playerBreakdowns.forEach((p, index) => {
    const tags = [genderLabel(p.gender)];
    if (p.role === 'LEADER') tags.unshift('👑 Trưởng nhóm');
    if (p.role === 'VICE_LEADER') tags.unshift('🛡️ Phó nhóm');
    if (p.type === 'GUEST') tags.push('vãng lai');
    if (p.waterCredit > 0) tags.push(`đã ứng nước ${formatVND(p.waterCredit)}`);
    lines.push(`${index + 1}. ${p.name} (${tags.join(', ')}): ${describePayable(p.roundedPayable)}`);
  });
  return lines.join('\n');
}
