'use client';

import { calculateBill } from '@/libs/calculator';
import { todayIso } from '@/libs/date-utils';
import type { Gender, Player, SessionBill, SessionInput } from '@/types/badminton';
import { useCallback, useEffect, useMemo, useState } from 'react';

const DEFAULT_INPUT: Omit<SessionInput, 'isoDate'> = {
  hoursPlayed: 2,
  courtFee: 280000,
  shuttleBrand: 'Thành Công',
  tubePrice: 300000,
  shuttlesUsed: 5,
  waterFee: 40000,
  waterPayerId: '',
  femaleCap: 50000,
};

export function useCalculator(roster: Player[]) {
  const [input, setInput] = useState<SessionInput>({ ...DEFAULT_INPUT, isoDate: '' });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [guests, setGuests] = useState<Player[]>([]);
  const [noWaterIds, setNoWaterIds] = useState<string[]>([]);

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
  }, []);

  const effectiveInput = useMemo(
    () => ({
      ...input,
      isoDate: input.isoDate,
    }),
    [input],
  );

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

  const bill: SessionBill = useMemo(() => calculateBill(effectiveInput, participants), [effectiveInput, participants]);

  return {
    input,
    setInput,
    effectiveInput,
    selectedIds,
    setSelectedIds,
    noWaterIds,
    toggleWater,
    guests,
    setGuests,
    participants,
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
