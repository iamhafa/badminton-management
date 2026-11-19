import { EQueryKey } from '@/libs/enum/query-key.enum';
import { ShuttlecockApi } from '@/libs/supabase';
import type { TShuttlecock } from '@/types/shuttlecock.type';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/** Lấy toàn bộ danh sách loại cầu. */
export function useQueryShuttlecocks() {
  return useQuery<TShuttlecock[], Error, TShuttlecock[]>({
    queryKey: [EQueryKey.SHUTTLECOCKS],
    queryFn: () => ShuttlecockApi.fetchAll(),
    initialData: [],
    initialDataUpdatedAt: 0,
  });
}

/** Tạo mới hoặc ghi đè 1 loại cầu, rồi tải lại danh sách loại cầu. */
export function useMutateShuttlecock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shuttlecock: TShuttlecock) => ShuttlecockApi.save(shuttlecock),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [EQueryKey.SHUTTLECOCKS] }),
  });
}

/** Đặt 1 loại cầu làm mặc định, rồi tải lại danh sách loại cầu. */
export function useMutateSetDefaultShuttlecock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ShuttlecockApi.setDefault(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [EQueryKey.SHUTTLECOCKS] }),
  });
}

/** Xóa hẳn 1 loại cầu. Database tự bỏ liên kết ở buổi chơi (`set null`), nên tải lại cả lịch sử. */
export function useMutateDeleteShuttlecock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ShuttlecockApi.delete(id),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: [EQueryKey.SHUTTLECOCKS] }),
        queryClient.invalidateQueries({ queryKey: [EQueryKey.SESSIONS] }),
      ]),
  });
}
