import type { TCourt } from '@/types/court.types';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { COLLECTIONS } from '../constant/firebase-collection.constant';
import { parseDocs, sortByName } from '../helper/firebase.helper';
import { parseCourt } from '../schema/court.schema';
import { FirestoreClient } from '../firestore/firestore.client';

/** Sân cầu lông: `courts/{id}`. */
export class CourtApi extends FirestoreClient {
  /** Lấy danh sách sân (gồm cả sân đã ẩn), sắp theo tên. */
  static async fetchAll(): Promise<TCourt[]> {
    const snap = await getDocs(collection(this.firestore, COLLECTIONS.courts));
    return sortByName(parseDocs(snap, 'sân', parseCourt));
  }

  /** Tạo mới hoặc ghi đè toàn bộ 1 sân (id do client sinh). */
  static async save(court: TCourt): Promise<void> {
    const { id, ...data } = court;
    await setDoc(doc(this.firestore, COLLECTIONS.courts, id), data);
  }
}
