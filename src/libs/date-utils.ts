import moment from 'moment';
import 'moment/locale/vi';

// Cấu hình locale tiếng Việt cho moment với các thứ viết hoa
moment.updateLocale('vi', {
  weekdays: ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'],
});

/** 'YYYY-MM-DD' -> 'DD/MM/YYYY' */
export function formatDateVN(isoDate: string): string {
  if (!isoDate) return '';
  const m = moment(isoDate, 'YYYY-MM-DD');
  return m.isValid() ? m.format('DD/MM/YYYY') : isoDate;
}

/** 'YYYY-MM-DD' -> 'Chủ Nhật' / 'Thứ Hai' ... */
export function getWeekdayVN(isoDate: string): string {
  if (!isoDate) return '';
  const m = moment(isoDate, 'YYYY-MM-DD');
  return m.isValid() ? m.format('dddd') : '';
}

/** 'YYYY-MM-DD' -> 'Chủ Nhật, ngày 08/11/2026' */
export function buildSessionTitle(isoDate: string): string {
  if (!isoDate) return '';
  const m = moment(isoDate, 'YYYY-MM-DD');
  return m.isValid() ? m.format('dddd, [ngày] DD/MM/YYYY') : isoDate;
}

/** Ngày hôm nay dạng 'YYYY-MM-DD' theo giờ địa phương. */
export function todayIso(): string {
  return moment().format('YYYY-MM-DD');
}

/** ISO timestamp -> 'HH:mm DD/MM/YYYY' */
export function formatDateTimeVN(isoTimestamp: string): string {
  if (!isoTimestamp) return '';
  const m = moment(isoTimestamp);
  return m.isValid() ? m.format('HH:mm DD/MM/YYYY') : isoTimestamp;
}
