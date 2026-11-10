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
import type { Group, Player, SessionBill, Shuttlecock, Court } from '@/types/badminton';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Dữ liệu cũ (1 danh sách thành viên duy nhất). Chỉ còn đọc để chuyển sang nhóm đầu tiên.
const LEGACY_ROSTER_COLLECTION = 'club_settings';
const LEGACY_ROSTER_DOC_ID = 'regular_roster';

// Dữ liệu cũ của sân (trước đây gọi là venues). Chỉ còn đọc để chuyển sang collection courts.
const LEGACY_VENUES_COLLECTION = 'venues';

const GROUPS_COLLECTION = 'groups';
const COURTS_COLLECTION = 'courts';
const SHUTTLECOCKS_COLLECTION = 'shuttlecocks';
const SESSIONS_COLLECTION = 'sessions';

/** Nhóm được tạo từ danh sách thành viên cũ. Các buổi chơi cũ (chưa có groupId) thuộc nhóm này. */
export const LEGACY_GROUP_ID = 'vut-cau-long';
const LEGACY_GROUP_NAME = 'Vụt Cầu Lông';
const DEFAULT_FEMALE_CAP = 50000;

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

function nowIso(): string {
  return moment().toISOString();
}

/** Chỉ giữ các field cần lưu của thành viên cố định. */
function cleanMembers(members: Player[]): Player[] {
  return members.map(({ id, name, gender, role }) => ({
    id,
    name,
    gender,
    type: 'REGULAR',
    role, // undefined sẽ được bỏ qua (ignoreUndefinedProperties)
  }));
}

// ---------- Nhóm: groups/{id} ----------

function toGroup(id: string, data: Partial<Group> & { defaultVenueId?: string }): Group {
  return {
    id,
    name: data.name ?? '',
    femaleCap: typeof data.femaleCap === 'number' ? data.femaleCap : DEFAULT_FEMALE_CAP,
    // defaultVenueId là tên field cũ của defaultCourtId
    defaultCourtId: data.defaultCourtId ?? data.defaultVenueId ?? '',
    members: Array.isArray(data.members) ? data.members : [],
    createdAt: data.createdAt ?? '',
    updatedAt: data.updatedAt ?? '',
    deletedAt: data.deletedAt ?? null,
  };
}

async function fetchLegacyRoster(): Promise<Player[]> {
  const snap = await getDoc(doc(getDb(), LEGACY_ROSTER_COLLECTION, LEGACY_ROSTER_DOC_ID));
  if (!snap.exists()) return [];
  const data = snap.data() as { members?: Player[] };
  return Array.isArray(data.members) ? data.members : [];
}

/**
 * Lấy danh sách nhóm (gồm cả nhóm đã ẩn), sắp theo thời gian tạo.
 * Lần đầu chưa có nhóm nào: tạo nhóm "Vụt Cầu Lông" từ danh sách thành viên cũ.
 * Document cũ club_settings/regular_roster được giữ nguyên.
 */
