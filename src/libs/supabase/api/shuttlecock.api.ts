import type { TShuttlecock } from '@/types/shuttlecock.type';
import { SupabaseClientApi } from '../client/supabase.client';

/** Loại quả cầu: bảng `shuttlecocks`. Hai loại mặc định được tạo sẵn trong migration SQL. */
export class ShuttlecockApi extends SupabaseClientApi {
  /** Lấy danh sách loại cầu (gồm cả loại đã ẩn), sắp theo tên. */
  static async fetchAll(): Promise<TShuttlecock[]> {
    const { data, error } = await this.database.from('shuttlecocks').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
  }

  /**
   * Tạo mới hoặc ghi đè 1 loại cầu (id do app sinh).
   * Không ghi `is_default`: cờ mặc định chỉ đổi qua `setDefault`, để dữ liệu cũ trên màn hình
   * (VD: vừa đổi loại mặc định nhưng danh sách chưa tải lại) không ghi đè lên cờ mới. Loại mới tạo mặc định là false.
   */
  static async save(shuttlecock: TShuttlecock): Promise<void> {
    shuttlecock.is_default = true;
    const { error } = await this.database.from('shuttlecocks').upsert(shuttlecock);
    if (error) throw error;
  }

  /** Đặt 1 loại cầu làm mặc định và bỏ cờ ở loại cũ, trong cùng 1 transaction. */
  static async setDefault(id: string): Promise<void> {
    const { error } = await this.database.rpc('set_default_shuttlecock', { p_id: id });
    if (error) throw error;
  }
}
