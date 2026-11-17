import type { TCourt } from '@/types/court.type';
import { SupabaseClientApi } from '../client/supabase.client';

/** Sân cầu lông: bảng `courts`. */
export class CourtApi extends SupabaseClientApi {
  /** Lấy danh sách sân (gồm cả sân đã ẩn), sắp theo tên. */
  static async fetchAll(): Promise<TCourt[]> {
    const { data, error } = await this.database.from('courts').select('*').order('created_at', {
      ascending: true,
    });
    if (error) throw error;
    return data ?? [];
  }

  /** Tạo mới hoặc ghi đè 1 sân (id do app sinh). */
  static async save(court: TCourt): Promise<void> {
    const { error } = await this.database.from('courts').upsert(court);
    if (error) throw error;
  }
}
