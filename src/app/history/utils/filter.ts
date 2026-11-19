import type { TGroup } from '@/types/group.type';
import type { TSession } from '@/types/session.type';
// Các hàm thuần cho bộ lọc theo nhóm của màn hình lịch sử.
/** Giá trị bộ lọc "Tất cả nhóm". */
export const ALL_GROUPS = '__all__';
const UNKNOWN_GROUP = 'Không rõ nhóm';
/** Tiền tố khóa lọc của buổi chơi thuộc nhóm đã bị xóa (`group_id = null`). */
const DELETED_GROUP_PREFIX = 'deleted:';
export type TGroupFilterOption = {
  /** Khóa lọc: id nhóm, hoặc `deleted:<tên nhóm>` cho buổi chơi của nhóm đã bị xóa. */
  id: string;
  name: string;
  /** Số buổi chơi của nhóm này. */
  count: number;
};
/**
 * Khóa lọc của 1 buổi chơi. Nhóm bị xóa thì database đặt `group_id = null` cho mọi buổi của nhóm đó,
 * nên các buổi này được tách theo tên nhóm đã lưu (`group_name`) để không bị gộp chung.
 */
export function sessionGroupKey(session: TSession): string {
  return session.group_id ?? `${DELETED_GROUP_PREFIX}${session.group_name}`;
}
/** Tên nhóm lưu trong buổi chơi; nếu thiếu thì lấy tên hiện tại của nhóm. */
export function sessionGroupName(session: TSession, groups: TGroup[]): string {
  return session.group_name || groups.find((g) => g.id === session.group_id)?.name || UNKNOWN_GROUP;
}
/**
 * Các lựa chọn lọc: chỉ gồm các nhóm có buổi chơi đã lưu, theo thứ tự nhóm.
 * Nhóm không còn trong danh sách (VD: đã xóa) đứng cuối, lấy tên lưu trong buổi chơi.
 */
export function buildGroupFilterOptions(sessions: TSession[], groups: TGroup[]): TGroupFilterOption[] {
  const counts = new Map<string, number>();
  const names = new Map<string, string>();
  for (const s of sessions) {
    const key = sessionGroupKey(s);
    counts.set(key, (counts.get(key) ?? 0) + 1);
    if (!names.has(key)) names.set(key, s.group_name || UNKNOWN_GROUP);
  }
  const known = groups.filter((g) => counts.has(g.id)).map((g) => ({ id: g.id, name: g.name, count: counts.get(g.id)! }));
  const unknown = [...counts.keys()]
    .filter((key) => !groups.some((g) => g.id === key))
    .map((key) => ({ id: key, name: names.get(key)!, count: counts.get(key)! }));
  return [...known, ...unknown];
}
/** Các buổi chơi khớp khóa lọc `groupKey` (`ALL_GROUPS` = mọi nhóm). */
export function filterSessionsByGroup(sessions: TSession[], groupKey: string): TSession[] {
  return groupKey === ALL_GROUPS ? sessions : sessions.filter((s) => sessionGroupKey(s) === groupKey);
}
