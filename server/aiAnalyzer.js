import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

// Helper to resolve GEMINI_API_KEY from process.env or .env file explicitly
function resolveGeminiApiKey() {
  // Check process.env first
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
    return process.env.GEMINI_API_KEY.trim();
  }
  if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY.trim()) {
    return process.env.GOOGLE_API_KEY.trim();
  }

  // Fallback: Read directly from .env at project root
  const rootEnvPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(rootEnvPath)) {
    try {
      const content = fs.readFileSync(rootEnvPath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('GEMINI_API_KEY=') || trimmed.startsWith('GOOGLE_API_KEY=')) {
          let val = trimmed.split('=').slice(1).join('=').trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1).trim();
          }
          if (val) return val;
        }
      }
    } catch (e) {
      console.warn('[AI Analyzer] Warning reading .env directly:', e.message);
    }
  }

  return '';
}

// Robustly extract the first complete JSON object from a string
function extractJSON(str) {
  if (!str) return null;
  const firstOpen = str.indexOf('{');
  if (firstOpen === -1) return null;
  
  let lastClose = str.lastIndexOf('}');
  while (lastClose > firstOpen) {
    const candidate = str.slice(firstOpen, lastClose + 1);
    try {
      return JSON.parse(candidate);
    } catch (e) {
      lastClose = str.lastIndexOf('}', lastClose - 1);
    }
  }
  return null;
}

dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });

/**
 * Analyzes resume text against target role using real AI (Google Gemini API)
 */
export async function analyzeResumeWithAI({ resumeText, targetRole, fileName }) {
  if (!resumeText || !resumeText.trim()) {
    return {
      success: false,
      statusCode: 400,
      error: 'Resume text is required for analysis.'
    };
  }

  const role = targetRole || 'Software Engineer';
  console.log(`[AI Analyzer] Analyzing document: ${fileName || 'unnamed'} for target role: ${role}`);

  const apiKey = resolveGeminiApiKey();
  const isConfigured = Boolean(apiKey && apiKey.trim());
  console.log(`[AI Server Diagnostic] GEMINI_API_KEY configured: ${isConfigured}`);

  if (!isConfigured) {
    return {
      success: false,
      statusCode: 400,
      error: 'Backend GEMINI_API_KEY environment variable is not configured. Please add your GEMINI_API_KEY to the .env file in your project root.'
    };
  }

  const prompt = `You are a senior ATS (Applicant Tracking System) reviewer and technical recruiter.
Analyze the candidate's resume text specifically for the target job role: "${role}".

Resume Text:
---
${resumeText}
---

Return ONLY a valid, strict JSON object (no extra commentary, no wrapping markdown code blocks if possible).

JSON Schema required:
{
  "targetRole": "${role}",
  "atsScore": <integer 0-100 calculating ATS compatibility, keyword coverage, technical depth, and experience clarity>,
  "skills": {
    "technical": [<array of extracted technical programming languages, frameworks, databases>],
    "tools": [<array of developer tools, platforms, cloud services, tools>],
    "soft": [<array of soft skills, domain competencies>]
  },
  "experience": {
    "relevantExperience": [<array of key relevant work/internship/project experiences identified>],
    "strengths": [<array of strong experience highlights>],
    "weaknesses": [<array of weak or underspecified experience points>],
    "improvements": [
      {
        "original": "<weak statement from resume>",
        "improved": "<quantified, impact-driven action verb replacement statement>"
      }
    ]
  },
  "keywords": {
    "matched": [<array of role-relevant skills/keywords found in resume for ${role}>],
    "missing": [<array of critical missing skills/keywords required for ${role}>]
  },
  "recommendations": [<array of specific actionable advice to optimize resume layout and technical relevance>],
  "priorityImprovements": [<array of top 3 urgent changes to make immediately>]
}`;

  let rawText = '';

  try {
    // Primary: Try Google Gen AI SDK
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });
      rawText = response.text || '';
    } catch (sdkError) {
      console.warn('[AI Analyzer] GenAI SDK failed, attempting direct Gemini REST API fallback:', sdkError.message);
      
      // Fallback: Direct Gemini REST API fetch
      const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
      const restRes = await fetch(restUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2
          }
        })
      });

      if (!restRes.ok) {
        const errBody = await restRes.json().catch(() => ({}));
        const msg = errBody?.error?.message || `HTTP ${restRes.status} from Gemini API`;
        return {
          success: false,
          statusCode: restRes.status,
          error: `Gemini AI API Error: ${msg}`
        };
      }

      const restData = await restRes.json();
      rawText = restData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    if (!rawText || !rawText.trim()) {
      return {
        success: false,
        statusCode: 500,
        error: 'Empty response received from AI model.'
      };
    }

    // Clean code fences if present
    let cleanedText = rawText.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleanedText);

    // Sanitize output fields
    const sanitized = {
      targetRole: parsed.targetRole || role,
      atsScore: Math.min(100, Math.max(0, parseInt(parsed.atsScore, 10) || 50)),
      skills: {
        technical: Array.isArray(parsed.skills?.technical) ? parsed.skills.technical : [],
        tools: Array.isArray(parsed.skills?.tools) ? parsed.skills.tools : [],
        soft: Array.isArray(parsed.skills?.soft) ? parsed.skills.soft : []
      },
      experience: {
        relevantExperience: Array.isArray(parsed.experience?.relevantExperience) ? parsed.experience.relevantExperience : [],
        strengths: Array.isArray(parsed.experience?.strengths) ? parsed.experience.strengths : [],
        weaknesses: Array.isArray(parsed.experience?.weaknesses) ? parsed.experience.weaknesses : [],
        improvements: Array.isArray(parsed.experience?.improvements) ? parsed.experience.improvements : []
      },
      keywords: {
        matched: Array.isArray(parsed.keywords?.matched) ? parsed.keywords.matched : [],
        missing: Array.isArray(parsed.keywords?.missing) ? parsed.keywords.missing : []
      },
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      priorityImprovements: Array.isArray(parsed.priorityImprovements) ? parsed.priorityImprovements : []
    };

    return {
      success: true,
      statusCode: 200,
      data: sanitized
    };

  } catch (err) {
    console.error('[AI Analyzer] Execution error:', err);
    return {
      success: false,
      statusCode: 500,
      error: `Failed to analyze resume with AI: ${err.message || 'Unknown processing error'}`
    };
  }
}

