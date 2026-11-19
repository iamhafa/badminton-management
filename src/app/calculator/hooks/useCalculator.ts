'use client';

import type { TCourt } from '@/types/court.type';
import type { TGroup } from '@/types/group.type';
import type { Gender, GuestSource, TParticipant } from '@/types/player.type';
import type { TSessionDraft, TSessionInput } from '@/types/session.type';
import type { TShuttlecock } from '@/types/shuttlecock.type';
import { todayIso } from '@/utils/date';
import { countPlayers } from '@/utils/session';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { calculateBill } from '../utils/calculate-bill';

const DEFAULT_INPUT: Omit<TSessionInput, 'iso_date'> = {
  group_id: null,
  court_id: null,
  hours_played: 2,
  court_fee: 280000,
  shuttlecock_id: null,
  shuttle_brand: '',
  tube_price: 0,
  shuttles_used: 5,
  water_fee: 0,
  water_payer_id: null,
  female_cap: 50000,
};

/** Loại cầu mặc định: loại được đánh dấu, hoặc loại đầu tiên. */
function pickDefaultShuttlecock(shuttlecocks: TShuttlecock[]): TShuttlecock | undefined {
  return shuttlecocks.find((s) => s.is_default) ?? shuttlecocks[0];
}

/** Sân hay chơi của nhóm, nếu sân đó còn đang dùng. */
function pickDefaultCourtId(group: TGroup, courts: TCourt[]): string | null {
  return group.default_court_id && courts.some((c) => c.id === group.default_court_id) ? group.default_court_id : null;
}

/**
 * State của màn hình tính tiền cho 1 nhóm.
 * Khi đổi nhóm: xóa lựa chọn người chơi, điền lại mức trần nữ, sân mặc định và loại cầu mặc định của nhóm.
 * Khi chưa chọn nhóm: không tự điền sân/cầu/thành viên.
 */
