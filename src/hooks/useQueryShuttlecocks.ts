import { ShuttlecockApi } from '@/libs/firebase';
import type { TShuttlecock } from '@/types/shuttlecock.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/** Lấy toàn bộ danh sách loại cầu (chỉ active). */
export function useQueryShuttlecocks() {
  return useQuery<TShuttlecock[], Error, TShuttlecock[]>({
    queryKey: ['shuttlecocks'],
    queryFn: () => ShuttlecockApi.fetchAll(),
    initialData: [],
    initialDataUpdatedAt: 0,
    select: (shuttlecocks: TShuttlecock[]) => shuttlecocks.filter((shuttlecock: TShuttlecock) => !shuttlecock.deletedAt),
  });
}

/** Tạo mới hoặc ghi đè 1 loại cầu, rồi tải lại danh sách loại cầu. */
export function useMutateShuttlecock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shuttlecock: TShuttlecock) => ShuttlecockApi.save(shuttlecock),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shuttlecocks'] }),
  });
}

/** Đặt 1 loại cầu làm mặc định, rồi tải lại danh sách loại cầu. */
export function useMutateSetDefaultShuttlecock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ShuttlecockApi.setDefault(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shuttlecocks'] }),
  });
}
