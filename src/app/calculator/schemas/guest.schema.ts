import { z } from 'zod';

export const guestFormSchema = z.object({
  name: z.string().trim().min(1, 'Nhập tên vãng lai'),
  gender: z.enum(['MALE', 'FEMALE']),
});

export type GuestDraft = z.infer<typeof guestFormSchema>;
