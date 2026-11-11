import { z } from 'zod';

/** Thành viên cố định hoặc vãng lai. Nằm bên trong `groups.members` và `sessions.playerBreakdowns`. */
export const playerSchema = z.object({
  id: z.string(),
  name: z.string(),
  gender: z.enum(['MALE', 'FEMALE']),
  type: z.enum(['REGULAR', 'GUEST']).default('REGULAR'),
  guestSource: z.enum(['FRIEND', 'FACEBOOK']).optional(),
  role: z.enum(['LEADER', 'VICE_LEADER']).optional(),
  active: z.boolean().optional(),
  drinksWater: z.boolean().optional(),
});
