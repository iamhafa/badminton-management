import type { Tables } from '@/libs/supabase/types/database.type';

/** Sân cầu lông (dùng chung cho mọi nhóm): 1 dòng bảng `courts`. Xóa sân là xóa hẳn dòng (không dùng `deleted_at`). */
export type TCourt = Tables<'courts'>;
