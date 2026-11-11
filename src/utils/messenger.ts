import type { TSessionBill } from '@/types/session.types';
import { describePayable, formatVND, genderLabel, SHUTTLES_PER_TUBE } from './format';

/** Xuất bill dạng text để dán vào Messenger / Zalo. */
export function buildMessengerText(bill: TSessionBill): string {
  const lines: string[] = [];
  lines.push(`🏸 TIỀN CẦU LÔNG - ${bill.title.toUpperCase()}`);
  if (bill.groupName) lines.push(`👥 Nhóm: ${bill.groupName}`);
  if (bill.courtName) lines.push(`📍 Sân: ${bill.courtName}`);
  lines.push(`⏱ Thời gian chơi: ${bill.hoursPlayed} giờ`);
  lines.push('');
  lines.push('💰 CHI PHÍ:');
  lines.push(`• Tiền sân: ${formatVND(bill.courtFee)}`);
  const brand = bill.shuttleBrand.trim() ? ` ${bill.shuttleBrand.trim()}` : '';
  lines.push(
    `• Tiền cầu${brand} (${bill.shuttlesUsed} quả × ${formatVND(bill.tubePrice / SHUTTLES_PER_TUBE)}): ${formatVND(bill.shuttleTotalCost)}`,
  );
  if (bill.waterFee > 0) {
    const drinkerInfo =
      bill.waterDrinkersCount < bill.totalCount ? ` (${bill.waterDrinkersCount}/${bill.totalCount} người uống)` : '';
    lines.push(`• Nước lọc: ${formatVND(bill.waterFee)}${drinkerInfo}`);
  }
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
    if (p.type === 'GUEST') tags.push(p.guestSource === 'FACEBOOK' ? 'vãng lai FB' : 'vãng lai');
    if (p.drinksWater === false && bill.waterFee > 0) tags.push('không nước');
    if (p.waterCredit > 0) tags.push(`đã ứng nước ${formatVND(p.waterCredit)}`);
    lines.push(`${index + 1}. ${p.name} (${tags.join(', ')}): ${describePayable(p.roundedPayable)}`);
  });
  return lines.join('\n');
}
