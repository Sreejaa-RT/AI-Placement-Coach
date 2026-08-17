import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { 
  analyzeResumeWithAI, 
  generateInterviewQuestionsWithAI, 
  evaluateInterviewResponsesWithAI 
} from './server/aiAnalyzer.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Resume analysis endpoint
app.post('/api/analyze-resume', async (req, res) => {
  const { resumeText, targetRole, fileName } = req.body;
  console.log(`[AI Express Server] Received analysis request for ${fileName || 'document'} (${targetRole})`);

  const result = await analyzeResumeWithAI({ resumeText, targetRole, fileName });

  if (!result.success) {
    return res.status(result.statusCode || 500).json({
      success: false,
      error: result.error
    });
  }

  return res.json(result.data);
});

// AI Interview questions generation endpoint
app.post('/api/generate-interview-questions', async (req, res) => {
  const { role, difficulty, resumeData, weakTopics } = req.body;
  console.log(`[AI Express Server] Generating questions for role: ${role || 'Software Engineer'} (${difficulty || 'Entry Level'})`);
  
  try {
    const result = await generateInterviewQuestionsWithAI({ role, difficulty, resumeData, weakTopics });
    return res.json(result);
  } catch (err) {
    console.error('[AI Express Server] Question generation failed:', err.message);
    return res.status(500).json({
      error: `AI Question Generation failed: ${err.message || 'Unknown server error'}`
    });
  }
});

// AI Interview answer evaluation endpoint
app.post('/api/evaluate-interview-responses', async (req, res) => {
  const { role, questions, answers } = req.body;
  console.log(`[AI Express Server] Evaluating responses for role: ${role || 'Software Engineer'}`);

  try {
    const result = await evaluateInterviewResponsesWithAI({ role, questions, answers });
    return res.json(result);
  } catch (err) {
    console.error('[AI Express Server] Answer evaluation failed:', err.message);
    return res.status(500).json({
      error: `AI Answer Evaluation failed: ${err.message || 'Unknown server error'}`
    });
  }
});

app.listen(PORT, () => {
  console.log(`AI Placement Coach Express Server running on http://localhost:${PORT}`);
});