export function useCalculator(group: TGroup | undefined, courts: TCourt[], shuttlecocks: TShuttlecock[]) {
  const roster = useMemo(() => group?.members ?? [], [group]);

  const [input, setInput] = useState<TSessionInput>({ ...DEFAULT_INPUT, iso_date: '' });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [guests, setGuests] = useState<TParticipant[]>([]);
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
    const defaultShuttle = pickDefaultShuttlecock(shuttlecocks);
    setInput((prev) => ({
      ...prev,
      group_id: group.id,
      female_cap: group.female_cap,
      court_id: pickDefaultCourtId(group, courts),
      shuttlecock_id: defaultShuttle?.id ?? null,
      shuttle_brand: defaultShuttle?.name ?? '',
      tube_price: defaultShuttle?.tube_price ?? 0,
      water_payer_id: null,
    }));
  } else if (!group && appliedGroupId !== '') {
    // Khi bỏ chọn nhóm về rỗng
    setAppliedGroupId('');
    setSelectedIds([]);
    setGuests([]);
    setNoWaterIds([]);
    setInput((prev) => ({
      ...prev,
      group_id: null,
      female_cap: DEFAULT_INPUT.female_cap,
      court_id: null,
      shuttlecock_id: null,
      shuttle_brand: '',
      tube_price: 0,
      water_payer_id: null,
    }));
  }

  // Điền sân mặc định của nhóm nếu danh sách sân được tải xong sau khi chọn nhóm
  if (group && courts.length > 0 && courtAppliedGroupId !== group.id) {
    setCourtAppliedGroupId(group.id);
    const defaultCourtId = pickDefaultCourtId(group, courts);
    if (defaultCourtId && !input.court_id) {
      setInput((prev) => ({ ...prev, court_id: defaultCourtId }));
    }
  }

  // Điền cầu mặc định nếu danh sách cầu tải xong sau khi đã chọn nhóm và chưa có cầu
  if (group && shuttlecocks.length > 0 && !input.shuttlecock_id) {
    const defaultShuttle = pickDefaultShuttlecock(shuttlecocks);
    if (defaultShuttle) {
      setInput((prev) => ({
        ...prev,
        shuttlecock_id: defaultShuttle.id,
        shuttle_brand: defaultShuttle.name,
        tube_price: prev.tube_price > 0 ? prev.tube_price : defaultShuttle.tube_price,
      }));
    }
  }

  // Sân đang chọn đã bị xóa: bỏ chọn để bắt buộc chọn lại.
  if (input.court_id && !courts.some((c) => c.id === input.court_id)) {
    setInput((prev) => ({ ...prev, court_id: null }));
  }

  // Loại cầu đang chọn đã bị xóa: bỏ chọn để bắt buộc chọn lại (giữ nguyên giá đã nhập).
  if (input.shuttlecock_id && !shuttlecocks.some((s) => s.id === input.shuttlecock_id)) {
    setInput((prev) => ({ ...prev, shuttlecock_id: null }));
  }

  // Đặt ngày hôm nay ở client sau khi mount: với cacheComponents, dùng `new Date()` lúc prerender sẽ báo lỗi.
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- đồng bộ với đồng hồ hệ thống, chỉ chạy một lần sau khi mount
    setInput((prev) => (prev.iso_date ? prev : { ...prev, iso_date: todayIso() }));
  }, []);

  /** Đưa màn hình về trạng thái ban đầu (VD: sau khi lưu buổi chơi), vẫn giữ nhóm đang chọn. */
  const reset = useCallback(() => {
    const defaultShuttle = pickDefaultShuttlecock(shuttlecocks);
    setSelectedIds([]);
    setGuests([]);
    setNoWaterIds([]);
    setWaterEnabled(false);
    setInput({
      ...DEFAULT_INPUT,
      iso_date: todayIso(),
      group_id: group?.id ?? null,
      female_cap: group?.female_cap ?? DEFAULT_INPUT.female_cap,
      court_id: group ? pickDefaultCourtId(group, courts) : null,
      shuttlecock_id: group ? (defaultShuttle?.id ?? null) : null,
      shuttle_brand: group ? (defaultShuttle?.name ?? '') : '',
      tube_price: group ? (defaultShuttle?.tube_price ?? 0) : 0,
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
    const newGuest: TParticipant = {
      id: `guest_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name,
      gender,
      type: 'GUEST',
      guest_source: 'FRIEND',
      role: null,
      drinks_water: true,
    };
    setGuests((prev) => [...prev, newGuest]);
    // Vãng lai mặc định không tính tiền nước; bấm nút "Nước" để bật lại
    setNoWaterIds((prev) => [...prev, newGuest.id]);
  }, []);

  const toggleGuestSource = useCallback((id: string) => {
    setGuests((prev) =>
      prev.map((g) =>
        g.id === id ? { ...g, guest_source: g.guest_source === 'FACEBOOK' ? 'FRIEND' : ('FACEBOOK' as GuestSource) } : g,
      ),
    );
  }, []);

  const updateGuest = useCallback((id: string, patch: Partial<Pick<TParticipant, 'name' | 'gender' | 'guest_source'>>) => {
    setGuests((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }, []);

  const removeGuest = useCallback((id: string) => {
    setGuests((prev) => prev.filter((g) => g.id !== id));
    setNoWaterIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const participants = useMemo<TParticipant[]>(() => {
    const selectedSet = new Set(selectedIds);
    const noWaterSet = new Set(noWaterIds);

    const fromRoster: TParticipant[] = roster
      .filter((m) => selectedSet.has(m.id))
      .map((m) => ({
        id: m.id,
        name: m.name,
        gender: m.gender,
        type: 'REGULAR',
        guest_source: null,
        role: m.role,
        drinks_water: !noWaterSet.has(m.id),
      }));

    const guestList = guests.map((g) => ({ ...g, drinks_water: !noWaterSet.has(g.id) }));

    return [...fromRoster, ...guestList];
  }, [roster, selectedIds, guests, noWaterIds]);

  // Người mua nước: giữ lựa chọn nếu người đó còn trong danh sách, ngược lại mặc định là Trưởng nhóm
  // hoặc người chơi đầu tiên. Tính ngay khi render nên không cần effect.
  const defaultPayerId = (participants.find((p) => p.role === 'LEADER') ?? participants[0])?.id ?? null;
  const waterPayerId = !waterEnabled
    ? null
    : participants.some((p) => p.id === input.water_payer_id)
      ? input.water_payer_id
      : defaultPayerId;
  // Tắt tiền nước: tiền nước bằng 0 (số đã nhập vẫn được giữ trong `input` để bật lại thì còn).
  const effectiveInput = useMemo<TSessionInput>(
    () => ({ ...input, water_fee: waterEnabled ? input.water_fee : 0, water_payer_id: waterPayerId }),
    [input, waterEnabled, waterPayerId],
  );

  const courtName = courts.find((c) => c.id === input.court_id)?.name ?? '';
  const groupName = group?.name ?? '';

  // Tên loại cầu luôn lấy từ danh mục, nên đổi tên loại cầu ở Cài đặt sẽ cập nhật theo.
  const shuttleBrand = shuttlecocks.find((s) => s.id === input.shuttlecock_id)?.name ?? '';

  const bill: TSessionDraft = useMemo(
    () =>
      calculateBill({ ...effectiveInput, shuttle_brand: shuttleBrand }, participants, {
        group_name: groupName,
        court_name: courtName,
      }),
    [effectiveInput, shuttleBrand, participants, groupName, courtName],
  );
  const counts = useMemo(() => countPlayers(participants), [participants]);

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
    counts,
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
