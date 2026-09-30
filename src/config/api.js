/**
 * Centralized API Configuration for AI Placement Coach
 * Resolves production backend URLs from environment variables (e.g. Vercel)
 * and falls back to empty strings for local Vite proxy development.
 */

const getMlApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_ML_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim();
  }
  return 'https://ai-placement-ml.onrender.com';
};

const getNodeApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_NODE_API_URL || import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim();
  }
  return '';
};

export const ML_API_BASE_URL = getMlApiBaseUrl().replace(/\/+$/, '');
export const NODE_API_BASE_URL = getNodeApiBaseUrl().replace(/\/+$/, '');

export const API_ENDPOINTS = {
  // Python FastAPI ML Endpoints
  mlHealth: `${ML_API_BASE_URL}/health`,
  resumeAudit: `${ML_API_BASE_URL}/api/v1/resume/audit`,
  
  // Assessment Center Endpoints (FastAPI)
  assessmentPerformance: (userId, attemptsJson = null) => {
    let url = `${ML_API_BASE_URL}/api/v1/assessment/performance`;
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId);
    if (attemptsJson) params.append('attempts_json', attemptsJson);
    const qs = params.toString();
    return qs ? `${url}?${qs}` : url;
  },

  assessmentQuestions: (category, topic, difficulty, limit = 10, userId = null, attemptsJson = null) => {
    let url = `${ML_API_BASE_URL}/api/v1/assessment/questions`;
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (topic) params.append('topic', topic);
    if (difficulty) params.append('difficulty', difficulty);
    if (limit) params.append('limit', limit.toString());
    if (userId) params.append('user_id', userId);
    if (attemptsJson) params.append('attempts_json', attemptsJson);
    const qs = params.toString();
    return qs ? `${url}?${qs}` : url;
  },

  assessmentAttempt: `${ML_API_BASE_URL}/api/v1/assessment/attempt`,

  // Node.js / Express Gemini Endpoints
  nodeHealth: `${NODE_API_BASE_URL}/api/health`,
  analyzeResumeAI: `${NODE_API_BASE_URL}/api/analyze-resume`,
  generateInterviewQuestions: `${NODE_API_BASE_URL}/api/generate-interview-questions`,
  evaluateInterviewResponses: `${NODE_API_BASE_URL}/api/evaluate-interview-responses`,
};
