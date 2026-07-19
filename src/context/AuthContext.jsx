import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase/config';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up with Email & Password
  async function signup(email, password, displayName) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Set display name in Auth
    await updateProfile(user, { displayName });
    
    // Initialize profile in Firestore / LocalStorage
    const initialProfile = {
      uid: user.uid,
      email: user.email,
      displayName: displayName || email.split('@')[0],
      createdAt: new Date().toISOString(),
      readinessScore: 0,
      resumeStats: { score: 0, uploadsCount: 0, lastAnalyzed: null, targetRole: "" },
      interviewStats: { score: 0, completedCount: 0, lastPracticed: null },
      aptitudeStats: { score: 0, questionsSolved: 0, categories: {} },
      counselingSessions: 0,
      apiKey: "" // Optional custom API key
    };

    await saveUserProfile(user.uid, initialProfile);
    setUserProfile(initialProfile);
    return user;
  }

  // Log in with Email & Password
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Log out
  function logout() {
    return signOut(auth);
  }

  // Log in / Sign up with Google
  async function loginWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if profile exists
    const profile = await fetchUserProfile(user.uid);
    if (!profile) {
      const initialProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        createdAt: new Date().toISOString(),
        readinessScore: 0,
        resumeStats: { score: 0, uploadsCount: 0, lastAnalyzed: null, targetRole: "" },
        interviewStats: { score: 0, completedCount: 0, lastPracticed: null },
        aptitudeStats: { score: 0, questionsSolved: 0, categories: {} },
        counselingSessions: 0,
        apiKey: ""
      };
      await saveUserProfile(user.uid, initialProfile);
      setUserProfile(initialProfile);
    } else {
      setUserProfile(profile);
    }
    return user;
  }

  // Reset password
  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  // Save profile helper (Firestore with LocalStorage fallback)
  async function saveUserProfile(uid, profileData) {
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, profileData, { merge: true });
    } catch (error) {
      console.warn("Firestore save failed. Falling back to LocalStorage:", error.message);
      localStorage.setItem(`ai_coach_profile_${uid}`, JSON.stringify(profileData));
    }
  }

  // Fetch profile helper
  async function fetchUserProfile(uid) {
    try {
      const userRef = doc(db, 'users', uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
    } catch (error) {
      console.warn("Firestore fetch failed. Trying LocalStorage:", error.message);
    }
    
    const local = localStorage.getItem(`ai_coach_profile_${uid}`);
    return local ? JSON.parse(local) : null;
  }

  // Update profile metrics (e.g. after quiz or interview)
  async function updateUserStats(updates) {
    if (!currentUser) return;
    
    const updatedProfile = { ...userProfile, ...updates };
    
    // Recalculate main readiness score
    const resumeVal = updatedProfile.resumeStats?.score || 0;
    const interviewVal = updatedProfile.interviewStats?.score || 0;
    const aptitudeVal = updatedProfile.aptitudeStats?.score || 0;
    
    // Weighted readiness calculation
    updatedProfile.readinessScore = Math.round((resumeVal * 0.35) + (interviewVal * 0.35) + (aptitudeVal * 0.30));

    setUserProfile(updatedProfile);
    await saveUserProfile(currentUser.uid, updatedProfile);
  }

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const profile = await fetchUserProfile(user.uid);
        if (profile) {
          setUserProfile(profile);
        } else {
          // If signed in but no profile (e.g. local storage wiped or firestore slow), initialize one
          const defaultProfile = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            createdAt: new Date().toISOString(),
            readinessScore: 0,
            resumeStats: { score: 0, uploadsCount: 0, lastAnalyzed: null, targetRole: "" },
            interviewStats: { score: 0, completedCount: 0, lastPracticed: null },
            aptitudeStats: { score: 0, questionsSolved: 0, categories: {} },
            counselingSessions: 0,
            apiKey: ""
          };
          await saveUserProfile(user.uid, defaultProfile);
          setUserProfile(defaultProfile);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
    logout,
    loginWithGoogle,
    resetPassword,
    updateUserStats
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