/**
 * Generates 3 personalized interview questions using Google Gemini API
 */
export async function generateInterviewQuestionsWithAI({ role, difficulty, resumeData, weakTopics }) {
  const targetRole = role || 'Software Engineer';
  const targetDiff = difficulty || 'Entry Level';
  const apiKey = resolveGeminiApiKey();
  const isConfigured = Boolean(apiKey && apiKey.trim());

  if (!isConfigured) {
    throw new Error('Backend GEMINI_API_KEY environment variable is not configured.');
  }

  const resumeSkills = resumeData?.skills?.technical || [];
  const resumeProjects = resumeData?.experience?.relevantExperience || [];
  const resumeTools = resumeData?.skills?.tools || [];
  const gaps = resumeData?.keywords?.missing || [];

  const prompt = `You are an expert technical interviewer. Create exactly 3 personalized, highly relevant interview questions for a candidate.
  
  Target Role: ${targetRole}
  Difficulty: ${targetDiff}
  Candidate Resume context:
  - Technical Skills: ${JSON.stringify(resumeSkills)}
  - Projects/Experience highlights: ${JSON.stringify(resumeProjects)}
  - Tools/Platforms: ${JSON.stringify(resumeTools)}
  - Missing skills/Keywords gaps: ${JSON.stringify(gaps)}
  
  Assessment performance weaknesses:
  - Weak assessment topics/sub-topics: ${JSON.stringify(weakTopics || [])}
  
  Generate exactly 3 questions:
  1. Question 1 MUST be a resume/project-based question that digs into their specific skills, tools, or projects.
  2. Question 2 MUST be a technical question specifically targeting one of their weak assessment topics (e.g. if Arrays or Trees is weak, ask about that). If no weak topics are listed, target a core computer science topic appropriate for ${targetRole}.
  3. Question 3 MUST be a role-specific technical or behavioral question matching the difficulty level: ${targetDiff}.
  
  Return ONLY a valid, strict JSON object conforming to this schema (do not wrap in markdown code blocks):
  {
    "questions": [
      {
        "id": "q1",
        "question": "<The question text>",
        "type": "project",
        "topic": "<The specific topic or project keyword targeted>"
      },
      {
        "id": "q2",
        "question": "<The question text>",
        "type": "technical",
        "topic": "<The specific weak assessment topic targeted>"
      },
      {
        "id": "q3",
        "question": "<The question text>",
        "type": "behavioral",
        "topic": "<Role-specific sub-domain or soft competency targeted>"
      }
    ]
  }`;

  let rawText = '';
  try {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7
        }
      });
      rawText = response.text || '';
    } catch (sdkError) {
      console.warn('[AI Interview Helper] SDK failed, attempting direct REST fallback:', sdkError.message);
      const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
      const restRes = await fetch(restUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.7
          }
        })
      });
      if (restRes.ok) {
        const restData = await restRes.json();
        rawText = restData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else {
        const errText = await restRes.text().catch(() => '');
        console.error(`[AI Interview Helper] REST API fallback failed with status ${restRes.status}:`, errText);
      }
    }

    if (!rawText || !rawText.trim()) {
      throw new Error('Empty or invalid response received from Gemini API.');
    }

    let cleanedText = rawText.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleanedText);
    if (parsed && Array.isArray(parsed.questions) && parsed.questions.length === 3) {
      return parsed;
    }
    throw new Error('Invalid JSON structure or incorrect question count.');

  } catch (err) {
    console.error('[AI Interview Questions Helper] Error:', err);
    return {
      questions: [
        {
          id: "q1",
          question: `Can you walk me through one of the technical projects listed on your resume, explaining your architectural choices and how you handled bottlenecks?`,
          type: "project",
          topic: "Projects"
        },
        {
          id: "q2",
          question: `Explain how you would analyze and optimize the runtime and space complexity of an algorithm. What does O(N log N) mean in practice?`,
          type: "technical",
          topic: "Complexity Analysis"
        },
        {
          id: "q3",
          question: `Describe a scenario where you had to debug a complex system issue under tight deadlines. How did you diagnose the problem and what was the outcome?`,
          type: "behavioral",
          topic: "Problem Solving"
        }
      ]
    };
  }
}

