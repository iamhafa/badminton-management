import type { Shuttlecock } from '@/types/shuttlecock.types';
import { z } from 'zod';
import { amount, text, timestamps, type RawDoc } from './common.schema';

const shuttlecockSchema = z.object({
  name: text,
  tubePrice: amount,
  ...timestamps,
});

/** `shuttlecocks/{id}`. */
export function parseShuttlecock(id: string, data: RawDoc): Shuttlecock {
  return { id, ...shuttlecockSchema.parse(data) };
}
