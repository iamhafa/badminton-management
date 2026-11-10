'use client';

import { calculateBill } from '@/libs/calculator';
import { todayIso } from '@/libs/date-utils';
import type { Gender, Group, Player, SessionBill, SessionInput, Shuttlecock, Court } from '@/types/badminton';
import { useCallback, useEffect, useMemo, useState } from 'react';

const DEFAULT_INPUT: Omit<SessionInput, 'isoDate'> = {
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
export function useCalculator(group: Group | undefined, courts: Court[], shuttlecocks: Shuttlecock[]) {
  const roster = useMemo(() => group?.members ?? [], [group]);

  const [input, setInput] = useState<SessionInput>({ ...DEFAULT_INPUT, isoDate: '' });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [guests, setGuests] = useState<Player[]>([]);
  const [noWaterIds, setNoWaterIds] = useState<string[]>([]);
  const [appliedGroupId, setAppliedGroupId] = useState('');

  // Đổi nhóm: điều chỉnh state ngay trong lúc render (tránh render thừa với useEffect).
  if (group && group.id !== appliedGroupId) {
    setAppliedGroupId(group.id);
    setSelectedIds([]);
    setGuests([]);
    setNoWaterIds([]);
    const defaultCourtId = courts.some((v) => v.id === group.defaultCourtId) ? group.defaultCourtId : '';
    setInput((prev) => ({
      ...prev,
      groupId: group.id,
      femaleCap: group.femaleCap,
      courtId: defaultCourtId,
      waterPayerId: '',
    }));
  }

  // Sân đang chọn bị ẩn: bỏ chọn để bắt buộc chọn lại.
  if (input.courtId && !courts.some((v) => v.id === input.courtId)) {
    setInput((prev) => ({ ...prev, courtId: '' }));
  }

  // Loại cầu đang chọn bị ẩn: bỏ chọn để bắt buộc chọn lại (giữ nguyên giá đã nhập).
  if (input.shuttlecockId && !shuttlecocks.some((s) => s.id === input.shuttlecockId)) {
    setInput((prev) => ({ ...prev, shuttlecockId: '' }));
  }

  // Đặt ngày hôm nay ở client sau khi mount để tránh lỗi SSR prerender Date.now()
  useEffect(() => {
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
    const newGuest: Player = {
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

  const updateGuest = useCallback((id: string, patch: Partial<Pick<Player, 'name' | 'gender' | 'guestSource'>>) => {
    setGuests((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }, []);

  const removeGuest = useCallback((id: string) => {
    setGuests((prev) => prev.filter((g) => g.id !== id));
    setNoWaterIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const participants = useMemo<Player[]>(() => {
    const selectedSet = new Set(selectedIds);
    const noWaterSet = new Set(noWaterIds);

    const fromRoster: Player[] = [];
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

  // Tự động gán người mua nước là Trưởng nhóm hoặc người chơi đầu tiên trong danh sách tham gia
  useEffect(() => {
    if (participants.length === 0) return;
    const exists = participants.some((p) => p.id === input.waterPayerId);
    if (!exists) {
      const leader = participants.find((p) => p.role === 'LEADER');
      const defaultPayer = leader || participants[0];
      if (defaultPayer) {
        setInput((prev) => ({ ...prev, waterPayerId: defaultPayer.id }));
      }
    }
  }, [participants, input.waterPayerId]);

  const courtName = courts.find((v) => v.id === input.courtId)?.name ?? '';
  const groupName = group?.name ?? '';

  // Tên loại cầu luôn lấy từ danh mục, nên đổi tên loại cầu ở Cài đặt sẽ cập nhật theo.
  const shuttleBrand = shuttlecocks.find((s) => s.id === input.shuttlecockId)?.name ?? '';

  const bill: SessionBill = useMemo(
    () => calculateBill({ ...input, shuttleBrand }, participants, '', { groupName, courtName }),
    [input, shuttleBrand, participants, groupName, courtName],
  );

  const hasSelection = selectedIds.length > 0 || guests.length > 0;

  return {
    input,
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