/**
 * Evaluates student interview answers using Google Gemini API
 */
export async function evaluateInterviewResponsesWithAI({ role, questions, answers }) {
  const targetRole = role || 'Software Engineer';
  const apiKey = resolveGeminiApiKey();
  const isConfigured = Boolean(apiKey && apiKey.trim());

  if (!isConfigured) {
    throw new Error('Backend GEMINI_API_KEY environment variable is not configured.');
  }

  const prompt = `You are a professional technical recruiter. Review the candidate's answers to the interview questions and provide scores and evaluations.
  
  Target Role: ${targetRole}
  
  Interview History:
  ${JSON.stringify(questions.map((q, idx) => ({
    question_id: q.id,
    question_text: q.question,
    type: q.type,
    topic: q.topic,
    candidate_answer: answers[idx]?.answer || '(No answer provided)'
  })))}
  
  Provide a detailed evaluation. Return ONLY a valid, strict JSON object matching the schema below.
  Do not include markdown blocks or wrapper elements.
  
  JSON Schema:
  {
    "overall_score": <overall average score out of 100>,
    "communication_score": <communication quality score out of 100>,
    "technical_score": <technical accuracy score out of 100>,
    "relevance_score": <answer relevance score out of 100>,
    "results": [
      {
        "question_id": "<must match question id, e.g. q1>",
        "score": <score out of 100>,
        "strengths": [<array of positive highlights in this response>],
        "missing_points": [<array of critical points, definitions, or parameters they missed>],
        "feedback": "<constructive feedback on their answer>",
        "model_answer": "<The comprehensive model answer outlining the best practice response>"
      }
    ],
    "overall_feedback": "<summary of overall strengths and weaknesses in their performance>",
    "recommended_topics": [<array of topics or categories they should study to improve based on their gaps>]
  }`;

  let rawText = '';
  try {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });
      rawText = response.text || '';
    } catch (sdkError) {
      console.warn('[AI Interview Evaluation] SDK failed, attempting direct REST fallback:', sdkError.message);
      const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
      const restRes = await fetch(restUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2
          }
        })
      });
      if (restRes.ok) {
        const restData = await restRes.json();
        rawText = restData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else {
        const errText = await restRes.text().catch(() => '');
        console.error(`[AI Interview Evaluation] REST API fallback failed with status ${restRes.status}:`, errText);
      }
    }

    if (!rawText || !rawText.trim()) {
      throw new Error('Empty or invalid response received from Gemini API.');
    }

    let cleanedText = rawText.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let parsed = null;
    try {
      parsed = JSON.parse(cleanedText);
    } catch (parseErr) {
      console.warn('[AI Interview Evaluation] Standard JSON.parse failed, attempting robust JSON extraction...', parseErr.message);
      parsed = extractJSON(rawText);
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Failed to extract a valid JSON object from Gemini response.');
    }

    const getField = (obj, snake, camel) => {
      if (obj && obj[snake] !== undefined) return obj[snake];
      if (obj && obj[camel] !== undefined) return obj[camel];
      return undefined;
    };

    const overallScoreVal = getField(parsed, 'overall_score', 'overallScore');
    const communicationScoreVal = getField(parsed, 'communication_score', 'communicationScore');
    const technicalScoreVal = getField(parsed, 'technical_score', 'technicalScore');
    const relevanceScoreVal = getField(parsed, 'relevance_score', 'relevanceScore');
    const resultsVal = getField(parsed, 'results', 'results');

    if (
      overallScoreVal === undefined ||
      communicationScoreVal === undefined ||
      technicalScoreVal === undefined ||
      relevanceScoreVal === undefined ||
      !Array.isArray(resultsVal)
    ) {
      throw new Error('Parsed response does not contain all required evaluation fields or correct structure.');
    }

    const sanitized = {
      overall_score: Math.min(100, Math.max(0, parseInt(overallScoreVal, 10) || 50)),
      communication_score: Math.min(100, Math.max(0, parseInt(communicationScoreVal, 10) || 50)),
      technical_score: Math.min(100, Math.max(0, parseInt(technicalScoreVal, 10) || 50)),
      relevance_score: Math.min(100, Math.max(0, parseInt(relevanceScoreVal, 10) || 50)),
      results: resultsVal.map((res, i) => {
        const questionIdVal = getField(res, 'question_id', 'questionId');
        const scoreVal = getField(res, 'score', 'score');
        const strengthsVal = getField(res, 'strengths', 'strengths');
        const missingPointsVal = getField(res, 'missing_points', 'missingPoints') || getField(res, 'gaps', 'gaps');
        const feedbackVal = getField(res, 'feedback', 'feedback');
        const modelAnswerVal = getField(res, 'model_answer', 'modelAnswer');

        return {
          question_id: questionIdVal || questions[i]?.id || `q${i + 1}`,
          score: Math.min(100, Math.max(0, parseInt(scoreVal, 10) || 50)),
          strengths: Array.isArray(strengthsVal) ? strengthsVal : [],
          missing_points: Array.isArray(missingPointsVal) ? missingPointsVal : [],
          feedback: feedbackVal || 'Answer reviewed.',
          model_answer: modelAnswerVal || 'No model answer provided.'
        };
      }),
      overall_feedback: getField(parsed, 'overall_feedback', 'overallFeedback') || 'Completed.',
      recommended_topics: getField(parsed, 'recommended_topics', 'recommendedTopics') || getField(parsed, 'study_topics', 'studyTopics') || []
    };

    return sanitized;

  } catch (err) {
    console.error('[AI Interview Evaluation Helper] Error:', err);
    throw err;
  }
}
