import { z } from 'zod';

/**
 * Schema kiểm tra dữ liệu người dùng nhập ở các form (dùng với react-hook-form qua `zodResolver`).
 * Khác với `schemas.ts` (kiểm tra dữ liệu đọc từ Firestore). Kiểu của form lấy từ chính schema bằng `z.infer`.
 * Các điều kiện phụ thuộc dữ liệu hiện có (VD: trùng tên) kiểm tra trong hàm `onSubmit` của trang rồi báo bằng `setError`.
 */

const requiredName = (message: string) => z.string().trim().min(1, message);
const genderSchema = z.enum(['MALE', 'FEMALE']);
const positiveAmount = (message: string) => z.number().int().positive(message);

export const groupFormSchema = z.object({
  name: requiredName('Nhập tên nhóm'),
  femaleCap: positiveAmount('Nhập mức trần nữ lớn hơn 0'),
  defaultCourtId: z.string(),
});
export type GroupDraft = z.infer<typeof groupFormSchema>;

export const courtFormSchema = z.object({
  name: requiredName('Nhập tên sân'),
  address: z.string().trim(),
});
export type CourtDraft = z.infer<typeof courtFormSchema>;

export const shuttlecockFormSchema = z.object({
  name: requiredName('Nhập tên loại cầu'),
  tubePrice: positiveAmount('Nhập giá 1 ống lớn hơn 0'),
});
export type ShuttlecockDraft = z.infer<typeof shuttlecockFormSchema>;

/** Thành viên cố định. `role` rỗng nghĩa là thành viên thường (form thêm mới không hiển thị trường này). */
export const memberFormSchema = z.object({
  name: requiredName('Nhập tên thành viên'),
  gender: genderSchema,
  role: z.enum(['', 'LEADER', 'VICE_LEADER']),
});
export type MemberDraft = z.infer<typeof memberFormSchema>;

export const guestFormSchema = z.object({
  name: requiredName('Nhập tên vãng lai'),
  gender: genderSchema,
});
export type GuestDraft = z.infer<typeof guestFormSchema>;
