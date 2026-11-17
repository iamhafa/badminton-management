'use client';

import LoadingState from '@/components/common/LoadingState';
import { useQueryCourts } from '@/hooks/useQueryCourts';
import { useQueryGroups } from '@/hooks/useQueryGroups';
import { useMutateSaveSession } from '@/hooks/useQuerySessions';
import { useQueryShuttlecocks } from '@/hooks/useQueryShuttlecocks';
import { confirm } from '@/stores/confirm.store';
import { ConnectionState, useConnectionStore } from '@/stores/connection.store';
import type { TGroup } from '@/types/group.type';
import type { TSessionDraft, TSessionInput } from '@/types/session.type';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useIsClient } from 'usehooks-ts';
import CalculatorBillSummaryCard from './components/CalculatorBillSummaryCard';
import CalculatorParticipantSelector from './components/CalculatorParticipantSelector';
import CalculatorSessionCostForm from './components/CalculatorSessionCostForm';
import { useCalculator } from './hooks/useCalculator';

export default function CalculatorPage() {
  const router = useRouter();
  const hydrated: boolean = useIsClient();
  const cloudOnline: boolean = useConnectionStore((state: ConnectionState) => state.cloudStatus === 'online');

  const { data: groups, isPending: loadingGroups } = useQueryGroups();
  const { data: courts, isPending: loadingCourts } = useQueryCourts();
  const { data: shuttlecocks, isPending: loadingShuttlecocks } = useQueryShuttlecocks();
  const { mutateAsync: saveSession } = useMutateSaveSession();
  const loading: boolean = loadingGroups || loadingCourts || loadingShuttlecocks;

  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  const selectedGroup: TGroup | undefined = useMemo(
    () => groups.find((group: TGroup) => group.id === selectedGroupId),
    [groups, selectedGroupId],
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
    counts,
    reset,
    waterEnabled,
    setWaterEnabled,
  } = useCalculator(selectedGroup, courts, shuttlecocks);

  async function handleGroupChange(groupId: string): Promise<void> {
    if (groupId === selectedGroupId) return;
    if (hasSelection) {
      const nextName = groups.find((g) => g.id === groupId)?.name ?? 'Bỏ chọn nhóm';
      const ok = await confirm({
        title: `Chuyển sang nhóm "${nextName}"?`,
        description: 'Danh sách người chơi và vãng lai đã chọn của nhóm hiện tại sẽ bị xóa.',
        confirmLabel: 'Chuyển nhóm',
      });
      if (!ok) return;
    }
    setSelectedGroupId(groupId);
  }

  async function handleSaveSession(draft: TSessionDraft): Promise<void> {
    if (!cloudOnline) {
      toast.info('Chưa kết nối Cloud nên chưa lưu được.');
      return;
    }
    try {
      await saveSession(draft);
      toast.success('Đã lưu buổi chơi vào Lịch sử');
      reset();
    } catch (err) {
      toast.error(`Không thể lưu lên Cloud: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const saveBlockedReason: string = !bill.group_id
    ? 'Chưa chọn nhóm'
    : !bill.court_id
      ? 'Chọn sân chơi trước khi lưu'
      : !bill.shuttlecock_id
        ? 'Chọn loại cầu trước khi lưu'
        : waterEnabled && bill.water_fee <= 0
          ? 'Nhập số tiền nước trước khi lưu'
          : '';

  if (!hydrated || !input.iso_date) {
    return <LoadingState />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="flex flex-col gap-4">
        <CalculatorSessionCostForm
          input={input}
          onChange={(patch) => setInput((prev: TSessionInput) => ({ ...prev, ...patch }))}
          participants={participants}
          groups={groups}
          courts={courts}
          shuttlecocks={shuttlecocks}
          onGroupChange={handleGroupChange}
          waterEnabled={waterEnabled}
          onWaterEnabledChange={setWaterEnabled}
        />
        <CalculatorParticipantSelector
          groupId={input.group_id}
          roster={roster}
          rosterLoading={loading}
          selectedIds={selectedIds}
          noWaterIds={noWaterIds}
          totalCount={counts.totalCount}
          maleCount={counts.maleCount}
          femaleCount={counts.femaleCount}
          onToggle={toggleMember}
          onToggleWater={waterEnabled ? toggleWater : undefined}
          onSelectAll={selectAllMembers}
          onClearAll={clearAllMembers}
          guests={guests}
          onAddGuest={addGuest}
          onToggleGuestSource={toggleGuestSource}
          onUpdateGuest={updateGuest}
          onRemoveGuest={removeGuest}
          onNavigateRoster={() =>
            selectedGroupId ? router.push(`/settings/groups/${selectedGroupId}`) : router.push('/settings/groups')
          }
        />
      </div>
      <div>
        <CalculatorBillSummaryCard
          bill={bill}
          onSave={() => handleSaveSession(bill)}
          cloudOnline={cloudOnline}
          saveBlockedReason={saveBlockedReason}
        />
      </div>
    </div>
  );
}
