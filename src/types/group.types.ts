import type { Player } from '@/types/player.types';

// Nhóm chơi cầu lông: mỗi nhóm có danh sách thành viên và mức trần nữ riêng
export interface Group {
  id: string;
  name: string;
  femaleCap: number; // Mức trần ưu tiên nữ mặc định của nhóm
  defaultCourtId: string; // Sân hay chơi ('' nếu chưa chọn)
  members: Player[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null; // ISO khi bị ẩn, null khi đang dùng
}
