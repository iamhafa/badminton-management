import { CourtApi } from '@/libs/firebase';
import type { TCourt } from '@/types/court.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useCourts() {
  return useQuery({
    queryKey: ['courts'],
    queryFn: () => CourtApi.fetchAll(),
  });
}

/** Tạo mới hoặc ghi đè 1 sân, rồi tải lại danh sách sân. */
export function useSaveCourt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (court: TCourt) => CourtApi.save(court),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courts'] }),
  });
}
