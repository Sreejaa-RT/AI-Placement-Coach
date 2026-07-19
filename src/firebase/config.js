import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCSSynZWdXOA-X-9XlLw_l_bjUJEF7_mwM",
  authDomain: "ai-placement-coach-30fd7.firebaseapp.com",
  projectId: "ai-placement-coach-30fd7",
  storageBucket: "ai-placement-coach-30fd7.firebasestorage.app",
  messagingSenderId: "529036965435",
  appId: "1:529036965435:web:b115d27b367f924d994e1e",
  measurementId: "G-M2DSYPY2TC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth & Firestore
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Safe Analytics initialization
let analytics = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
}).catch(err => {
  console.warn("Firebase Analytics not supported in this environment:", err);
});

export { app, auth, db, googleProvider, analytics };
