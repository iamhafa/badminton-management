import { z } from 'zod';

/**
 * Các schema trong thư mục này kiểm tra dữ liệu đọc từ Firestore, mỗi thực thể một file `<tên>.schema.ts`.
 * - Field thiếu thì lấy giá trị mặc định (tương thích dữ liệu cũ).
 * - Field có sai kiểu (VD: số lại là chuỗi) thì ném lỗi, document đó sẽ bị bỏ qua và ghi log (xem `parseDocs` trong firebase.helper.ts).
 * Kiểu trả về của các hàm `parse*` được TypeScript đối chiếu với interface trong `@/types`.
 *
 * File này chứa phần dùng chung giữa các schema.
 */

/** Document Firestore thô, chưa kiểm tra kiểu. */
export type RawDoc = Record<string, unknown>;

/** Chuỗi, mặc định rỗng khi thiếu field. */
export const text = z.string().default('');

/** Số, mặc định 0 khi thiếu field. */
export const amount = z.number().default(0);

/** Các field thời gian chung của nhóm, sân, loại cầu. `deletedAt` khác null nghĩa là đã bị ẩn. */
export const timestamps = {
  createdAt: text,
  updatedAt: text,
  deletedAt: z.string().nullable().default(null),
};

/** Chuỗi mô tả lỗi dữ liệu để ghi log. */
export function describeParseError(err: unknown): string {
  return err instanceof z.ZodError ? z.prettifyError(err) : String(err);
}
