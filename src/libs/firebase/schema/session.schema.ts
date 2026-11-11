import type { TSessionBill } from '@/types/session.types';
import { z } from 'zod';
import { amount, text, type RawDoc } from './common.schema';
import { playerSchema } from './player.schema';

const playerBreakdownSchema = playerSchema.extend({
  courtAndShuttleShare: amount,
  waterShare: amount,
  baseShare: amount,
  waterCredit: amount,
  rawNetPayable: amount,
  roundedPayable: amount,
});

const sessionSchema = z.object({
  createdAt: text,
  groupId: text,
  groupName: text,
  courtId: text,
  courtName: text,
  shuttlecockId: text,
  isoDate: text,
  hoursPlayed: amount,
  courtFee: amount,
  shuttleBrand: text,
  tubePrice: amount,
  shuttlesUsed: amount,
  waterFee: amount,
  waterPayerId: text,
  femaleCap: amount,
  dateFormatted: text,
  title: text,
  shuttleTotalCost: amount,
  totalCost: amount,
  waterDrinkersCount: amount,
  waterPerPerson: amount,
  roundedFemaleUnit: amount,
  roundedMaleUnit: amount,
  totalCount: amount,
  maleCount: amount,
  femaleCount: amount,
  playerBreakdowns: z.array(playerBreakdownSchema).default([]),
});

/** `sessions/{id}`. */
export function parseSession(id: string, data: RawDoc): TSessionBill {
  return { id, ...sessionSchema.parse(data) };
}
