'use client';

import BillSummaryCard from '@/components/calculator/BillSummaryCard';
import ParticipantSelector from '@/components/calculator/ParticipantSelector';
import SessionCostForm from '@/components/calculator/SessionCostForm';
import { useBadminton } from '@/contexts/BadmintonContext';
import { useCalculator } from '@/hooks/useCalculator';
import { useConfirm } from '@/hooks/useConfirm';
import { useRouter } from 'next/navigation';
import { useSyncExternalStore } from 'react';

const noopSubscribe = () => () => {};

function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export default function CalculatorPage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const {
    activeGroups,
    activeCourts,
    activeShuttlecocks,
    selectedGroup,
    selectGroup,
    settingsLoading,
    cloudOnline,
    handleSaveSession,
  } = useBadminton();
  const { confirm, confirmDialog } = useConfirm();

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

  async function handleGroupChange(groupId: string) {
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
          rosterLoading={settingsLoading}
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
      {confirmDialog}
    </div>
  );
}
