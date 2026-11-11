import type { Group } from '@/types/group.types';
import { z } from 'zod';
import { text, timestamps, type RawDoc } from './common.schema';
import { playerSchema } from './player.schema';

/** Mức trần ưu tiên nữ mặc định khi nhóm chưa có giá trị. */
const DEFAULT_FEMALE_CAP = 50000;

const groupSchema = z.object({
  name: text,
  femaleCap: z.number().default(DEFAULT_FEMALE_CAP),
  defaultCourtId: text,
  members: z.array(playerSchema).default([]),
  ...timestamps,
});

/** `groups/{id}`. */
export function parseGroup(id: string, data: RawDoc): Group {
  return { id, ...groupSchema.parse(data) };
}
