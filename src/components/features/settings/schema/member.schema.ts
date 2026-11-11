import { z } from 'zod';

export const memberFormSchema = z.object({
  name: z.string().trim().min(1, 'Nhập tên thành viên'),
  gender: z.enum(['MALE', 'FEMALE']),
  role: z.enum(['', 'LEADER', 'VICE_LEADER']),
});

export type MemberDraft = z.infer<typeof memberFormSchema>;

