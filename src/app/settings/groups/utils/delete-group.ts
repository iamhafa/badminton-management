import type { TGroup } from '@/types/group.type';

/** Nội dung hộp xác nhận xóa nhóm, dùng chung cho trang danh sách nhóm và trang chi tiết nhóm. */
export function deleteGroupConfirmOptions(group: TGroup, sessionCount: number) {
  const historyNote: string =
    sessionCount > 0 ? ` ${sessionCount} buổi chơi đã lưu của nhóm vẫn còn trong lịch sử và giữ nguyên tên nhóm.` : '';
  return {
    title: `Xóa nhóm "${group.name}"?`,
    description: `Nhóm và danh sách ${group.members.length} thành viên sẽ bị xóa vĩnh viễn, không khôi phục được.${historyNote}`,
    confirmLabel: 'Xóa nhóm',
    destructive: true,
  };
}
