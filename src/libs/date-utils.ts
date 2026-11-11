import { format, getDay, isValid, parse, parseISO } from 'date-fns';

const WEEKDAYS_VN = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'] as const;

/** 'YYYY-MM-DD' -> Date theo giờ địa phương, hoặc null nếu không hợp lệ. */
function parseIsoDate(isoDate: string): Date | null {
  const date = parse(isoDate, 'yyyy-MM-dd', new Date());
  return isValid(date) ? date : null;
}

/** 'YYYY-MM-DD' -> 'DD/MM/YYYY' */
export function formatDateVN(isoDate: string): string {
  if (!isoDate) return '';
  const date = parseIsoDate(isoDate);
  return date ? format(date, 'dd/MM/yyyy') : isoDate;
}

/** 'YYYY-MM-DD' -> 'Chủ Nhật' / 'Thứ Hai' ... */
export function getWeekdayVN(isoDate: string): string {
  if (!isoDate) return '';
  const date = parseIsoDate(isoDate);
  return date ? WEEKDAYS_VN[getDay(date)] : '';
}

/** 'YYYY-MM-DD' -> 'Chủ Nhật, ngày 08/11/2026' */
export function buildSessionTitle(isoDate: string): string {
  if (!isoDate) return '';
  const date = parseIsoDate(isoDate);
  return date ? `${WEEKDAYS_VN[getDay(date)]}, ngày ${format(date, 'dd/MM/yyyy')}` : isoDate;
}

/** Ngày hôm nay dạng 'YYYY-MM-DD' theo giờ địa phương. */
export function todayIso(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/** Thời điểm hiện tại dạng ISO (UTC), dùng cho createdAt / updatedAt / deletedAt. */
export function nowIso(): string {
  return new Date().toISOString();
}

/** ISO timestamp -> 'HH:mm DD/MM/YYYY' */
export function formatDateTimeVN(isoTimestamp: string): string {
  if (!isoTimestamp) return '';
  const date = parseISO(isoTimestamp);
  return isValid(date) ? format(date, 'HH:mm dd/MM/yyyy') : isoTimestamp;
}
