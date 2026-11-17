import { GroupApi } from '@/libs/supabase';
import type { TGroup, TGroupSave } from '@/types/group.type';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/** Lấy toàn bộ danh sách nhóm (chỉ active). */
export function useQueryGroups() {
  return useQuery<TGroup[], Error, TGroup[]>({
    queryKey: ['groups'],
    queryFn: () => GroupApi.fetchAll(),
    initialData: [],
    initialDataUpdatedAt: 0,
    select: (groups: TGroup[]) => groups.filter((g: TGroup) => !g.deleted_at),
  });
}

/** Tạo mới hoặc ghi đè 1 nhóm cùng danh sách thành viên, rồi tải lại danh sách nhóm. */
export function useMutateSaveGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (group: TGroupSave) => GroupApi.save(group),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups'] }),
  });
}
