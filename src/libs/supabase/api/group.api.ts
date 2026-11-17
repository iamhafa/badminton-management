import type { TGroup, TGroupSave } from '@/types/group.type';
import { SupabaseApi } from '../client/supabase.client';

/** Nhóm chơi: bảng `groups` + thành viên trong bảng `members`. */
export class GroupApi extends SupabaseApi {
  /** Lấy danh sách nhóm (gồm cả nhóm đã ẩn) kèm thành viên, sắp theo thời gian tạo. */
  static async fetchAll(): Promise<TGroup[]> {
    const { data, error } = await this.db
      .from('groups')
      .select('*, members(*)')
      .order('created_at', { ascending: true })
      .order('position', { referencedTable: 'members', ascending: true });
    this.throwIfError(error);
    // `gender` / `role` của thành viên đã được database kiểm tra bằng `check`, chỉ thu hẹp kiểu.
    return (data ?? []) as TGroup[];
  }

  /**
   * Tạo mới hoặc ghi đè 1 nhóm cùng toàn bộ danh sách thành viên, trong 1 transaction (hàm `save_group`).
   * Thành viên không còn trong danh sách sẽ bị xóa khỏi nhóm; lịch sử buổi chơi không bị ảnh hưởng.
   */
  static async save({ members, ...group }: TGroupSave): Promise<void> {
    const { error } = await this.db.rpc('save_group', { p_group: group, p_members: members });
    this.throwIfError(error);
  }
}
