import type { Tables } from '@/libs/supabase/types/database.type';

/** Sân cầu lông (dùng chung cho mọi nhóm): 1 dòng bảng `courts`. `deleted_at` khác null = đã ẩn. */
export type TCourt = Tables<'courts'>;
