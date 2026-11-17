import type { TPaymentMethod, TSession, TSessionDraft } from '@/types/session.type';
import { SupabaseClientApi } from '../client/supabase.client';

/** Buổi chơi: bảng `sessions` + từng người chơi trong bảng `session_players`. */
export class SessionApi extends SupabaseClientApi {
  /** Lấy các buổi chơi đã lưu kèm người chơi (theo thứ tự lúc tính tiền), mới nhất trước. */
  static async fetchAll(): Promise<TSession[]> {
    const { data, error } = await this.database
      .from('sessions')
      .select('*, session_players(*)')
      .order('created_at', { ascending: false })
      .order('position', { referencedTable: 'session_players', ascending: true });
    if (error) throw error;
    // Các cột enum (gender, paid_method...) đã được database kiểm tra bằng `check`, chỉ thu hẹp kiểu.
    return (data ?? []) as TSession[];
  }

  /**
   * Lưu 1 buổi chơi mới cùng người chơi trong 1 transaction (hàm `save_session`). Trả về id buổi chơi.
   * Thứ tự người chơi trong mảng được lưu vào cột `position`.
   */
  static async save({ session_players, ...session }: TSessionDraft): Promise<string> {
    const players = session_players.map((player, position) => ({ ...player, position }));
    const { data, error } = await this.database.rpc('save_session', { p_session: session, p_players: players });
    if (error) throw error;
    return data as string;
  }

  /** Xóa 1 buổi chơi; người chơi của buổi đó tự bị xóa theo (`on delete cascade`). */
  static async delete(id: string): Promise<void> {
    const { error } = await this.database.from('sessions').delete().eq('id', id);
    if (error) throw error;
  }

  /**
   * Đánh dấu / bỏ đánh dấu đã chuyển tiền cho 1 hoặc nhiều người của 1 buổi, trong 1 lệnh update.
   * `method = null` = bỏ đánh dấu. `paidAt` truyền từ app để giao diện (cập nhật optimistic) và database cùng giá trị.
   */
  static async updatePayments(
    sessionId: string,
    playerIds: string[],
    method: TPaymentMethod | null,
    paidAt: string | null,
  ): Promise<void> {
    if (playerIds.length === 0) return;
    const { error } = await this.database
      .from('session_players')
      .update({ paid_method: method, paid_at: method ? paidAt : null })
      .eq('session_id', sessionId)
      .in('player_id', playerIds);
    if (error) throw error;
  }
}
