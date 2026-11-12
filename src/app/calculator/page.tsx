'use client';

import LoadingState from '@/components/common/LoadingState';
import BillSummaryCard from '@/components/features/calculator/BillSummaryCard';
import { useCalculator } from '@/components/features/calculator/hooks/useCalculator';
import ParticipantSelector from '@/components/features/calculator/ParticipantSelector';
import SessionCostForm from '@/components/features/calculator/SessionCostForm';
import { useQueryCourts } from '@/hooks/useQueryCourts';
import { useQueryGroups } from '@/hooks/useQueryGroups';
import { useMutateSaveSession } from '@/hooks/useQuerySessions';
import { useQueryShuttlecocks } from '@/hooks/useQueryShuttlecocks';
import { confirm } from '@/stores/confirm.store';
import { useConnectionStore } from '@/stores/connection.store';
import { TGroup } from '@/types/group.types';
import type { TSessionBill, TSessionInput } from '@/types/session.types';
import { nowIso } from '@/utils/date';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { useIsClient, useLocalStorage } from 'usehooks-ts';

const SELECTED_GROUP_STORAGE_KEY = 'badminton:selectedGroupId';
const SELECTED_GROUP_STORAGE_OPTIONS = {
  serializer: (value: string) => value,
  deserializer: (value: string) => value,
  initializeWithValue: false,
};

export default function CalculatorPage() {
  const hydrated: boolean = useIsClient();
  const router = useRouter();
  const cloudOnline: boolean = useConnectionStore((s) => s.cloudStatus === 'online');

  const { data: groups, isPending: loadingGroups } = useQueryGroups();
  const { data: courts, isPending: loadingCourts } = useQueryCourts();
  const { data: shuttlecocks, isPending: loadingShuttlecocks } = useQueryShuttlecocks();
  const { mutateAsync: saveSession } = useMutateSaveSession();
  const loading: boolean = loadingGroups || loadingCourts || loadingShuttlecocks;

  const [preferredGroupId, selectGroup] = useLocalStorage<string>(SELECTED_GROUP_STORAGE_KEY, '', SELECTED_GROUP_STORAGE_OPTIONS);

  const selectedGroup: TGroup = useMemo(
    () => groups.find((g) => g.id === preferredGroupId) ?? groups[0],
    [groups, preferredGroupId],
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
  } = useCalculator(selectedGroup, courts, shuttlecocks);

  async function handleGroupChange(groupId: string): Promise<void> {
    if (groupId === selectedGroup?.id) return;
    if (hasSelection) {
      const nextName = groups.find((g) => g.id === groupId)?.name ?? '';
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
      await saveSession(newBill);
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
    return <LoadingState />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="flex flex-col gap-4">
        <SessionCostForm
          input={input}
          onChange={(patch) => setInput((prev: TSessionInput) => ({ ...prev, ...patch }))}
          participants={participants}
          groups={groups}
          courts={courts}
          shuttlecocks={shuttlecocks}
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
          onNavigateRoster={() => selectedGroup && router.push(`/settings/groups/${selectedGroup.id}`)}
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
