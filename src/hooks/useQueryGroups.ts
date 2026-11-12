import { GroupApi } from '@/libs/firebase';
import type { TGroup } from '@/types/group.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/** Lấy toàn bộ danh sách nhóm (chỉ active). */
export function useQueryGroups() {
  return useQuery<TGroup[], Error, TGroup[]>({
    queryKey: ['groups'],
    queryFn: () => GroupApi.fetchAll(),
    initialData: [],
    initialDataUpdatedAt: 0,
    select: (groups: TGroup[]) => groups.filter((g: TGroup) => !g.deletedAt),
  });
}

/** Tạo mới hoặc ghi đè 1 nhóm, rồi tải lại danh sách nhóm. */
export function useMutateSaveGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (group: TGroup) => GroupApi.save(group),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups'] }),
  });
}
