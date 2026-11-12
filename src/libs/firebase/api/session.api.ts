import type { TSessionBill } from '@/types/session.types';
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query } from 'firebase/firestore';
import { COLLECTIONS } from '../constant/firebase-collection.constant';
import { parseDocs } from '../helper/firebase.helper';
import { parseSession } from '../schema/session.schema';
import { FirestoreClient } from '../firestore/firestore.client';

/** Lịch sử buổi chơi: `sessions/{id}`. */
export class SessionApi extends FirestoreClient {
  /** Lấy các buổi chơi đã lưu, mới nhất trước. */
  static async fetchAll(): Promise<TSessionBill[]> {
    const q = query(collection(this.firestore, COLLECTIONS.sessions), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return parseDocs(snap, 'buổi chơi', parseSession);
  }

  /** Lưu một buổi chơi mới. Trả về id do Firestore sinh. */
  static async save(bill: TSessionBill): Promise<string> {
    const { id: _id, ...data } = bill;
    const ref = await addDoc(collection(this.firestore, COLLECTIONS.sessions), data);
    return ref.id;
  }

  static async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, COLLECTIONS.sessions, id));
  }
}
