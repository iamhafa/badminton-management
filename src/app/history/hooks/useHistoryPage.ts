'use client';

import { useQueryGroups } from '@/hooks/useQueryGroups';
import { useMutateDeleteSession, useMutateUpdatePayments, useQuerySessions } from '@/hooks/useQuerySessions';
import { confirm } from '@/stores/confirm.store';
import { ConnectionState, useConnectionStore } from '@/stores/connection.store';
import type { TPaymentMethod, TSession } from '@/types/session.type';
import { buildSessionTitle, nowIso } from '@/utils/date';
import { formatVND } from '@/utils/format';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ALL_GROUPS, buildGroupFilterOptions, filterSessionsByGroup, sessionGroupName } from '../utils/filter';
import { groupSessionsByMonth } from '../utils/month';
import { getPaymentSummary, unpaidPlayerIds } from '../utils/payment';

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** State và thao tác của trang Lịch sử. `page.tsx` chỉ lo hiển thị. */
export function useHistoryPage() {
  const cloudOnline: boolean = useConnectionStore((state: ConnectionState) => state.cloudStatus === 'online');

  const { data: sessions, isFetching: sessionsLoading, error: sessionsError, refetch: refetchSessions } = useQuerySessions();
  const { data: groups, isFetching: groupsLoading, error: groupsError, refetch: refetchGroups } = useQueryGroups();
  const { mutateAsync: deleteSession } = useMutateDeleteSession();
  const { mutateAsync: updatePayments } = useMutateUpdatePayments();

  const loading: boolean = sessionsLoading || groupsLoading;
  const loadError = sessionsError ?? groupsError;
  const error: string | null = loadError ? `Không tải được lịch sử: ${errorMessage(loadError)}` : null;

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [groupFilter, setGroupFilter] = useState<string>(ALL_GROUPS);
  const [unsettledOnly, setUnsettledOnly] = useState(false);

  const filterOptions = useMemo(() => buildGroupFilterOptions(sessions, groups), [sessions, groups]);
  const groupSessions = useMemo(() => filterSessionsByGroup(sessions, groupFilter), [sessions, groupFilter]);
  const unsettledSessions = useMemo(() => groupSessions.filter((s) => !getPaymentSummary(s).settled), [groupSessions]);
  const visibleSessions: TSession[] = unsettledOnly ? unsettledSessions : groupSessions;
  const months = useMemo(() => groupSessionsByMonth(visibleSessions), [visibleSessions]);

  function groupNameOf(session: TSession): string {
    return sessionGroupName(session, groups);
  }

  function refresh(): void {
    void refetchSessions();
    void refetchGroups();
  }

  /**
   * Ghi thay đổi chuyển tiền (`null` = bỏ đánh dấu). `paidAt` bỏ trống = giờ hiện tại.
   * Giao diện đổi ngay; lỗi thì báo và trả lại như cũ. Trả về false nếu lưu thất bại.
   */
  async function savePayments(
    sessionId: string,
    playerIds: string[],
    method: TPaymentMethod | null,
    paidAt?: string,
  ): Promise<boolean> {
    try {
      await updatePayments({ sessionId, playerIds, method, paidAt: paidAt ?? nowIso() });
      return true;
    } catch (err) {
      toast.error(`Không lưu được trạng thái chuyển tiền: ${errorMessage(err)}`);
      return false;
    }
  }

  /**
   * Đánh dấu / bỏ đánh dấu 1 người (mọi khoản thu đều là chuyển khoản).
   * Lưu xong hiện thông báo kèm nút "Hoàn tác" (trả về đúng hình thức và giờ thu cũ) để sửa khi bấm nhầm.
   * Các thông báo dùng chung 1 id nên chỉ còn thông báo của lần bấm gần nhất.
   */
  async function setPayment(session: TSession, playerId: string, paid: boolean): Promise<void> {
    const sessionId = session.id;
    const player = session.session_players.find((p) => p.player_id === playerId);
    if (!sessionId || !player) return;
    const prevMethod = player.paid_method;
    const prevPaidAt = player.paid_at ?? undefined;
    if (!(await savePayments(sessionId, [playerId], paid ? 'TRANSFER' : null))) return;
    const verb = player.rounded_payable < 0 ? 'đã hoàn' : 'đã thu';
    toast.success(paid ? `${player.name} ${verb}` : `Đã bỏ đánh dấu ${player.name}`, {
      id: 'payment-undo',
      duration: 5000,
      action: {
        label: 'Hoàn tác',
        onClick: () => void savePayments(sessionId, [playerId], prevMethod, prevPaidAt),
      },
    });
  }

  async function markAllPaid(session: TSession): Promise<void> {
    if (!session.id) return;
    const playerIds = unpaidPlayerIds(session);
    const count = playerIds.length;
    if (count === 0) return;
    const ok = await confirm({
      title: 'Đánh dấu tất cả đã thu?',
      description: `${count} người còn lại của buổi "${buildSessionTitle(session.iso_date)}" sẽ được đánh dấu đã thu (chuyển khoản). Bạn vẫn có thể bỏ đánh dấu từng người sau.`,
      confirmLabel: 'Đánh dấu',
    });
    if (!ok) return;
    if (await savePayments(session.id, playerIds, 'TRANSFER')) toast.success(`Đã đánh dấu ${count} người đã thu.`);
  }

  async function removeSession(session: TSession): Promise<void> {
    if (!session.id) return;
    const ok = await confirm({
      title: 'Xóa buổi chơi này?',
      description: `Buổi "${buildSessionTitle(session.iso_date)}" (${session.session_players.length} người, ${formatVND(session.total_cost)}) sẽ bị xóa vĩnh viễn khỏi lịch sử.`,
      confirmLabel: 'Xóa',
      destructive: true,
    });
    if (!ok) return;
    setDeletingId(session.id);
    try {
      await deleteSession(session.id);
      toast.success(`Đã xóa buổi ${buildSessionTitle(session.iso_date)}.`);
    } catch (err) {
      toast.error(`Xóa thất bại: ${errorMessage(err)}`);
    } finally {
      setDeletingId(null);
    }
  }

  return {
    cloudOnline,
    loading,
    error,
    totalCount: sessions.length,
    visibleCount: visibleSessions.length,
    unsettledCount: unsettledSessions.length,
    months,
    filterOptions,
    groupFilter,
    setGroupFilter,
    unsettledOnly,
    toggleUnsettledOnly: () => setUnsettledOnly((v) => !v),
    expandedId,
    setExpandedId,
    deletingId,
    groupNameOf,
    refresh,
    setPayment,
    markAllPaid,
    removeSession,
  };
}
