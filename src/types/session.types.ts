import type { Player } from '@/types/player.types';

// Đầu vào form tính tiền
export interface SessionInput {
  groupId: string; // Nhóm chơi buổi này
  courtId: string; // Sân chơi buổi này (bắt buộc khi lưu)
  isoDate: string; // YYYY-MM-DD
  hoursPlayed: number; // Mặc định: 2
  courtFee: number; // Tiền sân (VD: 280000)
  shuttlecockId: string; // Loại cầu của buổi này (bắt buộc khi lưu; '' với các buổi cũ)
  shuttleBrand: string; // Tên loại cầu tại thời điểm tính (VD: "Thành Công"), lấy từ loại cầu đã chọn
  tubePrice: number; // Giá 1 ống 12 quả của buổi này, nhập tay (VD: 300000)
  shuttlesUsed: number; // Số quả đã dùng (VD: 5)
  waterFee: number; // Tiền nước lọc (VD: 40000)
  waterPayerId: string; // ID của người chơi ứng tiền mua nước
  femaleCap: number; // Mức trần ưu tiên nữ (VD: 50000)
}

// Kết quả chi tiết từng người sau khi tính toán
export interface PlayerBreakdown extends Player {
  courtAndShuttleShare: number; // Tiền sân + tiền cầu
  waterShare: number; // Tiền nước người này phải trả (0 nếu không uống nước)
  baseShare: number; // Số tiền gốc theo giới tính + tiền nước (chưa trừ tiền ứng)
  waterCredit: number; // Tiền nước đã ứng (nếu người này mua nước)
  rawNetPayable: number; // baseShare - waterCredit (chưa làm tròn)
  roundedPayable: number; // Số tiền cuối cùng sau khi làm tròn (<500 xuống, >=500 lên)
}

// Toàn bộ kết quả của 1 buổi chơi (Dùng để hiển thị UI & Lưu lên Firestore)
export interface SessionBill extends SessionInput {
  id?: string;
  createdAt: string;
  groupName: string; // Tên nhóm tại thời điểm lưu (giữ nguyên khi nhóm bị đổi tên/ẩn)
  courtName: string; // Tên sân tại thời điểm lưu ('' với các buổi cũ chưa có sân)
  dateFormatted: string; // DD/MM/YYYY
  title: string; // VD: "Chủ Nhật, ngày 08/11/2026"
  shuttleTotalCost: number; // (tubePrice / 12) * shuttlesUsed
  totalCost: number; // courtFee + shuttleTotalCost + waterFee
  waterDrinkersCount: number; // Số người có uống nước
  waterPerPerson: number; // Tiền nước chia trên mỗi người uống
  roundedFemaleUnit: number;
  roundedMaleUnit: number;
  totalCount: number;
  maleCount: number;
  femaleCount: number;
  playerBreakdowns: PlayerBreakdown[];
}
