import type { TCourt } from '@/types/court.type';
import { SupabaseApi } from '../client/supabase.client';

/** Sân cầu lông: bảng `courts`. */
export class CourtApi extends SupabaseApi {
  /** Lấy danh sách sân (gồm cả sân đã ẩn), sắp theo tên. */
  static async fetchAll(): Promise<TCourt[]> {
    const { data, error } = await this.db.from('courts').select('*').order('created_at', {
      ascending: true,
    });
    this.throwIfError(error);
    return data ?? [];
  }

  /** Tạo mới hoặc ghi đè 1 sân (id do app sinh). */
  static async save(court: TCourt): Promise<void> {
    const { error } = await this.db.from('courts').upsert(court);
    this.throwIfError(error);
  }
}
