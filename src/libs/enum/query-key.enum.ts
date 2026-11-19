/**
 * Các phần của query key / mutation key TanStack Query. Key là mảng ghép từ các phần này,
 * VD: `[QueryKey.SESSIONS, QueryKey.SESSIONS_UNSETTLED]`. Invalidate theo tiền tố (`[QueryKey.SESSIONS]`)
 * thì làm mới mọi query bắt đầu bằng phần đó.
 */
export enum EQueryKey {
  COURTS = 'courts',
  GROUPS = 'groups',
  SESSIONS = 'sessions',
  SHUTTLECOCKS = 'shuttlecocks',
  /** `[SESSIONS, SESSIONS_UNSETTLED]`: các buổi chơi chưa thu đủ. */
  SESSIONS_UNSETTLED = 'sessions-unsettled',
  /** `[SESSIONS, SESSIONS_UPDATE_PAYMENTS]`: mutation key của lần đánh dấu chuyển tiền. */
  SESSIONS_UPDATE_PAYMENTS = 'sessions-update-payments',
}
