import type { TSessionBill } from '@/types/session.types';
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query } from 'firebase/firestore';
import { FirebaseClient } from '../client/firebase.client';
import { COLLECTIONS } from '../constant/firebase-collection.constant';
import { parseDocs } from '../helper/firebase.helper';
import { parseSession } from '../schema/session.schema';

/** Lịch sử buổi chơi: `sessions/{id}`. */
export class SessionApi {
  /** Lấy các buổi chơi đã lưu, mới nhất trước. */
  static async fetchAll(): Promise<TSessionBill[]> {
    const q = query(collection(FirebaseClient.db, COLLECTIONS.sessions), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return parseDocs(snap, 'buổi chơi', parseSession);
  }

  /** Lưu một buổi chơi mới. Trả về id do Firestore sinh. */
  static async save(bill: TSessionBill): Promise<string> {
    const { id: _id, ...data } = bill;
    const ref = await addDoc(collection(FirebaseClient.db, COLLECTIONS.sessions), data);
    return ref.id;
  }

  static async delete(id: string): Promise<void> {
    await deleteDoc(doc(FirebaseClient.db, COLLECTIONS.sessions, id));
  }
}
