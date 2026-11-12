import { GroupApi } from '@/libs/firebase';
import type { TGroup } from '@/types/group.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: () => GroupApi.fetchAll(),
  });
}

/** Tạo mới hoặc ghi đè 1 nhóm, rồi tải lại danh sách nhóm. */
export function useSaveGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (group: TGroup) => GroupApi.save(group),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups'] }),
  });
}
