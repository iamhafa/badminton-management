import { nowIso } from '@/libs/date-utils';
import type { Shuttlecock } from '@/types/shuttlecock.types';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { FirebaseClient } from '../client/firebase.client';
import { COLLECTIONS } from '../constant/firebase-collection.constant';
import { parseDocs, sortByName } from '../helper/firebase.helper';
import { parseShuttlecock } from '../schema/shuttlecock.schema';

/** Hai loại cầu từng được ghi cứng trong form tính tiền, dùng để tạo danh mục lần đầu. */
const DEFAULT_SHUTTLECOCKS: ReadonlyArray<Pick<Shuttlecock, 'id' | 'name' | 'tubePrice'>> = [
  { id: 'thanh-cong', name: 'Thành Công', tubePrice: 300000 },
  { id: 'dabata', name: 'Dabata', tubePrice: 260000 },
];

/** Loại quả cầu lông: `shuttlecocks/{id}`. */
export class ShuttlecockApi {
  /**
   * Lấy danh sách loại cầu (gồm cả loại đã ẩn), sắp theo tên.
   * Lần đầu chưa có loại nào: tạo sẵn "Thành Công" và "Dabata".
   */
  static async fetchAll(): Promise<Shuttlecock[]> {
    const snap = await getDocs(collection(FirebaseClient.db, COLLECTIONS.shuttlecocks));
    if (!snap.empty) {
      return sortByName(parseDocs(snap, 'loại cầu', parseShuttlecock));
    }

    const now = nowIso();
    const seeded: Shuttlecock[] = DEFAULT_SHUTTLECOCKS.map((s) => ({ ...s, createdAt: now, updatedAt: now, deletedAt: null }));
    await Promise.all(seeded.map((shuttlecock) => ShuttlecockApi.save(shuttlecock)));
    return sortByName(seeded);
  }

  /** Tạo mới hoặc ghi đè toàn bộ 1 loại cầu (id do client sinh). */
  static async save(shuttlecock: Shuttlecock): Promise<void> {
    const { id, ...data } = shuttlecock;
    await setDoc(doc(FirebaseClient.db, COLLECTIONS.shuttlecocks, id), data);
  }
}
