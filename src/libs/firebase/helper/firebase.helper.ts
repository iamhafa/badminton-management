import type { TPlayer } from '@/types/player.types';
import type { QuerySnapshot } from 'firebase/firestore';
import { describeParseError } from '../schema/common.schema';

export function sortByName<T extends { name: string }>(list: T[]): T[] {
  return list.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

/**
 * Parse từng document trong kết quả truy vấn. Document có dữ liệu sai kiểu bị bỏ qua và ghi log,
 * để một document hỏng không làm cả danh sách không tải được.
 */
export function parseDocs<T>(snap: QuerySnapshot, label: string, parse: (id: string, data: Record<string, unknown>) => T): T[] {
  const items: T[] = [];
  for (const d of snap.docs) {
    try {
      items.push(parse(d.id, d.data()));
    } catch (err) {
      console.error(`Bỏ qua ${label} "${d.id}" vì dữ liệu không hợp lệ:\n${describeParseError(err)}`);
    }
  }
  return items;
}

/** Chỉ giữ các field cần lưu của thành viên cố định. */
export function cleanMembers(members: TPlayer[]): TPlayer[] {
  return members.map(({ id, name, gender, role }) => ({
    id,
    name,
    gender,
    type: 'REGULAR',
    role, // undefined sẽ được bỏ qua (ignoreUndefinedProperties)
  }));
}
