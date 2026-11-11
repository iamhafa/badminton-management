import type { TShuttlecock } from '@/types/shuttlecock.types';
import { z } from 'zod';
import { amount, text, timestamps, type RawDoc } from './common.schema';

const shuttlecockSchema = z.object({
  name: text,
  tubePrice: amount,
  isDefault: z.boolean().default(false),
  ...timestamps,
});

/** `shuttlecocks/{id}`. */
export function parseShuttlecock(id: string, data: RawDoc): TShuttlecock {
  return { id, ...shuttlecockSchema.parse(data) };
}
