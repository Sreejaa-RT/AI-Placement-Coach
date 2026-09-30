import { evaluateInterviewResponsesWithAI } from '../server/aiAnalyzer.js';

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
    const { role, questions, answers } = req.body || {};
    const keyConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
    console.log(`[Vercel Serverless API] Evaluating responses for role: ${role || 'Software Engineer'}`);
    console.log(`[Vercel Serverless API] Payload counts - questions: ${questions?.length || 0}, answers: ${answers?.length || 0}`);
    console.log(`[Vercel Serverless API] GEMINI_API_KEY configured: ${keyConfigured}`);

    const result = await evaluateInterviewResponsesWithAI({ role, questions, answers });
    return res.status(200).json(result);
  } catch (err) {
    console.error('[Vercel Serverless API] Answer evaluation failed:', err.message);
    if (err.stack) console.error('[Vercel Serverless API] Error stack trace:', err.stack);
    return res.status(500).json({
      error: `AI Answer Evaluation failed: ${err.message || 'Unknown server error'}`
    });
  }
}
