import type { TCourt } from '@/types/court.type';
import { SupabaseClientApi } from '../client/supabase.client';

/** Sân cầu lông: bảng `courts`. */
export class CourtApi extends SupabaseClientApi {
  /** Lấy danh sách sân, sắp theo thời điểm tạo. */
  static async fetchAll(): Promise<TCourt[]> {
    const { data, error } = await this.database.from('courts').select('*').order('created_at', {
      ascending: true,
    });
    if (error) throw error;
    return data;
  }

  /** Tạo mới hoặc ghi đè 1 sân (id do app sinh). */
  static async save(court: TCourt): Promise<void> {
    const { error } = await this.database.from('courts').upsert(court);
    if (error) throw error;
  }

  /**
   * Xóa hẳn 1 sân. Khóa ngoại `sessions.court_id` và `groups.default_court_id` là `on delete set null`,
   * nên buổi chơi cũ vẫn giữ tên sân (`court_name`) và nhóm đang dùng sân này về "chưa chọn sân".
   */
  static async delete(id: string): Promise<void> {
    const { error } = await this.database.from('courts').delete().eq('id', id);
    if (error) throw error;
  }
}
