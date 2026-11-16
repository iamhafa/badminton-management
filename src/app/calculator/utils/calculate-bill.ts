import type { TPlayer } from '@/types/player.types';
import type { TPlayerBreakdown, TSessionBill, TSessionInput } from '@/types/session.types';
import { buildSessionTitle, formatDateVN } from '@/utils/date';
import { SHUTTLES_PER_TUBE } from '@/utils/format';

// Các phép tính tiền của 1 buổi chơi. Hàm thuần (không dùng React), nên kiểm thử và dùng lại được ở nơi khác.

/** Làm tròn hàng nghìn: phần lẻ < 500đ làm tròn xuống, >= 500đ làm tròn lên. */
function roundToThousand(amount: number): number {
  const sign = amount < 0 ? -1 : 1;
  const absVal: number = Math.abs(amount);
  const remainder: number = absVal % 1000;
  const base: number = Math.floor(absVal / 1000) * 1000;
  return sign * (remainder >= 500 ? base + 1000 : base);
}

/** Tiền cầu = (Giá 1 ống / 12) × Số quả đã chơi */
function calcShuttleCost(tubePrice: number, shuttlesUsed: number): number {
  return (tubePrice / SHUTTLES_PER_TUBE) * shuttlesUsed;
}

/** Phân bổ phí Nam / Nữ theo mức trần ưu tiên nữ. */
function calcGenderShares(
  totalCost: number,
  maleCount: number,
  femaleCount: number,
  femaleCap: number,
): { maleShare: number; femaleShare: number } {
  const totalCount: number = maleCount + femaleCount;
  if (totalCount === 0) return { maleShare: 0, femaleShare: 0 };

  const average: number = totalCost / totalCount;
  if (average > femaleCap && maleCount > 0) {
    return {
      femaleShare: femaleCap,
      maleShare: (totalCost - femaleCap * femaleCount) / maleCount,
    };
  }
  return {
    maleShare: average,
    femaleShare: average,
  };
}

/** Tính toàn bộ bill cho 1 buổi chơi. `players` là danh sách người đã tham gia (cố định + vãng lai). */
export function calculateBill(
  input: TSessionInput,
  players: TPlayer[],
  createdAt = '',
  names: { groupName: string; courtName: string } = { groupName: '', courtName: '' },
): TSessionBill {
  let maleCount: number = 0;
  let femaleCount: number = 0;
  let waterDrinkersCount: number = 0;

  players.forEach((player: TPlayer): void => {
    if (player.gender === 'MALE') maleCount++;
    else femaleCount++;
    if (player.drinksWater !== false) waterDrinkersCount++;
  });
  const totalCount: number = maleCount + femaleCount;

  const shuttleTotalCost: number = calcShuttleCost(input.tubePrice, input.shuttlesUsed);
  const courtAndShuttleCost: number = input.courtFee + shuttleTotalCost;
  const totalCost: number = courtAndShuttleCost + input.waterFee;

  // Phân bổ phí sân + cầu cho Nam / Nữ theo mức trần ưu tiên nữ
  const { maleShare, femaleShare } = calcGenderShares(courtAndShuttleCost, maleCount, femaleCount, input.femaleCap);

  // Phân bổ tiền nước lọc: chỉ chia cho những người có uống nước
  const waterPerPerson: number = waterDrinkersCount > 0 && input.waterFee > 0 ? input.waterFee / waterDrinkersCount : 0;

  const playerBreakdowns: TPlayerBreakdown[] = players.map((player: TPlayer) => {
    const drinksWater: boolean = player.drinksWater !== false;
    const courtAndShuttleShare: number = player.gender === 'FEMALE' ? femaleShare : maleShare;
    const waterShare: number = drinksWater ? waterPerPerson : 0;
    const baseShare: number = courtAndShuttleShare + waterShare;
    const waterCredit: number = input.waterPayerId && input.waterPayerId === player.id ? input.waterFee : 0;
    const rawNetPayable: number = baseShare - waterCredit;

    return {
      ...player,
      drinksWater,
      courtAndShuttleShare,
      waterShare,
      baseShare,
      waterCredit,
      rawNetPayable,
      roundedPayable: roundToThousand(rawNetPayable),
    };
  });

  return {
    ...input,
    createdAt,
    groupName: names.groupName,
    courtName: names.courtName,
    dateFormatted: formatDateVN(input.isoDate),
    title: buildSessionTitle(input.isoDate),
    shuttleTotalCost,
    totalCost,
    waterDrinkersCount,
    waterPerPerson,
    roundedFemaleUnit: roundToThousand(femaleShare + waterPerPerson),
    roundedMaleUnit: roundToThousand(maleShare + waterPerPerson),
    totalCount,
    maleCount,
    femaleCount,
    playerBreakdowns,
  };
}
