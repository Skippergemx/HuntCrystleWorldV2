import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

export const app = initializeApp(firebaseConfig);

// Initialize App Check
if (typeof window !== 'undefined') {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  
  if (siteKey) {
    // Allow local debugging
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      const debugToken = import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN;
      window.FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken || true;
      console.log("🛡️ Neural Shield: Local Debug Mode Active");
    }

    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: true
    });
  } else {
    console.warn("🛡️ Neural Shield Warning: VITE_RECAPTCHA_SITE_KEY is missing from .env! Shield is offline.");
  }
}

export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const appId = 'crystle-hunter-world-v1';
