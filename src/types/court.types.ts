// Sân cầu lông (dùng chung cho mọi nhóm)
export type TCourt = {
  id: string;
  name: string;
  address: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null; // ISO khi bị ẩn, null khi đang dùng
};
