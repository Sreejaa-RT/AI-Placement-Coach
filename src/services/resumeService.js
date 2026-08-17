import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Saves a completed resume analysis to Firestore under users/{userId}/resumeAnalyses
 */
export async function saveResumeAnalysis(userId, analysisData) {
  if (!userId) throw new Error('User ID is required to save analysis.');

  try {
    const userAnalysesRef = collection(db, 'users', userId, 'resumeAnalyses');
    
    const recordToSave = {
      userId,
      fileName: analysisData.fileName || 'resume.pdf',
      fileSize: analysisData.fileSize || 0,
      targetRole: analysisData.targetRole || 'Software Engineer',
      atsScore: analysisData.atsScore || 0,
      skills: analysisData.skills || { technical: [], tools: [], soft: [] },
      experience: analysisData.experience || { relevantExperience: [], strengths: [], weaknesses: [], improvements: [] },
      keywords: analysisData.keywords || { matched: [], missing: [] },
      recommendations: analysisData.recommendations || [],
      priorityImprovements: analysisData.priorityImprovements || [],
      createdAt: serverTimestamp(),
      createdAtIso: new Date().toISOString()
    };

    const docRef = await addDoc(userAnalysesRef, recordToSave);
    return { id: docRef.id, ...recordToSave };
  } catch (error) {
    console.error('Error saving resume analysis to Firestore:', error);
    // LocalStorage fallback if offline or Firestore rule denies write
    const localKey = `ai_coach_resume_analyses_${userId}`;
    const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
    const fallbackId = 'local_' + Date.now();
    const fallbackRecord = {
      id: fallbackId,
      userId,
      fileName: analysisData.fileName || 'resume.pdf',
      fileSize: analysisData.fileSize || 0,
      targetRole: analysisData.targetRole || 'Software Engineer',
      atsScore: analysisData.atsScore || 0,
      skills: analysisData.skills || { technical: [], tools: [], soft: [] },
      experience: analysisData.experience || { relevantExperience: [], strengths: [], weaknesses: [], improvements: [] },
      keywords: analysisData.keywords || { matched: [], missing: [] },
      recommendations: analysisData.recommendations || [],
      priorityImprovements: analysisData.priorityImprovements || [],
      createdAtIso: new Date().toISOString()
    };
    existing.unshift(fallbackRecord);
    localStorage.setItem(localKey, JSON.stringify(existing));
    return fallbackRecord;
  }
}

/**
 * Fetches analysis history for a given user ordered by createdAt descending
 */
export async function getUserResumeAnalyses(userId) {
  if (!userId) return [];

  try {
    const userAnalysesRef = collection(db, 'users', userId, 'resumeAnalyses');
    const q = query(userAnalysesRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const results = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      results.push({
        id: docSnap.id,
        ...data,
        // Convert serverTimestamp if present to readable date
        formattedDate: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }) : (data.createdAtIso ? new Date(data.createdAtIso).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }) : 'Recently')
      });
    });

    if (results.length > 0) return results;
  } catch (error) {
    console.warn('Firestore fetch analyses failed, checking LocalStorage fallback:', error.message);
  }

  // Fallback read from LocalStorage
  const localKey = `ai_coach_resume_analyses_${userId}`;
  const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
  return existing.map(item => ({
    ...item,
    formattedDate: item.createdAtIso ? new Date(item.createdAtIso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) : 'Recently'
  }));
}

/**
 * Deletes a specific resume analysis record from Firestore / LocalStorage
 */
export async function deleteResumeAnalysis(userId, analysisId) {
  if (!userId || !analysisId) return;

  if (!analysisId.startsWith('local_')) {
    try {
      const docRef = doc(db, 'users', userId, 'resumeAnalyses', analysisId);
      await deleteDoc(docRef);
    } catch (error) {
      console.warn('Firestore delete failed:', error.message);
    }
  }

  // Also clean up LocalStorage fallback
  const localKey = `ai_coach_resume_analyses_${userId}`;
  const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
  const filtered = existing.filter(item => item.id !== analysisId);
  localStorage.setItem(localKey, JSON.stringify(filtered));
}
