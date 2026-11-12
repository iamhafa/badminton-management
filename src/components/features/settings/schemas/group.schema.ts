import { z } from 'zod';

export const groupFormSchema = z.object({
  name: z.string().trim().min(1, 'Nhập tên nhóm'),
  femaleCap: z.number().int().positive('Nhập mức trần nữ lớn hơn 0'),
  defaultCourtId: z.string(),
});

export type GroupDraft = z.infer<typeof groupFormSchema>;
