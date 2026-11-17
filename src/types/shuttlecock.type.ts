import type { Tables } from '@/libs/supabase/types/database.type';

/** Loại quả cầu (dùng chung cho mọi nhóm, mỗi ống 12 quả): 1 dòng bảng `shuttlecocks`. */
export type TShuttlecock = Tables<'shuttlecocks'>;
