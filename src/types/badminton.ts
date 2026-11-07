export type Gender = 'MALE' | 'FEMALE';

export type MemberType = 'REGULAR' | 'GUEST';

// Vai trò trong CLB: Trưởng nhóm (đặt sân, mua cầu) và Phó nhóm. Mỗi vai trò chỉ 1 người.
export type MemberRole = 'LEADER' | 'VICE_LEADER';

// Thành viên cố định hoặc vãng lai
export interface Player {
  id: string;
  name: string;
  gender: Gender;
  type: MemberType;
  role?: MemberRole; // Chỉ dành cho thành viên cố định
  active?: boolean; // Dùng cho thành viên cố định khi tick chọn đi đánh hôm đó
}

// Đầu vào form tính tiền
export interface SessionInput {
  isoDate: string; // YYYY-MM-DD
  hoursPlayed: number; // Mặc định: 2
  courtFee: number; // Tiền sân (VD: 280000)
  shuttleBrand: string; // Tên loại cầu (VD: "Thành Công", "Dabata")
  tubePrice: number; // Giá 1 ống 12 quả (VD: 300000)
  shuttlesUsed: number; // Số quả đã dùng (VD: 5)
  waterFee: number; // Tiền nước lọc (VD: 40000)
  waterPayerId: string; // 'ORGANIZER' hoặc ID của người chơi ứng tiền mua nước
  femaleCap: number; // Mức trần ưu tiên nữ (VD: 50000)
}

// Kết quả chi tiết từng người sau khi tính toán
export interface PlayerBreakdown extends Player {
  baseShare: number; // Số tiền gốc theo giới tính (chưa trừ tiền nước)
  waterCredit: number; // Tiền nước đã ứng (nếu người này mua nước)
  rawNetPayable: number; // baseShare - waterCredit (chưa làm tròn)
  roundedPayable: number; // Số tiền cuối cùng sau khi làm tròn (<500 xuống, >=500 lên)
}

// Toàn bộ kết quả của 1 buổi chơi (Dùng để hiển thị UI & Lưu lên Firestore)
export interface SessionBill extends SessionInput {
  id?: string;
  createdAt: string;
  dateFormatted: string; // DD/MM/YYYY
  title: string; // VD: "Chủ Nhật, ngày 08/11/2026"
  shuttleTotalCost: number; // (tubePrice / 12) * shuttlesUsed
  totalCost: number; // courtFee + shuttleTotalCost + waterFee
  roundedFemaleUnit: number;
  roundedMaleUnit: number;
  totalCount: number;
  maleCount: number;
  femaleCount: number;
  playerBreakdowns: PlayerBreakdown[];
}

export const ORGANIZER_ID = 'ORGANIZER';
