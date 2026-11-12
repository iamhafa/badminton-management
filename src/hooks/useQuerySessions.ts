import { SessionApi } from '@/libs/firebase';
import type { TSessionBill } from '@/types/session.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useQuerySessions() {
  return useQuery<TSessionBill[], Error, TSessionBill[]>({
    queryKey: ['sessions'],
    queryFn: () => SessionApi.fetchAll(),
    initialData: [],
    initialDataUpdatedAt: 0,
  });
}

/** Lưu 1 buổi chơi mới. Firestore tự sinh id nên tải lại danh sách lịch sử lần sau khi mở. */
export function useMutateSaveSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bill: TSessionBill) => SessionApi.save(bill),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  });
}

/** Xóa 1 buổi chơi. Bỏ khỏi danh sách ngay (optimistic), lỗi thì trả lại như cũ. */
export function useMutateDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => SessionApi.delete(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['sessions'] });
      const previous = queryClient.getQueryData<TSessionBill[]>(['sessions']);
      queryClient.setQueryData<TSessionBill[]>(['sessions'], (prev) => prev?.filter((s) => s.id !== id));
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(['sessions'], context.previous);
    },
  });
}
