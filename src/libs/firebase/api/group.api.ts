import type { TGroup } from '@/types/group.types';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { COLLECTIONS } from '../constant/firebase-collection.constant';
import { cleanMembers, parseDocs } from '../helper/firebase.helper';
import { parseGroup } from '../schema/group.schema';
import { FirestoreClient } from '../firestore/firestore.client';

/** Nhóm chơi: `groups/{id}`. */
export class GroupApi extends FirestoreClient {
  /** Lấy danh sách nhóm (gồm cả nhóm đã ẩn), sắp theo thời gian tạo. */
  static async fetchAll(): Promise<TGroup[]> {
    const snap = await getDocs(collection(this.firestore, COLLECTIONS.groups));
    return parseDocs(snap, 'nhóm', parseGroup).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  /** Tạo mới hoặc ghi đè toàn bộ 1 nhóm (id do client sinh). */
  static async save(group: TGroup): Promise<void> {
    const { id, ...data } = group;
    await setDoc(doc(this.firestore, COLLECTIONS.groups, id), { ...data, members: cleanMembers(data.members) });
  }
}
