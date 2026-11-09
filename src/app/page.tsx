'use client';

import BillSummaryCard from '@/components/calculator/BillSummaryCard';
import ParticipantSelector from '@/components/calculator/ParticipantSelector';
import SessionCostForm from '@/components/calculator/SessionCostForm';
import { useBadminton } from '@/contexts/BadmintonContext';
import { useCalculator } from '@/hooks/useCalculator';
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
  const { roster, rosterLoading, cloudOnline, handleSaveSession } = useBadminton();

  const {
    effectiveInput,
    setInput,
    participants,
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
  } = useCalculator(roster);

  if (!hydrated || !effectiveInput.isoDate) {
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
          input={effectiveInput}
          onChange={(patch) => setInput((prev) => ({ ...prev, ...patch }))}
          participants={participants}
        />
        <ParticipantSelector
          roster={roster}
          rosterLoading={rosterLoading}
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
          onNavigateRoster={() => router.push('/roster')}
        />
      </div>
      <div>
        <BillSummaryCard bill={bill} onSave={() => handleSaveSession(bill)} cloudOnline={cloudOnline} />
      </div>
    </div>
  );
}
