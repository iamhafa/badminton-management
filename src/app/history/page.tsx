'use client';

import HistoryList from '@/components/features/history/HistoryList';
import { useGroups } from '@/hooks/useQueryGroups';
import { useDeleteSession, useSessions } from '@/hooks/useQuerySessions';
import { useConnectionStore } from '@/stores/connection.store';
import { toast } from 'sonner';

export default function HistoryPage() {
  const cloudOnline = useConnectionStore((s) => s.cloudStatus === 'online');
  const sessionsQuery = useSessions();
  const groupsQuery = useGroups();
  const deleteSession = useDeleteSession();

  const loadError = sessionsQuery.error ?? groupsQuery.error;
  const error = loadError
    ? `Không tải được lịch sử: ${loadError instanceof Error ? loadError.message : String(loadError)}`
    : null;

  function handleRefresh(): void {
    void sessionsQuery.refetch();
    void groupsQuery.refetch();
  }

  async function handleDeleteSession(id: string): Promise<void> {
    try {
      await deleteSession.mutateAsync(id);
      toast.success('Đã xóa buổi chơi khỏi Firebase');
    } catch (err) {
      toast.error(`Xóa thất bại: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <HistoryList
        sessions={sessionsQuery.data ?? []}
        groups={groupsQuery.data ?? []}
        loading={sessionsQuery.isFetching || groupsQuery.isFetching}
        error={error}
        cloudOnline={cloudOnline}
        onRefresh={handleRefresh}
        onDelete={handleDeleteSession}
      />
    </div>
  );
}
