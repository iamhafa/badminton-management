'use client';

import type { TCourt } from '@/types/court.types';
import type { TGroup } from '@/types/group.types';
import type { Gender, TPlayer } from '@/types/player.types';
import type { TSessionBill, TSessionInput } from '@/types/session.types';
import type { TShuttlecock } from '@/types/shuttlecock.types';
import { todayIso } from '@/utils/date';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { calculateBill } from '../utils/calculate-bill';

const DEFAULT_INPUT: Omit<TSessionInput, 'isoDate'> = {
  groupId: '',
  courtId: '',
  hoursPlayed: 2,
  courtFee: 280000,
  shuttlecockId: '',
  shuttleBrand: '',
  tubePrice: 0,
  shuttlesUsed: 5,
  waterFee: 0,
  waterPayerId: '',
  femaleCap: 50000,
};

/**
 * State của màn hình tính tiền cho 1 nhóm.
 * Khi đổi nhóm: xóa lựa chọn người chơi, điền lại mức trần nữ, sân mặc định và loại cầu mặc định của nhóm.
 * Khi chưa chọn nhóm: không tự điền sân/cầu/thành viên.
 */
export function useCalculator(group: TGroup | undefined, courts: TCourt[], shuttlecocks: TShuttlecock[]) {
  const roster = useMemo(() => group?.members ?? [], [group]);

  const [input, setInput] = useState<TSessionInput>({ ...DEFAULT_INPUT, isoDate: '' });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [guests, setGuests] = useState<TPlayer[]>([]);
  const [noWaterIds, setNoWaterIds] = useState<string[]>([]);
  // Tiền nước là tùy chọn: tắt thì không tính tiền nước, ô nhập và nút "Nước" của từng người cũng ẩn.
  const [waterEnabled, setWaterEnabled] = useState(false);
  const [appliedGroupId, setAppliedGroupId] = useState('');
  const [courtAppliedGroupId, setCourtAppliedGroupId] = useState('');

  // Đổi hoặc chọn nhóm: điều chỉnh state ngay trong lúc render (tránh render thừa với useEffect).
  if (group && group.id !== appliedGroupId) {
    setAppliedGroupId(group.id);
    setSelectedIds([]);
    setGuests([]);
    setNoWaterIds([]);

    const defaultCourtId = courts.some((v) => v.id === group.defaultCourtId) ? group.defaultCourtId : '';
    const defaultShuttle = shuttlecocks.find((s) => s.isDefault) ?? shuttlecocks[0];

    setInput((prev) => ({
      ...prev,
      groupId: group.id,
      femaleCap: group.femaleCap,
      courtId: defaultCourtId,
      shuttlecockId: defaultShuttle?.id ?? '',
      shuttleBrand: defaultShuttle?.name ?? '',
      tubePrice: defaultShuttle?.tubePrice ?? 0,
      waterPayerId: '',
    }));
  } else if (!group && appliedGroupId !== '') {
    // Khi bỏ chọn nhóm về rỗng
    setAppliedGroupId('');
    setSelectedIds([]);
    setGuests([]);
    setNoWaterIds([]);
    setInput((prev) => ({
      ...prev,
      groupId: '',
      femaleCap: DEFAULT_INPUT.femaleCap,
      courtId: '',
      shuttlecockId: '',
      shuttleBrand: '',
      tubePrice: 0,
      waterPayerId: '',
    }));
  }

  // Điền sân mặc định của nhóm nếu danh sách sân được tải xong sau khi chọn nhóm
  if (group && courts.length > 0 && courtAppliedGroupId !== group.id) {
    setCourtAppliedGroupId(group.id);
    const defaultCourtId = courts.some((v) => v.id === group.defaultCourtId) ? group.defaultCourtId : '';
    if (defaultCourtId && !input.courtId) {
      setInput((prev) => ({ ...prev, courtId: defaultCourtId }));
    }
  }

  // Điền cầu mặc định nếu danh sách cầu tải xong sau khi đã chọn nhóm và chưa có cầu
  if (group && shuttlecocks.length > 0 && !input.shuttlecockId) {
    const defaultShuttle = shuttlecocks.find((s) => s.isDefault) ?? shuttlecocks[0];
    if (defaultShuttle) {
      setInput((prev) => ({
        ...prev,
        shuttlecockId: defaultShuttle.id,
        shuttleBrand: defaultShuttle.name,
        tubePrice: prev.tubePrice > 0 ? prev.tubePrice : defaultShuttle.tubePrice,
      }));
    }
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

  /** Đưa màn hình về trạng thái ban đầu (VD: sau khi lưu buổi chơi), vẫn giữ nhóm đang chọn. */
  const reset = useCallback(() => {
    const defaultShuttle = shuttlecocks.find((s) => s.isDefault) ?? shuttlecocks[0];
    const defaultCourtId = group && courts.some((v) => v.id === group.defaultCourtId) ? group.defaultCourtId : '';
    setSelectedIds([]);
    setGuests([]);
    setNoWaterIds([]);
    setWaterEnabled(false);
    setInput({
      ...DEFAULT_INPUT,
      isoDate: todayIso(),
      groupId: group?.id ?? '',
      femaleCap: group?.femaleCap ?? DEFAULT_INPUT.femaleCap,
      courtId: defaultCourtId,
      shuttlecockId: group ? (defaultShuttle?.id ?? '') : '',
      shuttleBrand: group ? (defaultShuttle?.name ?? '') : '',
      tubePrice: group ? (defaultShuttle?.tubePrice ?? 0) : 0,
    });
  }, [group, courts, shuttlecocks]);

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
  const waterPayerId = !waterEnabled
    ? ''
    : participants.some((p) => p.id === input.waterPayerId)
      ? input.waterPayerId
      : defaultPayerId;
  // Tắt tiền nước: tiền nước bằng 0 (số đã nhập vẫn được giữ trong `input` để bật lại thì còn).
  const effectiveInput = useMemo<TSessionInput>(
    () => ({ ...input, waterFee: waterEnabled ? input.waterFee : 0, waterPayerId }),
    [input, waterEnabled, waterPayerId],
  );

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
    reset,
    waterEnabled,
    setWaterEnabled,
    toggleMember,
    selectAllMembers,
    clearAllMembers,
    addGuest,
    toggleGuestSource,
    updateGuest,
    removeGuest,
  };
}
