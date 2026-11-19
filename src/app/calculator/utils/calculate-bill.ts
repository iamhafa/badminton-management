import type { TParticipant } from '@/types/player.type';
import type { TSessionDraft, TSessionInput } from '@/types/session.type';
import { SHUTTLES_PER_TUBE } from '@/utils/format';

// Các phép tính tiền của 1 buổi chơi. Hàm thuần (không dùng React), nên kiểm thử và dùng lại được ở nơi khác.
// Kết quả có đúng hình dạng của bảng `sessions` + `session_players` để lưu thẳng vào database.

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
  players: TParticipant[],
  names: { group_name: string; court_name: string } = { group_name: '', court_name: '' },
): TSessionDraft {
  let maleCount: number = 0;
  let femaleCount: number = 0;
  let waterDrinkersCount: number = 0;

  players.forEach((player: TParticipant): void => {
    if (player.gender === 'MALE') maleCount++;
    else femaleCount++;
    if (player.drinks_water) waterDrinkersCount++;
  });

  const shuttleTotalCost: number = calcShuttleCost(input.tube_price, input.shuttles_used);
  const courtAndShuttleCost: number = input.court_fee + shuttleTotalCost;
  const totalCost: number = courtAndShuttleCost + input.water_fee;

  // Phân bổ phí sân + cầu cho Nam / Nữ theo mức trần ưu tiên nữ
  const { maleShare, femaleShare } = calcGenderShares(courtAndShuttleCost, maleCount, femaleCount, input.female_cap);

  // Phân bổ tiền nước lọc: chỉ chia cho những người có uống nước
  const waterPerPerson: number = waterDrinkersCount > 0 && input.water_fee > 0 ? input.water_fee / waterDrinkersCount : 0;

  const sessionPlayers: TSessionDraft['session_players'] = players.map((player: TParticipant, position: number) => {
    const courtAndShuttleShare: number = player.gender === 'FEMALE' ? femaleShare : maleShare;
    const waterShare: number = player.drinks_water ? waterPerPerson : 0;
    const baseShare: number = courtAndShuttleShare + waterShare;
    const waterCredit: number = input.water_payer_id && input.water_payer_id === player.id ? input.water_fee : 0;
    const rawNetPayable: number = baseShare - waterCredit;

    return {
      player_id: player.id,
      position,
      name: player.name,
      gender: player.gender,
      type: player.type,
      guest_source: player.guest_source,
      role: player.role,
      drinks_water: player.drinks_water,
      court_and_shuttle_share: courtAndShuttleShare,
      water_share: waterShare,
      base_share: baseShare,
      water_credit: waterCredit,
      raw_net_payable: rawNetPayable,
      rounded_payable: roundToThousand(rawNetPayable),
      paid_method: null, // buổi mới lưu: chưa ai chuyển tiền
      paid_at: null,
    };
  });

  return {
    ...input,
    group_name: names.group_name,
    court_name: names.court_name,
    shuttle_total_cost: shuttleTotalCost,
    total_cost: totalCost,
    water_drinkers_count: waterDrinkersCount,
    water_per_person: waterPerPerson,
    rounded_female_unit: roundToThousand(femaleShare + waterPerPerson),
    rounded_male_unit: roundToThousand(maleShare + waterPerPerson),
    session_players: sessionPlayers,
  };
}
