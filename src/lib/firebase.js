import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// You would need to download a service account key from Firebase Console
// const serviceAccount = require('./path/to/serviceAccountKey.json');

export function initFirebase() {
  if (getApps().length === 0) {
    initializeApp({
      // credential: cert(serviceAccount)
    });
  }
  return getFirestore();
}
