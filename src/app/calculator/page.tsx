'use client';

import BillSummaryCard from '@/components/features/calculator/BillSummaryCard';
import ParticipantSelector from '@/components/features/calculator/ParticipantSelector';
import SessionCostForm from '@/components/features/calculator/SessionCostForm';
import { useConnection } from '@/context/ConnectionContext';
import { useCalculator } from '@/hooks/useCalculator';
import { useConfirm } from '@/hooks/useConfirm';
import { CourtApi, GroupApi, SessionApi, ShuttlecockApi } from '@/libs/firebase';
import type { TCourt } from '@/types/court.types';
import type { TGroup } from '@/types/group.types';
import type { TSessionBill } from '@/types/session.types';
import type { TShuttlecock } from '@/types/shuttlecock.types';
import { nowIso } from '@/utils/date';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useIsClient, useLocalStorage } from 'usehooks-ts';

const SELECTED_GROUP_STORAGE_KEY = 'badminton:selectedGroupId';
const SELECTED_GROUP_STORAGE_OPTIONS = {
  serializer: (value: string) => value,
  deserializer: (value: string) => value,
  initializeWithValue: false,
};

export default function CalculatorPage() {
  const hydrated = useIsClient();
  const router = useRouter();
  const { cloudOnline, setOnline, setOffline } = useConnection();
  const confirm = useConfirm();

  const [groups, setGroups] = useState<TGroup[]>([]);
  const [courts, setCourts] = useState<TCourt[]>([]);
  const [shuttlecocks, setShuttlecocks] = useState<TShuttlecock[]>([]);
  const [loading, setLoading] = useState(true);

  const [preferredGroupId, selectGroup] = useLocalStorage<string>(SELECTED_GROUP_STORAGE_KEY, '', SELECTED_GROUP_STORAGE_OPTIONS);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [groupList, courtList, shuttlecockList] = await Promise.all([
        GroupApi.fetchAll(),
        CourtApi.fetchAll(),
        ShuttlecockApi.fetchAll(),
      ]);
      setGroups(groupList);
      setCourts(courtList);
      setShuttlecocks(shuttlecockList);
      setOnline();
    } catch {
      setOffline();
    } finally {
      setLoading(false);
    }
  }, [setOnline, setOffline]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeGroups = useMemo(() => groups.filter((g) => !g.deletedAt), [groups]);
  const activeCourts = useMemo(() => courts.filter((v) => !v.deletedAt), [courts]);
  const activeShuttlecocks = useMemo(() => shuttlecocks.filter((s) => !s.deletedAt), [shuttlecocks]);

  const selectedGroup = useMemo(
    () => activeGroups.find((g) => g.id === preferredGroupId) ?? activeGroups[0],
    [activeGroups, preferredGroupId],
  );

  const {
    input,
    setInput,
    roster,
    participants,
    hasSelection,
    selectedIds,
    noWaterIds,
    toggleWater,
    toggleMember,
    selectAllMembers,
    clearAllMembers,
    guests,
    addGuest,
    toggleGuestSource,
    updateGuest,
    removeGuest,
    bill,
  } = useCalculator(selectedGroup, activeCourts, activeShuttlecocks);

  async function handleGroupChange(groupId: string): Promise<void> {
    if (groupId === selectedGroup?.id) return;
    if (hasSelection) {
      const nextName = activeGroups.find((g) => g.id === groupId)?.name ?? '';
      const ok = await confirm({
        title: `Chuyển sang nhóm "${nextName}"?`,
        description: 'Danh sách người chơi và vãng lai đã chọn của nhóm hiện tại sẽ bị xóa.',
        confirmLabel: 'Chuyển nhóm',
      });
      if (!ok) return;
    }
    selectGroup(groupId);
  }

  async function handleSaveSession(draft: TSessionBill): Promise<void> {
    const tempId = `local_${crypto.randomUUID()}`;
    const newBill: TSessionBill = { ...draft, id: tempId, createdAt: draft.createdAt || nowIso() };
    if (!cloudOnline) {
      toast.info('Chưa kết nối Cloud nên chưa lưu được lên Firebase.');
      return;
    }
    try {
      await SessionApi.save(newBill);
      toast.success('Đã lưu buổi chơi vào Lịch sử (Firebase)');
    } catch (err) {
      toast.error(`Không thể lưu lên Cloud: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const saveBlockedReason = !bill.groupId
    ? 'Chưa chọn nhóm'
    : !bill.courtId
      ? 'Chọn sân chơi trước khi lưu'
      : !bill.shuttlecockId
        ? 'Chọn loại cầu trước khi lưu'
        : undefined;

  if (!hydrated || !input.isoDate) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground animate-pulse">Đang tải bảng tính tiền...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="flex flex-col gap-4">
        <SessionCostForm
          input={input}
          onChange={(patch) => setInput((prev) => ({ ...prev, ...patch }))}
          participants={participants}
          groups={activeGroups}
          courts={activeCourts}
          shuttlecocks={activeShuttlecocks}
          onGroupChange={handleGroupChange}
        />
        <ParticipantSelector
          roster={roster}
          rosterLoading={loading}
          selectedIds={selectedIds}
          noWaterIds={noWaterIds}
          onToggle={toggleMember}
          onToggleWater={toggleWater}
          onSelectAll={selectAllMembers}
          onClearAll={clearAllMembers}
          guests={guests}
          onAddGuest={addGuest}
          onToggleGuestSource={toggleGuestSource}
          onUpdateGuest={updateGuest}
          onRemoveGuest={removeGuest}
          onNavigateRoster={() => router.push('/settings/groups')}
        />
      </div>
      <div>
        <BillSummaryCard
          bill={bill}
          onSave={() => handleSaveSession(bill)}
          cloudOnline={cloudOnline}
          saveBlockedReason={saveBlockedReason}
        />
      </div>
    </div>
  );
}
