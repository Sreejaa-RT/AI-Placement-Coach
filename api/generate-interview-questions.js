import { generateInterviewQuestionsWithAI } from '../server/aiAnalyzer.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { role, difficulty, resumeData, weakTopics } = req.body || {};
    console.log(`[Vercel Serverless API] Generating questions for role: ${role || 'Software Engineer'}`);

    const result = await generateInterviewQuestionsWithAI({ role, difficulty, resumeData, weakTopics });
    return res.status(200).json(result);
  } catch (err) {
    console.error('[Vercel Serverless API] Question generation failed:', err.message);
    return res.status(500).json({
      error: `AI Question Generation failed: ${err.message || 'Unknown server error'}`
    });
  }
}
