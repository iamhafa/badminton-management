import { EQueryKey } from '@/libs/enum/query-key.enum';
import { CourtApi } from '@/libs/supabase';
import type { TCourt } from '@/types/court.type';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/** Lấy toàn bộ danh sách sân cầu. */
export function useQueryCourts() {
  return useQuery<TCourt[], Error, TCourt[]>({
    queryKey: [EQueryKey.COURTS],
    queryFn: () => CourtApi.fetchAll(),
    initialData: [],
    initialDataUpdatedAt: 0,
  });
}

/** Tạo mới hoặc ghi đè 1 sân, rồi tải lại danh sách sân. */
export function useMutateSaveCourt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (court: TCourt) => CourtApi.save(court),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [EQueryKey.COURTS] }),
  });
}

/** Xóa hẳn 1 sân. Database tự bỏ liên kết ở nhóm và buổi chơi (`set null`), nên tải lại cả 3 danh sách. */
export function useMutateDeleteCourt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => CourtApi.delete(id),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: [EQueryKey.COURTS] }),
        queryClient.invalidateQueries({ queryKey: [EQueryKey.GROUPS] }),
        queryClient.invalidateQueries({ queryKey: [EQueryKey.SESSIONS] }),
      ]),
  });
}
