'use client';

import HistoryList from '@/components/history/HistoryList';
import { useBadminton } from '@/contexts/BadmintonContext';

export default function HistoryPage() {
  const { sessions, groups, sessionsLoading, sessionsError, cloudOnline, refreshSessions, handleDeleteSession } = useBadminton();

  return (
    <div className="flex flex-col gap-4">
      <HistoryList
        sessions={sessions}
        groups={groups}
        loading={sessionsLoading}
        error={sessionsError}
        cloudOnline={cloudOnline}
        onRefresh={refreshSessions}
        onDelete={handleDeleteSession}
      />
    </div>
  );
}
