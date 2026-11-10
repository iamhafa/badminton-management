'use client';

import {
  deleteSession,
  fetchGroups,
  fetchSessions,
  fetchShuttlecocks,
  fetchCourts,
  saveGroup,
  saveSession,
  saveShuttlecock,
  saveCourt,
} from '@/libs/firebase';
import type { Group, SessionBill, Shuttlecock, Court } from '@/types/badminton';
import moment from 'moment';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

export type CloudStatus = 'connecting' | 'online' | 'offline';

const SELECTED_GROUP_STORAGE_KEY = 'badminton:selectedGroupId';

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}

function readStoredGroupId(): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(SELECTED_GROUP_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

interface BadmintonContextType {
  cloudStatus: CloudStatus;
  cloudOnline: boolean;
  retryConnection: () => void;

  // Nhóm, sân, loại cầu (gồm cả mục đã ẩn; dùng các bản active* cho các ô chọn)
  groups: Group[];
  courts: Court[];
  shuttlecocks: Shuttlecock[];
  activeGroups: Group[];
  activeCourts: Court[];
  activeShuttlecocks: Shuttlecock[];
  settingsLoading: boolean;
  handleSaveGroup: (group: Group, successMessage?: string) => Promise<void>;
  handleSaveCourt: (court: Court, successMessage?: string) => Promise<void>;
  handleSaveShuttlecock: (shuttlecock: Shuttlecock, successMessage?: string) => Promise<void>;

  // Nhóm đang chọn ở màn hình tính tiền (nhớ qua localStorage)
  selectedGroup: Group | undefined;
  selectGroup: (id: string) => void;

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

  const [groups, setGroups] = useState<Group[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [shuttlecocks, setShuttlecocks] = useState<Shuttlecock[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [preferredGroupId, setPreferredGroupId] = useState<string>(readStoredGroupId);

  const [sessions, setSessions] = useState<SessionBill[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  // ---------- Firestore Sync (Parallel via Promise.allSettled) ----------

  const syncAll = useCallback(async () => {
    setSettingsLoading(true);
    setSessionsLoading(true);
    setCloudStatus('connecting');

    const [groupsRes, courtsRes, shuttlecocksRes, sessionsRes] = await Promise.allSettled([
      fetchGroups(),
      fetchCourts(),
      fetchShuttlecocks(),
      fetchSessions(),
    ]);

    if (groupsRes.status === 'fulfilled' && courtsRes.status === 'fulfilled' && shuttlecocksRes.status === 'fulfilled') {
      setGroups(groupsRes.value);
      setCourts(courtsRes.value);
      setShuttlecocks(shuttlecocksRes.value);
      setCloudStatus('online');
    } else {
      const failed = [groupsRes, courtsRes, shuttlecocksRes].find((r): r is PromiseRejectedResult => r.status === 'rejected');
      console.error('Không tải được nhóm/sân/loại cầu:', failed?.reason);
      setCloudStatus('offline');
    }
    setSettingsLoading(false);

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

  const activeGroups = useMemo(() => groups.filter((g) => !g.deletedAt), [groups]);
  const activeCourts = useMemo(() => courts.filter((v) => !v.deletedAt), [courts]);
  const activeShuttlecocks = useMemo(() => shuttlecocks.filter((s) => !s.deletedAt), [shuttlecocks]);

  // Nhóm đã chọn lần trước nếu còn dùng được, ngược lại lấy nhóm đầu tiên.
  const selectedGroup = useMemo(
    () => activeGroups.find((g) => g.id === preferredGroupId) ?? activeGroups[0],
    [activeGroups, preferredGroupId],
  );

  const selectGroup = useCallback((id: string) => {
    setPreferredGroupId(id);
    try {
      window.localStorage.setItem(SELECTED_GROUP_STORAGE_KEY, id);
    } catch {
      // Bỏ qua nếu trình duyệt chặn localStorage
    }
  }, []);

  const handleSaveGroup = useCallback(
    async (group: Group, successMessage = 'Đã lưu nhóm lên Firebase') => {
      setGroups((prev) =>
        prev.some((g) => g.id === group.id) ? prev.map((g) => (g.id === group.id ? group : g)) : [...prev, group],
      );
      if (!cloudOnline) {
        toast.info('Đã lưu trên máy. Chưa kết nối cloud nên chưa sync lên Firebase.');
        return;
      }
      try {
        await saveGroup(group);
        toast.success(successMessage);
      } catch (err) {
        toast.error(`Lưu thất bại: ${errorMessage(err)}`);
      }
    },
    [cloudOnline],
  );

  const handleSaveCourt = useCallback(
    async (court: Court, successMessage = 'Đã lưu sân lên Firebase') => {
      setCourts((prev) => {
        const next = prev.some((v) => v.id === court.id) ? prev.map((v) => (v.id === court.id ? court : v)) : [...prev, court];
        return next.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
      });
      if (!cloudOnline) {
        toast.info('Đã lưu trên máy. Chưa kết nối cloud nên chưa sync lên Firebase.');
        return;
      }
      try {
        await saveCourt(court);
        toast.success(successMessage);
      } catch (err) {
        toast.error(`Lưu thất bại: ${errorMessage(err)}`);
      }
    },
    [cloudOnline],
  );

  const handleSaveShuttlecock = useCallback(
    async (shuttlecock: Shuttlecock, successMessage = 'Đã lưu loại cầu lên Firebase') => {
      setShuttlecocks((prev) => {
        const next = prev.some((s) => s.id === shuttlecock.id)
          ? prev.map((s) => (s.id === shuttlecock.id ? shuttlecock : s))
          : [...prev, shuttlecock];
        return next.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
      });
      if (!cloudOnline) {
        toast.info('Đã lưu trên máy. Chưa kết nối cloud nên chưa sync lên Firebase.');
        return;
      }
      try {
        await saveShuttlecock(shuttlecock);
        toast.success(successMessage);
      } catch (err) {
        toast.error(`Lưu thất bại: ${errorMessage(err)}`);
      }
    },
    [cloudOnline],
  );

  const handleSaveSession = useCallback(
    async (draft: SessionBill) => {
      // Gắn thời điểm lưu và id tạm để danh sách trên máy sắp xếp/hiển thị đúng trước khi có id Firestore.
      const tempId = `local_${crypto.randomUUID()}`;
      const newBill: SessionBill = { ...draft, id: tempId, createdAt: draft.createdAt || moment().toISOString() };
      setSessions((prev) => [newBill, ...prev]);
      if (!cloudOnline) {
        toast.info('Đã lưu vào danh sách trên máy. Chưa sync Firebase.');
        return;
      }
      try {
        const savedId = await saveSession(newBill);
        setSessions((prev) => prev.map((s) => (s.id === tempId ? { ...s, id: savedId } : s)));
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
      groups,
      courts,
      shuttlecocks,
      activeGroups,
      activeCourts,
      activeShuttlecocks,
      settingsLoading,
      handleSaveGroup,
      handleSaveCourt,
      handleSaveShuttlecock,
      selectedGroup,
      selectGroup,
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
      groups,
      courts,
      shuttlecocks,
      activeGroups,
      activeCourts,
      activeShuttlecocks,
      settingsLoading,
      handleSaveGroup,
      handleSaveCourt,
      handleSaveShuttlecock,
      selectedGroup,
      selectGroup,
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
