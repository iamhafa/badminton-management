import { getFirestore, initializeFirestore, type Firestore } from 'firebase/firestore';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';

/**
 * Lớp cơ sở cho các class API. Chỉ chia sẻ quyền truy cập Firestore cho lớp con;
 * `protected` nên code bên ngoài không lấy được `db` qua `CourtApi.db`...
 */
export abstract class FirestoreClient {
  private static firebaseApp: FirebaseApp;

  protected static get firestore(): Firestore {
    if (!this.firebaseApp) {
      const isNewApp: boolean = getApps().length === 0;

      this.firebaseApp = isNewApp
        ? initializeApp({
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
          })
        : getApp();

      // Bỏ qua các field `undefined` (VD: TPlayer.active) thay vì để Firestore báo lỗi.
      // Chỉ gọi được một lần cho mỗi firebaseApp, trước khi có bất kỳ lệnh nào khác tới Firestore.
      if (isNewApp) initializeFirestore(this.firebaseApp, { ignoreUndefinedProperties: true });
    }

    const firestore: Firestore = getFirestore(this.firebaseApp);
    return firestore;
  }
}
