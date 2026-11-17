import { z } from 'zod';

export const groupFormSchema = z.object({
  name: z.string().trim().min(1, 'Nhập tên nhóm'),
  female_cap: z.number().int().positive('Nhập mức trần nữ lớn hơn 0'),
  default_court_id: z.string(),
});

export type GroupDraft = z.infer<typeof groupFormSchema>;
