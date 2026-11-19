import { EQueryKey } from '@/libs/enum/query-key.enum';
import { GroupApi } from '@/libs/supabase';
import type { TGroup, TGroupSave } from '@/types/group.type';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/** Lấy toàn bộ danh sách nhóm. */
export function useQueryGroups() {
  return useQuery<TGroup[], Error, TGroup[]>({
    queryKey: [EQueryKey.GROUPS],
    queryFn: () => GroupApi.fetchAll(),
    initialData: [],
    initialDataUpdatedAt: 0,
  });
}

/** Tạo mới hoặc ghi đè 1 nhóm cùng danh sách thành viên, rồi tải lại danh sách nhóm. */
export function useMutateSaveGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (group: TGroupSave) => GroupApi.save(group),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [EQueryKey.GROUPS] }),
  });
}

/** Xóa hẳn 1 nhóm. Database tự bỏ liên kết ở buổi chơi (`set null`), nên tải lại cả lịch sử. */
export function useMutateDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => GroupApi.delete(id),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: [EQueryKey.GROUPS] }),
        queryClient.invalidateQueries({ queryKey: [EQueryKey.SESSIONS] }),
      ]),
  });
}
