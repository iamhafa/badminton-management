'use client';

import HistoryList from '@/components/features/history/HistoryList';
import { useConnection } from '@/context/ConnectionContext';
import { GroupApi, SessionApi } from '@/libs/firebase';
import type { Group } from '@/types/group.types';
import type { SessionBill } from '@/types/session.types';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function HistoryPage() {
  const { cloudOnline, setOnline, setOffline } = useConnection();
  const [sessions, setSessions] = useState<SessionBill[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [sessionList, groupList] = await Promise.all([SessionApi.fetchAll(), GroupApi.fetchAll()]);
      setSessions(sessionList);
      setGroups(groupList);
      setError(null);
      setOnline();
    } catch (err) {
      setError(`Không tải được lịch sử: ${err instanceof Error ? err.message : String(err)}`);
      setOffline();
    } finally {
      setLoading(false);
    }
  }, [setOnline, setOffline]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleDeleteSession(id: string): Promise<void> {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (!cloudOnline) {
      toast.info('Đã xóa khỏi danh sách trên máy.');
      return;
    }
    try {
      await SessionApi.delete(id);
      toast.success('Đã xóa buổi chơi khỏi Firebase');
    } catch (err) {
      toast.error(`Xóa thất bại: ${err instanceof Error ? err.message : String(err)}`);
      loadData();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <HistoryList
        sessions={sessions}
        groups={groups}
        loading={loading}
        error={error}
        cloudOnline={cloudOnline}
        onRefresh={loadData}
        onDelete={handleDeleteSession}
      />
    </div>
  );
}
