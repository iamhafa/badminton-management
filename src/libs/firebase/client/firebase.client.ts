import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, initializeFirestore, type Firestore } from 'firebase/firestore';
import { z } from 'zod';

const firebaseConfigSchema = z.object({
  apiKey: z.string().min(1),
  authDomain: z.string().min(1),
  projectId: z.string().min(1),
  storageBucket: z.string().min(1),
  messagingSenderId: z.string().min(1),
  appId: z.string().min(1),
});

type FirebaseConfig = z.infer<typeof firebaseConfigSchema>;

/** Tên biến môi trường tương ứng với từng field, dùng để báo lỗi dễ hiểu. */
const ENV_NAMES: Record<keyof FirebaseConfig, string> = {
  apiKey: 'NEXT_PUBLIC_FIREBASE_API_KEY',
  authDomain: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  projectId: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  storageBucket: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'NEXT_PUBLIC_FIREBASE_APP_ID',
};

/**
 * Điểm truy cập duy nhất tới Firebase, gồm cả cấu hình lẫn khởi tạo.
 * Khởi tạo lười: chỉ chạy khi có nơi dùng `FirebaseClient.db`, để module này nạp lúc build/prerender
 * không đòi biến môi trường.
 */
export class FirebaseClient {
  private static app: FirebaseApp;

  /**
   * Đọc và kiểm tra cấu hình Firebase từ biến môi trường.
   * Phải truy cập từng biến bằng tên đầy đủ (không dùng `process.env[key]`) để Next.js thay giá trị lúc build.
   */
  private static readConfig(): FirebaseConfig {
    const result = firebaseConfigSchema.safeParse({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    });
    if (!result.success) {
      const missing = [...new Set(result.error.issues.map((issue) => ENV_NAMES[issue.path[0] as keyof FirebaseConfig]))];
      throw new Error(`Thiếu cấu hình Firebase trong .env.local: ${missing.join(', ')}.`);
    }
    return result.data;
  }

  /** Firestore của app. An toàn với Fast Refresh: module nạp lại thì dùng lại app đã khởi tạo. */
  static get db(): Firestore {
    if (!FirebaseClient.app) {
      const isNewApp = getApps().length === 0;
      FirebaseClient.app = isNewApp ? initializeApp(FirebaseClient.readConfig()) : getApp();
      // Bỏ qua các field `undefined` (VD: Player.active) thay vì để Firestore báo lỗi.
      // Chỉ gọi được một lần cho mỗi app, trước khi có bất kỳ lệnh nào khác tới Firestore.
      if (isNewApp) initializeFirestore(FirebaseClient.app, { ignoreUndefinedProperties: true });
    }
    return getFirestore(FirebaseClient.app);
  }
}
