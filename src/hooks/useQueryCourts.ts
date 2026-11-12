import { CourtApi } from '@/libs/firebase';
import type { TCourt } from '@/types/court.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/** Lấy toàn bộ danh sách sân cầu (chỉ active). */
export function useQueryCourts() {
  return useQuery<TCourt[], Error, TCourt[]>({
    queryKey: ['courts'],
    queryFn: () => CourtApi.fetchAll(),
    initialData: [],
    initialDataUpdatedAt: 0,
    select: (courts) => courts.filter((g) => !g.deletedAt),
  });
}

/** Tạo mới hoặc ghi đè 1 sân, rồi tải lại danh sách sân. */
export function useMutateSaveCourt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (court: TCourt) => CourtApi.save(court),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courts'] }),
  });
}
