import type { Group } from '@/types/group.types';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { FirebaseClient } from '../client/firebase.client';
import { COLLECTIONS } from '../constant/firebase-collection.constant';
import { cleanMembers, parseDocs } from '../helper/firebase.helper';
import { parseGroup } from '../schema/group.schema';

/** Nhóm chơi: `groups/{id}`. */
export class GroupApi {
  /** Lấy danh sách nhóm (gồm cả nhóm đã ẩn), sắp theo thời gian tạo. */
  static async fetchAll(): Promise<Group[]> {
    const snap = await getDocs(collection(FirebaseClient.db, COLLECTIONS.groups));
    return parseDocs(snap, 'nhóm', parseGroup).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  /** Tạo mới hoặc ghi đè toàn bộ 1 nhóm (id do client sinh). */
  static async save(group: Group): Promise<void> {
    const { id, ...data } = group;
    await setDoc(doc(FirebaseClient.db, COLLECTIONS.groups, id), { ...data, members: cleanMembers(data.members) });
  }
}
