import { EQueryKey } from '@/libs/enum/query-key.enum';
import { SessionApi } from '@/libs/supabase';
import type { TPaymentMethod, TSession, TSessionDraft } from '@/types/session.type';
import { useMutation, useQuery, useQueryClient, type QueryClient, type QueryKey } from '@tanstack/react-query';

type TSessionsSnapshot = [QueryKey, TSession[] | undefined][];

export function useQuerySessions() {
  return useQuery<TSession[], Error, TSession[]>({
    queryKey: [EQueryKey.SESSIONS],
    queryFn: () => SessionApi.fetchAll(),
    initialData: [],
    initialDataUpdatedAt: 0,
  });
}

/** Các buổi chơi chưa thu đủ, lọc ở database (`SessionApi.fetchUnsettled`). */
export function useQueryUnsettledSessions() {
  return useQuery<TSession[], Error, TSession[]>({
    queryKey: [EQueryKey.SESSIONS, EQueryKey.SESSIONS_UNSETTLED],
    queryFn: () => SessionApi.fetchUnsettled(),
    initialData: [],
    initialDataUpdatedAt: 0,
  });
}

/** Dừng các lần tải lịch sử đang chạy rồi chụp lại mọi danh sách lịch sử trong cache, để trả lại khi ghi lỗi. */
async function snapshotSessions(queryClient: QueryClient): Promise<TSessionsSnapshot> {
  await queryClient.cancelQueries({ queryKey: [EQueryKey.SESSIONS] });
  return queryClient.getQueriesData<TSession[]>({ queryKey: [EQueryKey.SESSIONS] });
}

function restoreSessions(queryClient: QueryClient, snapshot: TSessionsSnapshot | undefined): void {
  snapshot?.forEach(([key, data]) => queryClient.setQueryData(key, data));
}

/** Lưu 1 buổi chơi mới, rồi tải lại danh sách lịch sử. */
export function useMutateSaveSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (draft: TSessionDraft) => SessionApi.save(draft),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [EQueryKey.SESSIONS] }),
  });
}

export type TUpdatePaymentsInput = {
  sessionId: string;
  playerIds: string[];
  /** `null` = bỏ đánh dấu. */
  method: TPaymentMethod | null;
  /** Thời điểm đánh dấu (ISO), dùng chung cho giao diện và database. */
  paidAt: string;
};

/**
 * Đánh dấu / bỏ đánh dấu đã chuyển tiền. Giao diện đổi ngay (optimistic) ở mọi danh sách lịch sử, lỗi thì trả lại như cũ.
 * Xong thì chỉ tải lại danh sách chưa thu đủ (buổi vừa thu đủ rời khỏi danh sách, hoàn tác thì quay lại),
 * không tải lại toàn bộ lịch sử. Bấm liên tiếp nhiều lần thì chỉ tải lại sau lần ghi cuối,
 * để kết quả của lần ghi trước không đè lên đánh dấu optimistic của lần sau.
 */
export function useMutateUpdatePayments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [EQueryKey.SESSIONS, EQueryKey.SESSIONS_UPDATE_PAYMENTS],
    mutationFn: ({ sessionId, playerIds, method, paidAt }: TUpdatePaymentsInput) =>
      SessionApi.updatePayments(sessionId, playerIds, method, paidAt),
    onMutate: async ({ sessionId, playerIds, method, paidAt }: TUpdatePaymentsInput) => {
      const previous = await snapshotSessions(queryClient);
      const ids = new Set(playerIds);
      queryClient.setQueriesData<TSession[]>({ queryKey: [EQueryKey.SESSIONS] }, (prev) =>
        prev?.map((s) =>
          s.id !== sessionId
            ? s
            : {
                ...s,
                session_players: s.session_players.map((p) =>
                  ids.has(p.player_id) ? { ...p, paid_method: method, paid_at: method ? paidAt : null } : p,
                ),
              },
        ),
      );
      return { previous };
    },
    onError: (_err, _input, context) => restoreSessions(queryClient, context?.previous),
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey: [EQueryKey.SESSIONS, EQueryKey.SESSIONS_UPDATE_PAYMENTS] }) > 1) return;
      return queryClient.invalidateQueries({ queryKey: [EQueryKey.SESSIONS, EQueryKey.SESSIONS_UNSETTLED] });
    },
  });
}

/** Xóa 1 buổi chơi. Bỏ khỏi mọi danh sách lịch sử ngay (optimistic), lỗi thì trả lại như cũ. */
export function useMutateDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => SessionApi.delete(id),
    onMutate: async (id: string) => {
      const previous = await snapshotSessions(queryClient);
      queryClient.setQueriesData<TSession[]>({ queryKey: [EQueryKey.SESSIONS] }, (prev) => prev?.filter((s) => s.id !== id));

      return {
        previous,
      };
    },
    onError: (_err, _id, context) => restoreSessions(queryClient, context?.previous),
  });
}
