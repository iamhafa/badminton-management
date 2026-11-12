'use client';

import type { TCourt } from '@/types/court.types';
import type { TGroup } from '@/types/group.types';
import type { Gender, TPlayer } from '@/types/player.types';
import type { TPlayerBreakdown, TSessionBill, TSessionInput } from '@/types/session.types';
import type { TShuttlecock } from '@/types/shuttlecock.types';
import { buildSessionTitle, formatDateVN, todayIso } from '@/utils/date';
import { SHUTTLES_PER_TUBE } from '@/utils/format';
import { useCallback, useEffect, useMemo, useState } from 'react';

/** Làm tròn hàng nghìn: phần lẻ < 500đ làm tròn xuống, >= 500đ làm tròn lên. */
function roundToThousand(amount: number): number {
  const sign = amount < 0 ? -1 : 1;
  const absVal = Math.abs(amount);
  const remainder = absVal % 1000;
  const base = Math.floor(absVal / 1000) * 1000;
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
export function calculateBill(
  input: TSessionInput,
  players: TPlayer[],
  createdAt = '',
  names: { groupName: string; courtName: string } = { groupName: '', courtName: '' },
): TSessionBill {
  let maleCount = 0;
  let femaleCount = 0;
  let waterDrinkersCount = 0;

  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    if (p.gender === 'MALE') maleCount++;
    else femaleCount++;
    if (p.drinksWater !== false) waterDrinkersCount++;
  }
  const totalCount = maleCount + femaleCount;

  const shuttleTotalCost = calcShuttleCost(input.tubePrice, input.shuttlesUsed);
  const courtAndShuttleCost = input.courtFee + shuttleTotalCost;
  const totalCost = courtAndShuttleCost + input.waterFee;

  // Phân bổ phí sân + cầu cho Nam / Nữ theo mức trần ưu tiên nữ
  const { maleShare, femaleShare } = calcGenderShares(courtAndShuttleCost, maleCount, femaleCount, input.femaleCap);

  // Phân bổ tiền nước lọc: chỉ chia cho những người có uống nước
  const waterPerPerson = waterDrinkersCount > 0 && input.waterFee > 0 ? input.waterFee / waterDrinkersCount : 0;

  const playerBreakdowns: TPlayerBreakdown[] = players.map((player) => {
    const drinksWater = player.drinksWater !== false;
    const courtAndShuttleShare = player.gender === 'FEMALE' ? femaleShare : maleShare;
    const waterShare = drinksWater ? waterPerPerson : 0;
    const baseShare = courtAndShuttleShare + waterShare;
    const waterCredit = input.waterPayerId && input.waterPayerId === player.id ? input.waterFee : 0;
    const rawNetPayable = baseShare - waterCredit;

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

const DEFAULT_INPUT: Omit<TSessionInput, 'isoDate'> = {
  groupId: '',
  courtId: '',
  hoursPlayed: 2,
  courtFee: 280000,
  shuttlecockId: '',
  shuttleBrand: '',
  tubePrice: 0,
  shuttlesUsed: 5,
  waterFee: 40000,
  waterPayerId: '',
  femaleCap: 50000,
};

/**
 * State của màn hình tính tiền cho 1 nhóm.
 * Khi đổi nhóm: xóa lựa chọn người chơi, điền lại mức trần nữ và sân mặc định của nhóm.
 * `courts` và `shuttlecocks` là các mục đang dùng (chưa ẩn).
 */
export function useCalculator(group: TGroup | undefined, courts: TCourt[], shuttlecocks: TShuttlecock[]) {
  const roster = useMemo(() => group?.members ?? [], [group]);

  const [input, setInput] = useState<TSessionInput>({ ...DEFAULT_INPUT, isoDate: '' });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [guests, setGuests] = useState<TPlayer[]>([]);
  const [noWaterIds, setNoWaterIds] = useState<string[]>([]);
  const [appliedGroupId, setAppliedGroupId] = useState('');
  const [courtAppliedGroupId, setCourtAppliedGroupId] = useState('');
  const [shuttlecockInitialized, setShuttlecockInitialized] = useState(false);

  // Tự động chọn loại cầu mặc định khi vào màn hình tính tiền
  if (!shuttlecockInitialized && shuttlecocks.length > 0) {
    setShuttlecockInitialized(true);
    const defaultShuttle = shuttlecocks.find((s) => s.isDefault) ?? shuttlecocks[0];
    if (defaultShuttle && !input.shuttlecockId) {
      setInput((prev) => ({
        ...prev,
        shuttlecockId: defaultShuttle.id,
        shuttleBrand: defaultShuttle.name,
        tubePrice: prev.tubePrice > 0 ? prev.tubePrice : defaultShuttle.tubePrice,
      }));
    }
  }

  // Đổi nhóm: điều chỉnh state ngay trong lúc render (tránh render thừa với useEffect).
  if (group && group.id !== appliedGroupId) {
    setAppliedGroupId(group.id);
    setSelectedIds([]);
    setGuests([]);
    setNoWaterIds([]);
    setInput((prev) => ({
      ...prev,
      groupId: group.id,
      femaleCap: group.femaleCap,
      courtId: '',
      waterPayerId: '',
    }));
  }

  // Điền sân mặc định của nhóm. Tách riêng khỏi bước đổi nhóm vì danh sách sân và nhóm được tải độc lập,
  // nên sân có thể về sau nhóm; chỉ áp dụng khi đã có danh sách sân và chưa chọn sân nào.
  if (group && courts.length > 0 && courtAppliedGroupId !== group.id) {
    setCourtAppliedGroupId(group.id);
    const defaultCourtId = courts.some((v) => v.id === group.defaultCourtId) ? group.defaultCourtId : '';
    setInput((prev) => ({ ...prev, courtId: prev.courtId || defaultCourtId }));
  }

  // Sân đang chọn bị ẩn: bỏ chọn để bắt buộc chọn lại.
  if (input.courtId && !courts.some((v) => v.id === input.courtId)) {
    setInput((prev) => ({ ...prev, courtId: '' }));
  }

  // Loại cầu đang chọn bị ẩn: bỏ chọn để bắt buộc chọn lại (giữ nguyên giá đã nhập).
  if (input.shuttlecockId && !shuttlecocks.some((s) => s.id === input.shuttlecockId)) {
    setInput((prev) => ({ ...prev, shuttlecockId: '' }));
  }

  // Đặt ngày hôm nay ở client sau khi mount: với cacheComponents, dùng `new Date()` lúc prerender sẽ báo lỗi.
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- đồng bộ với đồng hồ hệ thống, chỉ chạy một lần sau khi mount
    setInput((prev) => (prev.isoDate ? prev : { ...prev, isoDate: todayIso() }));
  }, []);

  const toggleMember = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const toggleWater = useCallback((id: string) => {
    setNoWaterIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const selectAllMembers = useCallback(() => {
    setSelectedIds(roster.map((m) => m.id));
  }, [roster]);

  const clearAllMembers = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const addGuest = useCallback((name: string, gender: Gender) => {
    const newGuest: TPlayer = {
      id: `guest_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name,
      gender,
      type: 'GUEST',
      guestSource: 'FRIEND',
      active: true,
    };
    setGuests((prev) => [...prev, newGuest]);
    // Vãng lai mặc định không tính tiền nước; bấm nút "Nước" để bật lại
    setNoWaterIds((prev) => [...prev, newGuest.id]);
  }, []);

  const toggleGuestSource = useCallback((id: string) => {
    setGuests((prev) =>
      prev.map((g) => (g.id === id ? { ...g, guestSource: g.guestSource === 'FACEBOOK' ? 'FRIEND' : 'FACEBOOK' } : g)),
    );
  }, []);

  const updateGuest = useCallback((id: string, patch: Partial<Pick<TPlayer, 'name' | 'gender' | 'guestSource'>>) => {
    setGuests((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }, []);

  const removeGuest = useCallback((id: string) => {
    setGuests((prev) => prev.filter((g) => g.id !== id));
    setNoWaterIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const participants = useMemo<TPlayer[]>(() => {
    const selectedSet = new Set(selectedIds);
    const noWaterSet = new Set(noWaterIds);

    const fromRoster: TPlayer[] = [];
    for (let i = 0; i < roster.length; i++) {
      const m = roster[i];
      if (selectedSet.has(m.id)) {
        fromRoster.push({
          ...m,
          drinksWater: !noWaterSet.has(m.id),
        });
      }
    }

    const guestList = guests.map((g) => ({
      ...g,
      drinksWater: !noWaterSet.has(g.id),
    }));

    return [...fromRoster, ...guestList];
  }, [roster, selectedIds, guests, noWaterIds]);

  // Người mua nước: giữ lựa chọn nếu người đó còn trong danh sách, ngược lại mặc định là Trưởng nhóm
  // hoặc người chơi đầu tiên. Tính ngay khi render nên không cần effect.
  const defaultPayerId = (participants.find((p) => p.role === 'LEADER') ?? participants[0])?.id ?? '';
  const waterPayerId = participants.some((p) => p.id === input.waterPayerId) ? input.waterPayerId : defaultPayerId;
  const effectiveInput = useMemo<TSessionInput>(() => ({ ...input, waterPayerId }), [input, waterPayerId]);

  const courtName = courts.find((v) => v.id === input.courtId)?.name ?? '';
  const groupName = group?.name ?? '';

  // Tên loại cầu luôn lấy từ danh mục, nên đổi tên loại cầu ở Cài đặt sẽ cập nhật theo.
  const shuttleBrand = shuttlecocks.find((s) => s.id === input.shuttlecockId)?.name ?? '';

  const bill: TSessionBill = useMemo(
    () => calculateBill({ ...effectiveInput, shuttleBrand }, participants, '', { groupName, courtName }),
    [effectiveInput, shuttleBrand, participants, groupName, courtName],
  );

  const hasSelection = selectedIds.length > 0 || guests.length > 0;

  return {
    input: effectiveInput,
    setInput,
    roster,
    selectedIds,
    noWaterIds,
    toggleWater,
    guests,
    participants,
    hasSelection,
    bill,
    toggleMember,
    selectAllMembers,
    clearAllMembers,
    addGuest,
    toggleGuestSource,
    updateGuest,
    removeGuest,
  };
}
