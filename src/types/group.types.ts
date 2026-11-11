import type { TPlayer } from '@/types/player.types';

// Nhóm chơi cầu lông: mỗi nhóm có danh sách thành viên và mức trần nữ riêng
export type TGroup = {
  id: string;
  name: string;
  femaleCap: number; // Mức trần ưu tiên nữ mặc định của nhóm
  defaultCourtId: string; // Sân hay chơi ('' nếu chưa chọn)
  members: TPlayer[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null; // ISO khi bị ẩn, null khi đang dùng
};
