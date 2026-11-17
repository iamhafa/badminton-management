import type { Tables } from '@/libs/supabase/types/database.type';

export type Gender = 'MALE' | 'FEMALE';
export type MemberType = 'REGULAR' | 'GUEST';
// Nguồn của khách vãng lai: Bạn bè/người quen hoặc tuyển từ Facebook
export type GuestSource = 'FRIEND' | 'FACEBOOK';
// Vai trò trong CLB: Trưởng nhóm (đặt sân, mua cầu) và Phó nhóm. Mỗi vai trò chỉ 1 người.
export type MemberRole = 'LEADER' | 'VICE_LEADER';

/**
 * Thành viên cố định của nhóm: 1 dòng bảng `members`.
 * `gender` / `role` được thu hẹp kiểu theo ràng buộc `check` trong database (kiểu sinh tự động chỉ là `string`).
 */
export type TMember = Omit<Tables<'members'>, 'gender' | 'role'> & {
  gender: Gender;
  role: MemberRole | null;
};

/** Thông tin thành viên khi lưu nhóm (thứ tự trong mảng = thứ tự hiển thị). */
export type TMemberDraft = Pick<TMember, 'id' | 'name' | 'gender' | 'role'>;

/**
 * Người chơi đang được chọn ở màn hình tính tiền (thành viên cố định hoặc khách vãng lai).
 * Đặt tên field theo cột của bảng `session_players` để kết quả tính tiền lưu thẳng được.
 */
export type TParticipant = {
  id: string; // = session_players.player_id
  name: string;
  gender: Gender;
  type: MemberType;
  guest_source: GuestSource | null; // chỉ dành cho khách vãng lai
  role: MemberRole | null; // chỉ dành cho thành viên cố định
  drinks_water: boolean;
};
