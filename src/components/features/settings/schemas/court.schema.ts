import { z } from 'zod';

export const courtFormSchema = z.object({
  name: z.string().trim().min(1, 'Nhập tên sân'),
  address: z.string().trim(),
});

export type CourtDraft = z.infer<typeof courtFormSchema>;
