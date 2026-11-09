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

  // ---------- Firestore Sync ----------

  const loadRoster = useCallback(() => {
    fetchRoster()
      .then((members) => {
        setRoster(members);
        setCloudStatus('online');
      })
      .catch((err) => {
        console.error('Không tải được danh sách thành viên:', err);
        setCloudStatus('offline');
      })
      .finally(() => setRosterLoading(false));
  }, []);

  const loadSessions = useCallback(() => {
    fetchSessions()
      .then((list) => {
        setSessions(list);
        setSessionsError(null);
      })
      .catch((err) => setSessionsError(`Không tải được lịch sử: ${errorMessage(err)}`))
      .finally(() => setSessionsLoading(false));
  }, []);

  useEffect(() => {
    loadRoster();
    loadSessions();
  }, [loadRoster, loadSessions]);

  function retryConnection() {
    setCloudStatus('connecting');
    setRosterLoading(true);
    setSessionsLoading(true);
    loadRoster();
    loadSessions();
  }

  function refreshSessions() {
    setSessionsLoading(true);
    loadSessions();
  }

  const cloudOnline = cloudStatus === 'online';

  async function handleSaveRoster(next: Player[]) {
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
  }

  async function handleSaveSession(newBill: SessionBill) {
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
  }

  async function handleDeleteSession(id: string) {
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
  }

  const value = useMemo(
    () => ({
      cloudStatus,
      cloudOnline,
      retryConnection,
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
    [cloudStatus, cloudOnline, roster, rosterLoading, sessions, sessionsLoading, sessionsError],
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
