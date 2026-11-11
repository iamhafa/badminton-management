import type { Court } from '@/types/court.types';
import { z } from 'zod';
import { text, timestamps, type RawDoc } from './common.schema';

const courtSchema = z.object({
  name: text,
  address: text,
  ...timestamps,
});

/** `courts/{id}`. */
export function parseCourt(id: string, data: RawDoc): Court {
  return { id, ...courtSchema.parse(data) };
}
