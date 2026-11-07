import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  initializeFirestore,
  orderBy,
  query,
  setDoc,
  type Firestore,
} from 'firebase/firestore';
import moment from 'moment';
import type { Player, SessionBill } from '@/types/badminton';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const ROSTER_COLLECTION = 'club_settings';
const ROSTER_DOC_ID = 'regular_roster';
const SESSIONS_COLLECTION = 'sessions';

let app: FirebaseApp | undefined;
let db: Firestore | undefined;

/** Khởi tạo Firebase App & Firestore một lần (an toàn với Fast Refresh). */
function getDb(): Firestore {
  if (db) return db;
  if (!firebaseConfig.projectId) {
    throw new Error('Thiếu cấu hình Firebase. Kiểm tra file .env.local (NEXT_PUBLIC_FIREBASE_*).');
  }
  const isNewApp = getApps().length === 0;
  app = isNewApp ? initializeApp(firebaseConfig) : getApp();
  // Bỏ qua các field `undefined` (VD: Player.active) thay vì để Firestore báo lỗi.
  db = isNewApp ? initializeFirestore(app, { ignoreUndefinedProperties: true }) : getFirestore(app);
  return db;
}

// ---------- Thành viên cố định: club_settings/regular_roster ----------

export async function fetchRoster(): Promise<Player[]> {
  const snap = await getDoc(doc(getDb(), ROSTER_COLLECTION, ROSTER_DOC_ID));
  if (!snap.exists()) return [];
  const data = snap.data() as { members?: Player[] };
  return Array.isArray(data.members) ? data.members : [];
}

export async function saveRoster(members: Player[]): Promise<void> {
  const cleaned: Player[] = members.map(({ id, name, gender, role }) => ({
    id,
    name,
    gender,
    type: 'REGULAR',
    role, // undefined sẽ được bỏ qua (ignoreUndefinedProperties)
  }));
  await setDoc(doc(getDb(), ROSTER_COLLECTION, ROSTER_DOC_ID), {
    members: cleaned,
    updatedAt: moment().toISOString(),
  });
}

// ---------- Lịch sử buổi chơi: sessions/{id} ----------

export async function fetchSessions(): Promise<SessionBill[]> {
  const q = query(collection(getDb(), SESSIONS_COLLECTION), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as SessionBill), id: d.id }));
}

export async function saveSession(bill: SessionBill): Promise<string> {
  const { id: _id, ...data } = bill;
  const ref = await addDoc(collection(getDb(), SESSIONS_COLLECTION), data);
  return ref.id;
}

export async function deleteSession(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), SESSIONS_COLLECTION, id));
}

/** Kiểm tra kết nối đọc Firestore (dùng cho chỉ báo trạng thái Cloud). */
export async function checkConnection(): Promise<boolean> {
  try {
    await getDoc(doc(getDb(), ROSTER_COLLECTION, ROSTER_DOC_ID));
    return true;
  } catch {
    return false;
  }
}
