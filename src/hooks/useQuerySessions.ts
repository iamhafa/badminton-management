import { SessionApi } from '@/libs/supabase';
import type { TPaymentMethod, TSession, TSessionDraft } from '@/types/session.type';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useQuerySessions() {
  return useQuery<TSession[], Error, TSession[]>({
    queryKey: ['sessions'],
    queryFn: () => SessionApi.fetchAll(),
    initialData: [],
    initialDataUpdatedAt: 0,
  });
}

/** Lưu 1 buổi chơi mới, rồi tải lại danh sách lịch sử. */
export function useMutateSaveSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (draft: TSessionDraft) => SessionApi.save(draft),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
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
 * Đánh dấu / bỏ đánh dấu đã chuyển tiền. Giao diện đổi ngay (optimistic), lỗi thì trả lại như cũ.
 * Thành công thì không tải lại danh sách, để mỗi lần bấm không phải tải lại toàn bộ lịch sử.
 */
export function useMutateUpdatePayments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, playerIds, method, paidAt }: TUpdatePaymentsInput) =>
      SessionApi.updatePayments(sessionId, playerIds, method, paidAt),
    onMutate: async ({ sessionId, playerIds, method, paidAt }: TUpdatePaymentsInput) => {
      await queryClient.cancelQueries({ queryKey: ['sessions'] });
      const previous = queryClient.getQueryData<TSession[]>(['sessions']);
      const ids = new Set(playerIds);
      queryClient.setQueryData<TSession[]>(['sessions'], (prev) =>
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
    onError: (_err, _input, context) => {
      if (context?.previous) queryClient.setQueryData(['sessions'], context.previous);
    },
  });
}

/** Xóa 1 buổi chơi. Bỏ khỏi danh sách ngay (optimistic), lỗi thì trả lại như cũ. */
export function useMutateDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => SessionApi.delete(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['sessions'] });
      const previous = queryClient.getQueryData<TSession[]>(['sessions']);
      queryClient.setQueryData<TSession[]>(['sessions'], (prev) => prev?.filter((s) => s.id !== id));
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(['sessions'], context.previous);
    },
  });
}
