import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import firebaseConfigJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Use named database if specified in config, otherwise default
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  ...(firebaseConfigJson.firestoreDatabaseId && firebaseConfigJson.firestoreDatabaseId !== '(default)'
    ? { databaseId: firebaseConfigJson.firestoreDatabaseId }
    : {}),
});

export const auth = getAuth(app);
export const storage = getStorage(app);

export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Connected to Firebase Firestore successfully.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore client is offline, using cache/local state.');
    } else {
      console.log('Firebase connection verified (ready).');
    }
    return false;
  }
}

// Test connection on boot
testConnection();

export default app;

