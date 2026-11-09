'use client';

import { deleteSession, fetchRoster, fetchSessions, saveRoster, saveSession } from '@/libs/firebase';
import type { Player, SessionBill } from '@/types/badminton';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

export type CloudStatus = 'connecting' | 'online' | 'offline';

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}

interface BadmintonContextType {
  cloudStatus: CloudStatus;
  cloudOnline: boolean;
  retryConnection: () => void;

  // Roster
  roster: Player[];
  rosterLoading: boolean;
  handleSaveRoster: (next: Player[]) => Promise<void>;

  // Sessions
  sessions: SessionBill[];
  sessionsLoading: boolean;
  sessionsError: string | null;
  refreshSessions: () => void;
  handleSaveSession: (bill: SessionBill) => Promise<void>;
  handleDeleteSession: (id: string) => Promise<void>;
}

const BadmintonContext = createContext<BadmintonContextType | null>(null);

export function BadmintonProvider({ children }: { children: ReactNode }) {
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>('connecting');

  const [roster, setRoster] = useState<Player[]>([]);
  const [rosterLoading, setRosterLoading] = useState(true);

  const [sessions, setSessions] = useState<SessionBill[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  // ---------- Firestore Sync (Parallel via Promise.allSettled) ----------

  const syncAll = useCallback(async () => {
    setRosterLoading(true);
    setSessionsLoading(true);
    setCloudStatus('connecting');

    const [rosterRes, sessionsRes] = await Promise.allSettled([fetchRoster(), fetchSessions()]);

    if (rosterRes.status === 'fulfilled') {
      setRoster(rosterRes.value);
      setCloudStatus('online');
    } else {
      console.error('Không tải được danh sách thành viên:', rosterRes.reason);
      setCloudStatus('offline');
    }
    setRosterLoading(false);

    if (sessionsRes.status === 'fulfilled') {
      setSessions(sessionsRes.value);
      setSessionsError(null);
    } else {
      setSessionsError(`Không tải được lịch sử: ${errorMessage(sessionsRes.reason)}`);
    }
    setSessionsLoading(false);
  }, []);

  useEffect(() => {
    syncAll();
  }, [syncAll]);

  const refreshSessions = useCallback(() => {
    setSessionsLoading(true);
    fetchSessions()
      .then((list) => {
        setSessions(list);
        setSessionsError(null);
      })
      .catch((err) => setSessionsError(`Không tải được lịch sử: ${errorMessage(err)}`))
      .finally(() => setSessionsLoading(false));
  }, []);

  const cloudOnline = cloudStatus === 'online';

  const handleSaveRoster = useCallback(
    async (next: Player[]) => {
      setRoster(next);
      if (!cloudOnline) {
        toast.info('Đã lưu trên máy. Chưa kết nối cloud nên chưa sync lên Firebase.');
        return;
      }
      try {
        await saveRoster(next);
        toast.success('Đã lưu danh sách thành viên lên Firebase');
      } catch (err) {
        toast.error(`Lưu thất bại: ${errorMessage(err)}`);
      }
    },
    [cloudOnline],
  );

  const handleSaveSession = useCallback(
    async (newBill: SessionBill) => {
      setSessions((prev) => [newBill, ...prev.filter((s) => s.id !== newBill.id)]);
      if (!cloudOnline) {
        toast.info('Đã lưu vào danh sách trên máy. Chưa sync Firebase.');
        return;
      }
      try {
        await saveSession(newBill);
        toast.success('Đã lưu buổi chơi vào Lịch sử (Firebase)');
      } catch (err) {
        toast.error(`Không thể lưu lên Cloud: ${errorMessage(err)}`);
      }
    },
    [cloudOnline],
  );

  const handleDeleteSession = useCallback(
    async (id: string) => {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (!cloudOnline) {
        toast.info('Đã xóa khỏi danh sách trên máy.');
        return;
      }
      try {
        await deleteSession(id);
        toast.success('Đã xóa buổi chơi khỏi Firebase');
      } catch (err) {
        toast.error(`Xóa thất bại: ${errorMessage(err)}`);
        refreshSessions();
      }
    },
    [cloudOnline, refreshSessions],
  );

  const value = useMemo(
    () => ({
      cloudStatus,
      cloudOnline,
      retryConnection: syncAll,
      roster,
      rosterLoading,
      handleSaveRoster,
      sessions,
      sessionsLoading,
      sessionsError,
      refreshSessions,
      handleSaveSession,
      handleDeleteSession,
    }),
    [
      cloudStatus,
      cloudOnline,
      syncAll,
      roster,
      rosterLoading,
      handleSaveRoster,
      sessions,
      sessionsLoading,
      sessionsError,
      refreshSessions,
      handleSaveSession,
      handleDeleteSession,
    ],
  );

  return <BadmintonContext.Provider value={value}>{children}</BadmintonContext.Provider>;
}

export function useBadminton() {
  const ctx = useContext(BadmintonContext);
  if (!ctx) {
    throw new Error('useBadminton must be used within a BadmintonProvider');
  }
  return ctx;
}
