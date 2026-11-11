export type Gender = 'MALE' | 'FEMALE';

export type MemberType = 'REGULAR' | 'GUEST';

// Nguồn của khách vãng lai: Bạn bè/người quen hoặc tuyển từ Facebook
export type GuestSource = 'FRIEND' | 'FACEBOOK';

// Vai trò trong CLB: Trưởng nhóm (đặt sân, mua cầu) và Phó nhóm. Mỗi vai trò chỉ 1 người.
export type MemberRole = 'LEADER' | 'VICE_LEADER';

// Thành viên cố định hoặc vãng lai
export type TPlayer = {
  id: string;
  name: string;
  gender: Gender;
  type: MemberType;
  guestSource?: GuestSource; // Dành riêng cho khách vãng lai (mặc định: 'FRIEND')
  role?: MemberRole; // Chỉ dành cho thành viên cố định
  active?: boolean; // Dùng cho thành viên cố định khi tick chọn đi đánh hôm đó
  drinksWater?: boolean; // Có uống nước lọc chung hay không (mặc định: true)
};
