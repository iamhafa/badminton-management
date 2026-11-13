'use client';

import { useQueryGroups } from '@/hooks/useQueryGroups';
import { useMutateDeleteSession, useQuerySessions } from '@/hooks/useQuerySessions';
import { useConnectionStore } from '@/stores/connection.store';
import { toast } from 'sonner';
import HistoryList from './components/HistoryList';

export default function HistoryPage() {
  const cloudOnline = useConnectionStore((s) => s.cloudStatus === 'online');
  const { data: sessions, isFetching: sessionsLoading, error: sessionsError, refetch: refetchSessions } = useQuerySessions();
  const { data: groups, isFetching: groupsLoading, error: groupsError, refetch: refetchGroups } = useQueryGroups();
  const { mutateAsync: deleteSession } = useMutateDeleteSession();

  const loadError = sessionsError ?? groupsError;
  const error = loadError
    ? `Không tải được lịch sử: ${loadError instanceof Error ? loadError.message : String(loadError)}`
    : null;

  function handleRefresh(): void {
    void refetchSessions();
    void refetchGroups();
  }

  async function handleDeleteSession(id: string): Promise<void> {
    try {
      await deleteSession(id);
      toast.success('Đã xóa buổi chơi khỏi Firebase');
    } catch (err) {
      toast.error(`Xóa thất bại: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <HistoryList
        sessions={sessions}
        groups={groups}
        loading={sessionsLoading || groupsLoading}
        error={error}
        cloudOnline={cloudOnline}
        onRefresh={handleRefresh}
        onDelete={handleDeleteSession}
      />
    </div>
  );
}
