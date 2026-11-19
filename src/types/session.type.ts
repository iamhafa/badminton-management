import type { Tables } from '@/libs/supabase/types/database.type';
import type { Gender, GuestSource, MemberRole, MemberType } from '@/types/player.type';

// Hình thức chuyển tiền: Chuyển khoản / Tiền mặt
export type TPaymentMethod = 'TRANSFER' | 'CASH';

/**
 * 1 người trong 1 buổi chơi: 1 dòng bảng `session_players` (số tiền đã chốt + trạng thái chuyển tiền).
 * Các cột enum được thu hẹp kiểu theo ràng buộc `check` trong database.
 */
export type TSessionPlayer = Omit<Tables<'session_players'>, 'gender' | 'type' | 'guest_source' | 'role' | 'paid_method'> & {
  gender: Gender;
  type: MemberType;
  guest_source: GuestSource | null;
  role: MemberRole | null;
  paid_method: TPaymentMethod | null; // null = chưa chuyển
};

/** Buổi chơi đã lưu kèm người chơi: kết quả `select('*, session_players(*)')` của bảng `sessions`. */
export type TSession = Tables<'sessions'> & { session_players: TSessionPlayer[] };

/**
 * Dữ liệu nhập ở màn hình tính tiền. Tên field theo cột của bảng `sessions`.
 * Các id dùng `null` khi chưa chọn (như database).
 */
export type TSessionInput = Pick<
  Tables<'sessions'>,
  | 'group_id'
  | 'court_id'
  | 'shuttlecock_id'
  | 'shuttle_brand'
  | 'iso_date'
  | 'hours_played'
  | 'court_fee'
  | 'tube_price'
  | 'shuttles_used'
  | 'water_fee'
  | 'water_payer_id'
  | 'female_cap'
>;

/**
 * Kết quả tính tiền của 1 buổi chưa lưu: đúng hình dạng của `TSession` nhưng chưa có id / created_at / updated_at,
 * và người chơi chưa có session_id / created_at / updated_at (hàm `save_session` tự gán).
 * Lưu bằng `SessionApi.save` (tách `session_players` ra).
 */
export type TSessionDraft = Omit<TSession, 'id' | 'created_at' | 'updated_at' | 'session_players'> & {
  session_players: Omit<TSessionPlayer, 'session_id' | 'created_at' | 'updated_at'>[];
};
