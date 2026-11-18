import type { TGroup } from '@/types/group.type';
import type { TSession } from '@/types/session.type';

// Các hàm thuần cho bộ lọc theo nhóm của màn hình lịch sử.

/** Giá trị bộ lọc "Tất cả nhóm". */
export const ALL_GROUPS = '__all__';

const UNKNOWN_GROUP = 'Không rõ nhóm';

export type TGroupFilterOption = {
  /** Id nhóm; `''` cho buổi chơi không gắn nhóm. */
  id: string;
  name: string;
  /** Số buổi chơi của nhóm này. */
  count: number;
};

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
  for (const s of sessions) counts.set(s.group_id ?? '', (counts.get(s.group_id ?? '') ?? 0) + 1);

  const known = groups.filter((g) => counts.has(g.id)).map((g) => ({ id: g.id, name: g.name, count: counts.get(g.id)! }));
  const unknown = [...counts.keys()]
    .filter((id) => !groups.some((g) => g.id === id))
    .map((id) => ({
      id,
      name: sessions.find((s) => (s.group_id ?? '') === id)?.group_name || UNKNOWN_GROUP,
      count: counts.get(id)!,
    }));
  return [...known, ...unknown];
}

/** Các buổi chơi của nhóm `groupId` (`ALL_GROUPS` = mọi nhóm). */
export function filterSessionsByGroup(sessions: TSession[], groupId: string): TSession[] {
  return groupId === ALL_GROUPS ? sessions : sessions.filter((s) => (s.group_id ?? '') === groupId);
}