export async function fetchGroups(): Promise<Group[]> {
  const snap = await getDocs(collection(getDb(), GROUPS_COLLECTION));
  if (!snap.empty) {
    return snap.docs.map((d) => toGroup(d.id, d.data() as Partial<Group>)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  const now = nowIso();
  const firstGroup: Group = {
    id: LEGACY_GROUP_ID,
    name: LEGACY_GROUP_NAME,
    femaleCap: DEFAULT_FEMALE_CAP,
    defaultCourtId: '',
    members: cleanMembers(await fetchLegacyRoster()),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  await saveGroup(firstGroup);
  return [firstGroup];
}

/** Tạo mới hoặc ghi đè toàn bộ 1 nhóm (id do client sinh). */
export async function saveGroup(group: Group): Promise<void> {
  const { id, ...data } = group;
  await setDoc(doc(getDb(), GROUPS_COLLECTION, id), { ...data, members: cleanMembers(data.members) });
}

// ---------- Sân: courts/{id} ----------

function toCourt(id: string, data: Partial<Court>): Court {
  return {
    id,
    name: data.name ?? '',
    address: data.address ?? '',
    createdAt: data.createdAt ?? '',
    updatedAt: data.updatedAt ?? '',
    deletedAt: data.deletedAt ?? null,
  };
}

/**
 * Lấy danh sách sân (gồm cả sân đã ẩn), sắp theo tên.
 * Lần đầu chưa có sân nào trong courts: sao chép các sân từ collection cũ venues (giữ nguyên id).
 * Collection venues được giữ nguyên, không bị xóa.
 */
export async function fetchCourts(): Promise<Court[]> {
  const snap = await getDocs(collection(getDb(), COURTS_COLLECTION));
  if (!snap.empty) {
    return snap.docs.map((d) => toCourt(d.id, d.data() as Partial<Court>)).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }

  const legacySnap = await getDocs(collection(getDb(), LEGACY_VENUES_COLLECTION));
  const migrated = legacySnap.docs.map((d) => toCourt(d.id, d.data() as Partial<Court>));
  await Promise.all(migrated.map(saveCourt));
  return migrated.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

/** Tạo mới hoặc ghi đè toàn bộ 1 sân (id do client sinh). */
export async function saveCourt(court: Court): Promise<void> {
  const { id, ...data } = court;
  await setDoc(doc(getDb(), COURTS_COLLECTION, id), data);
}

// ---------- Loại cầu: shuttlecocks/{id} ----------

/** Hai loại cầu từng được ghi cứng trong form tính tiền, dùng để tạo danh mục lần đầu. */
const DEFAULT_SHUTTLECOCKS: ReadonlyArray<Pick<Shuttlecock, 'id' | 'name' | 'tubePrice'>> = [
  { id: 'thanh-cong', name: 'Thành Công', tubePrice: 300000 },
  { id: 'dabata', name: 'Dabata', tubePrice: 260000 },
];

function toShuttlecock(id: string, data: Partial<Shuttlecock>): Shuttlecock {
  return {
    id,
    name: data.name ?? '',
    tubePrice: typeof data.tubePrice === 'number' ? data.tubePrice : 0,
    createdAt: data.createdAt ?? '',
    updatedAt: data.updatedAt ?? '',
    deletedAt: data.deletedAt ?? null,
  };
}

function sortByName<T extends { name: string }>(list: T[]): T[] {
  return list.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

/**
 * Lấy danh sách loại cầu (gồm cả loại đã ẩn), sắp theo tên.
 * Lần đầu chưa có loại nào: tạo sẵn "Thành Công" và "Dabata".
 */
export async function fetchShuttlecocks(): Promise<Shuttlecock[]> {
  const snap = await getDocs(collection(getDb(), SHUTTLECOCKS_COLLECTION));
  if (!snap.empty) {
    return sortByName(snap.docs.map((d) => toShuttlecock(d.id, d.data() as Partial<Shuttlecock>)));
  }

  const now = nowIso();
  const seeded: Shuttlecock[] = DEFAULT_SHUTTLECOCKS.map((s) => ({ ...s, createdAt: now, updatedAt: now, deletedAt: null }));
  await Promise.all(seeded.map(saveShuttlecock));
  return sortByName(seeded);
}

/** Tạo mới hoặc ghi đè toàn bộ 1 loại cầu (id do client sinh). */
export async function saveShuttlecock(shuttlecock: Shuttlecock): Promise<void> {
  const { id, ...data } = shuttlecock;
  await setDoc(doc(getDb(), SHUTTLECOCKS_COLLECTION, id), data);
}

// ---------- Lịch sử buổi chơi: sessions/{id} ----------

export async function fetchSessions(): Promise<SessionBill[]> {
  const q = query(collection(getDb(), SESSIONS_COLLECTION), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    // venueId / venueName là tên field cũ của courtId / courtName
    const { venueId, venueName, ...data } = d.data() as Partial<SessionBill> & { venueId?: string; venueName?: string };
    // Buổi chơi cũ chưa có nhóm/sân: coi như thuộc nhóm đầu tiên, chưa rõ sân.
    return {
      ...(data as SessionBill),
      id: d.id,
      groupId: data.groupId || LEGACY_GROUP_ID,
      groupName: data.groupName || (data.groupId ? '' : LEGACY_GROUP_NAME),
      courtId: data.courtId ?? venueId ?? '',
      courtName: data.courtName ?? venueName ?? '',
      shuttlecockId: data.shuttlecockId ?? '',
    };
  });
}

export async function saveSession(bill: SessionBill): Promise<string> {
  const { id: _id, ...data } = bill;
  const ref = await addDoc(collection(getDb(), SESSIONS_COLLECTION), data);
  return ref.id;
}

export async function deleteSession(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), SESSIONS_COLLECTION, id));
}
