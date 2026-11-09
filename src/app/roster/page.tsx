'use client';

import RosterManager from '@/components/roster/RosterManager';
import { useBadminton } from '@/contexts/BadmintonContext';

export default function RosterPage() {
  const { roster, rosterLoading, cloudOnline, handleSaveRoster } = useBadminton();

  return (
    <div className="flex flex-col gap-4">
      <RosterManager roster={roster} loading={rosterLoading} cloudOnline={cloudOnline} onSave={handleSaveRoster} />
    </div>
  );
}
