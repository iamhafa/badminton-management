import type { TSession } from '@/types/session.type';
import { parseIsoDate } from '@/utils/date';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { getPaymentSummary } from './payment';

export type TMonthGroup = {
  /** 'yyyy-MM', hoặc 'unknown' với buổi chơi không có ngày hợp lệ. */
  key: string;
  /** VD: 'Tháng 11/2026' */
  label: string;
  sessions: TSession[];
  /** Tổng chi phí các buổi trong tháng. */
  total: number;
  /** Tổng tiền chưa thu của các buổi trong tháng. */
  outstanding: number;
};

/**
 * Gom các buổi chơi theo tháng của ngày chơi, tháng mới nhất trước.
 * Trong một tháng: ngày chơi mới nhất trước; cùng ngày thì buổi lưu sau đứng trước.
 */
export function groupSessionsByMonth(sessions: TSession[]): TMonthGroup[] {
  const sorted = [...sessions].sort((a, b) => b.iso_date.localeCompare(a.iso_date) || b.created_at.localeCompare(a.created_at));
  const groups: TMonthGroup[] = [];
  for (const session of sorted) {
    const date = parseIsoDate(session.iso_date);
    const key = date ? format(date, 'yyyy-MM') : 'unknown';
    let group = groups.at(-1);
    if (!group || group.key !== key) {
      group = {
        key,
        label: date ? `Tháng ${format(date, 'MM/yyyy')}` : 'Không rõ ngày',
        sessions: [],
        total: 0,
        outstanding: 0,
      };
      groups.push(group);
    }
    group.sessions.push(session);
    group.total += session.total_cost;
    group.outstanding += getPaymentSummary(session).outstanding;
  }
  return groups;
}

/** Các phần hiển thị trong ô lịch của 1 buổi chơi: 'CN', '15', 'Th11'. Null nếu ngày không hợp lệ. */
export function sessionDateParts(isoDate: string): { weekday: string; day: string; month: string } | null {
  const date = parseIsoDate(isoDate);
  if (!date) return null;

  return {
    weekday: format(date, 'EEEEE', { locale: vi }),
    day: format(date, 'dd'),
    month: `Th${format(date, 'M')}`,
  };
}
