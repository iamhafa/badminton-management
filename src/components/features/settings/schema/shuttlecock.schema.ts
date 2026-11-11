import { z } from 'zod';

export const shuttlecockFormSchema = z.object({
  name: z.string().trim().min(1, 'Nhập tên loại cầu'),
  tubePrice: z.number().int().positive('Nhập giá 1 ống lớn hơn 0'),
});

export type ShuttlecockDraft = z.infer<typeof shuttlecockFormSchema>;

