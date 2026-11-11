// Loại quả cầu lông (dùng chung cho mọi nhóm). Mỗi ống có 12 quả.
export type TShuttlecock = {
  id: string;
  name: string; // VD: "Thành Công", "Dabata"
  tubePrice: number; // Giá 1 ống mặc định, điền sẵn khi chọn loại cầu (mỗi buổi vẫn nhập lại được)
  isDefault?: boolean; // True nếu được đặt làm loại cầu mặc định cho các lần tính tiền
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null; // ISO khi bị ẩn, null khi đang dùng
};
