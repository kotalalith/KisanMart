import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAgroMarketDefaultKeyPlaceholder123",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "agromarket-a0466.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "agromarket-a0466",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "agromarket-a0466.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "139315316077",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:139315316077:web:9c56872f3c3e4596870664"
};

// Initialize App
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Client-side messaging initialization with support check
export let messaging = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      if ('serviceWorker' in navigator && firebaseConfig.apiKey) {
        const swUrl = `/firebase-messaging-sw.js?apiKey=${encodeURIComponent(firebaseConfig.apiKey || '')}&projectId=${encodeURIComponent(firebaseConfig.projectId || '')}&messagingSenderId=${encodeURIComponent(firebaseConfig.messagingSenderId || '')}&appId=${encodeURIComponent(firebaseConfig.appId || '')}&storageBucket=${encodeURIComponent(firebaseConfig.storageBucket || '')}&authDomain=${encodeURIComponent(firebaseConfig.authDomain || '')}`;
        navigator.serviceWorker.register(swUrl).then((registration) => {
          messaging = getMessaging(app, { serviceWorkerRegistration: registration });
        }).catch(() => {
          messaging = getMessaging(app);
        });
      } else {
        messaging = getMessaging(app);
      }
    }
  }).catch((err) => {
    console.warn("FCM Messaging initialization warning:", err);
  });
}

// Initialize Firestore with Persistence only on the client side
export let db;
if (typeof window !== "undefined") {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
} else {
  db = getFirestore(app);
}

export default app;
