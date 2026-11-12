import { ShuttlecockApi } from '@/libs/firebase';
import type { TShuttlecock } from '@/types/shuttlecock.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useShuttlecocks() {
  return useQuery({
    queryKey: ['shuttlecocks'],
    queryFn: () => ShuttlecockApi.fetchAll(),
  });
}

/** Tạo mới hoặc ghi đè 1 loại cầu, rồi tải lại danh sách loại cầu. */
export function useSaveShuttlecock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shuttlecock: TShuttlecock) => ShuttlecockApi.save(shuttlecock),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shuttlecocks'] }),
  });
}

/** Đặt 1 loại cầu làm mặc định, rồi tải lại danh sách loại cầu. */
export function useSetDefaultShuttlecock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ShuttlecockApi.setDefault(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shuttlecocks'] }),
  });
}
