import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import PageHero from '../components/PageHero';
import { getUserResumeAnalyses } from '../services/resumeService';

export default function Interview() {
  const { currentUser, userProfile, updateUserStats } = useAuth();
  const [step, setStep] = useState('setup'); // 'setup' | 'active' | 'feedback'
  const [jobRole, setJobRole] = useState('Software Engineer');
  const [difficulty, setDifficulty] = useState('Entry Level');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [currentAnswerText, setCurrentAnswerText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const roles = ['Software Engineer', 'Frontend Developer', 'Backend Developer', 'Data Analyst', 'Product Manager'];
  
  // Set up interview questions pool
  const questionsPool = {
    'Software Engineer': [
      "Explain the difference between a process and a thread. When would you prefer one over the other?",
      "How does a Hash Map resolve collisions internally? Explain at least two strategies.",
      "What is the difference between a binary tree and a binary search tree? When do we need balancing?"
    ],
    'Frontend Developer': [
      "What is the difference between Virtual DOM and real DOM? How does React's reconciliation work?",
      "Explain the event loop in JavaScript. What is the difference between microtasks and macrotasks?",
      "How do you optimize a React application's performance? Detail at least three strategies."
    ],
    'Backend Developer': [
      "What are database indexes, and how do they speed up database queries? What are the drawbacks?",
      "Explain the difference between SQL and NoSQL databases. When would you choose MongoDB over PostgreSQL?",
      "How do you handle authentication and authorization in a RESTful API? Discuss JWTs vs Sessions."
    ],
    'Data Analyst': [
      "What is the difference between data cleaning and data wrangling? Why are they important?",
      "Explain SQL JOINs. What is the difference between a Left Join and an Inner Join?",
      "What is A/B testing? How do you determine if the test results are statistically significant?"
    ],
    'Product Manager': [
      "How do you prioritize features for a product roadmap when resources are constrained?",
      "Describe a product you use daily that is poorly designed. What would you do to improve it?",
      "How do you measure the success of a newly launched feature? What metrics would you track?"
    ]
  };

  // Initialize Speech Recognition (Web Speech API)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = true;
      recog.interimResults = false;
      recog.lang = 'en-US';

      recog.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        setCurrentAnswerText((prev) => prev + (prev ? ' ' : '') + transcript);
      };

      recog.onerror = (e) => {
        console.error('Speech recognition error:', e);
        setIsRecording(false);
      };

      recog.onend = () => {
        setIsRecording(false);
      };

      setRecognition(recog);
    }
  }, []);

  const toggleRecording = () => {
    if (!recognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome, Edge or Safari.");
      return;
    }

    if (isRecording) {
      recognition.stop();
    } else {
      setIsRecording(true);
      recognition.start();
    }
  };

  const startInterview = async () => {
    setAnswers([]);
    setCurrentQuestionIndex(0);
    setCurrentAnswerText('');
    setQuestions([]);
    setErrorMessage('');
    setLoadingQuestions(true);
    setStep('active');

    let resumeData = null;
    let weakTopics = [];

    // 1. Fetch latest resume analysis if user is authenticated
    if (currentUser?.uid) {
      try {
        const analyses = await getUserResumeAnalyses(currentUser.uid);
        if (analyses && analyses.length > 0) {
          resumeData = analyses[0];
        }
      } catch (err) {
        console.warn("[Interview Setup] Failed to load resume analysis:", err);
      }

      // 2. Fetch assessment performance if available
      try {
        const response = await fetch(`/api/v1/assessment/performance?user_id=${currentUser.uid}`);
        if (response.ok) {
          const perfData = await response.json();
          if (perfData && Array.isArray(perfData.weakest_topics)) {
            weakTopics = perfData.weakest_topics;
          }
        }
      } catch (err) {
        console.warn("[Interview Setup] Failed to load assessment performance:", err);
      }
    }

    // 3. Query the backend generator endpoint
    try {
      const response = await fetch('/api/generate-interview-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: jobRole,
          difficulty,
          resumeData: resumeData ? {
            skills: resumeData.skills,
            experience: resumeData.experience,
            keywords: resumeData.keywords
          } : null,
          weakTopics
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.questions) && data.questions.length === 3) {
          setQuestions(data.questions);
          setLoadingQuestions(false);
          return;
        }
      }
      throw new Error("Invalid response schema from backend API.");
    } catch (err) {
      console.warn("[Interview Setup] AI generator query failed, falling back to static questions:", err);
      const staticList = questionsPool[jobRole] || questionsPool['Software Engineer'];
      const mapped = staticList.map((q, idx) => ({
        id: `q${idx + 1}`,
        question: q,
        type: idx === 0 ? "project" : idx === 1 ? "technical" : "behavioral",
        topic: idx === 0 ? "Projects" : idx === 1 ? "Concepts" : "Behavioral"
      }));
      setQuestions(mapped);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleNextQuestion = () => {
    const updatedAnswers = [...answers, {
      question: questions[currentQuestionIndex]?.question || "",
      answer: currentAnswerText.trim() || "(No answer provided)"
    }];
    setAnswers(updatedAnswers);
    setCurrentAnswerText('');

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      generateEvaluationReport(updatedAnswers);
    }
  };

  const generateEvaluationReport = async (finalAnswers) => {
    setStep('feedback');
    setLoadingFeedback(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/evaluate-interview-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: jobRole,
          questions,
          answers: finalAnswers
        })
      });

      if (response.ok) {
        const evalData = await response.json();
        setEvaluation(evalData);
        setLoadingFeedback(false);

        // Save real AI score to Firebase profile
        const currentCompleted = userProfile?.interviewStats?.completedCount || 0;
        updateUserStats({
          interviewStats: {
            score: evalData.overall_score,
            completedCount: currentCompleted + 1,
            lastPracticed: new Date().toISOString()
          }
        });
        return;
      }
      throw new Error("Evaluation response not OK");
    } catch (err) {
      console.error("[Interview Evaluation] API error:", err);
      setErrorMessage("AI interview evaluation is temporarily unavailable. Please try again.");
    } finally {
      setLoadingFeedback(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }} className="animate-slide-up">
      
      {/* Page Hero Banner */}
      <PageHero 
        badge="PRACTICE AI"
        title="Mock Interview"
        subtitle="Practice realistic interviews, improve your responses, and build confidence for your target role."
        supportingLine="Practice with purpose. Interview with confidence."
      />

      <div style={{ padding: '32px 40px 40px 40px', boxSizing: 'border-box', width: '100%' }}>

      {/* Removed old header - now using PageHero above */}

      {step === 'setup' && (
        /* Setup Phase View */
        <div className="glass-panel" style={{ padding: '40px', background: '#FFFFFF', maxWidth: '650px', margin: '0 auto' }}>
          {errorMessage && (
            <div style={{ background: '#FDF2F2', border: '1px solid #FDE8E8', color: '#9B1C1C', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13.5px', fontWeight: '500', textAlign: 'center' }}>
              ⚠️ {errorMessage}
            </div>
          )}
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '24px', textAlign: 'center' }}>
            Configure Interview Panel
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
            <div>
              <label className="glass-label">Select Job Domain</label>
              <select 
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                className="glass-input"
                style={{ background: '#FFFFFF' }}
              >
                {roles.map(role => (
                  <option key={role} value={role} style={{ background: '#FFFFFF' }}>{role}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="glass-label">Select Difficulty Level</label>
              <select 
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="glass-input"
                style={{ background: '#FFFFFF' }}
              >
                <option style={{ background: '#FFFFFF' }}>Entry Level</option>
                <option style={{ background: '#FFFFFF' }}>Mid Level</option>
                <option style={{ background: '#FFFFFF' }}>Senior Engineer</option>
              </select>
            </div>

            <div className="glass-card" style={{ padding: '16px', background: 'rgba(138, 112, 214, 0.02)', border: '1px dashed var(--border-glass)' }}>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                💡 **Voice Input Supported**: You can utilize your microphone to record your answers. Make sure your browser has granted microphone permissions.
              </p>
            </div>
          </div>

          <button onClick={startInterview} className="btn btn-primary" style={{ width: '100%', padding: '14px' }}>
            Launch Interview Session
          </button>
        </div>
      )}

      {step === 'active' && (
        /* Active Interview Workspace */
        <div className="glass-panel" style={{ padding: '32px', background: '#FFFFFF', maxWidth: '800px', margin: '0 auto' }}>
          {loadingQuestions ? (
            <div style={{ textAlign: 'center', padding: '60px 40px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(138, 112, 214, 0.1)',
                borderTop: '3px solid var(--accent-cyan)',
                borderRadius: '50%',
                margin: '0 auto 16px',
                animation: 'spin 1s linear infinite'
              }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600' }}>
                Formulating personalized interview questions based on your resume and performance...
              </p>
            </div>
          ) : (
            <>
              {/* Progress Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
                <span className="badge badge-purple" style={{ textTransform: 'uppercase' }}>
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>
                  Domain: {jobRole} ({difficulty})
                </span>
              </div>

              {/* Question Text */}
              <div className="glass-card" style={{ marginBottom: '24px', borderLeft: '4px solid var(--accent-cyan)', background: 'rgba(138, 112, 214, 0.02)', boxShadow: 'none' }}>
                <div style={{ fontSize: '11px', color: 'var(--accent-purple)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Question Type: {questions[currentQuestionIndex]?.type || 'general'}
                </div>
                <p style={{ fontSize: '15.5px', fontWeight: '600', color: 'var(--text-primary)', lineHeight: '1.6' }}>
                  {questions[currentQuestionIndex]?.question}
                </p>
              </div>

              {/* User Answer Text Area */}
              <div style={{ marginBottom: '24px', position: 'relative' }}>
                <label className="glass-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Your Response</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {currentAnswerText.length} characters
                  </span>
                </label>
                <textarea
                  value={currentAnswerText}
                  onChange={(e) => setCurrentAnswerText(e.target.value)}
                  placeholder="Structure your answer clearly. Discuss definitions, syntax, database behaviors, or logical paradigms..."
                  className="glass-input"
                  style={{ minHeight: '200px', resize: 'vertical', paddingBottom: '45px' }}
                />
                
                {/* Speech to Text Microphone Floating Trigger */}
                <button
                  type="button"
                  onClick={toggleRecording}
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '12px',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: isRecording ? 'var(--accent-pink)' : 'rgba(138, 112, 214, 0.04)',
                    border: '1px solid',
                    borderColor: isRecording ? 'transparent' : 'rgba(138, 112, 214, 0.12)',
                    color: isRecording ? '#FFFFFF' : 'var(--accent-cyan)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: isRecording ? '0 4px 10px rgba(229, 140, 163, 0.3)' : 'none',
                    transition: 'all var(--transition-fast)'
                  }}
                  title={isRecording ? "Stop dictation" : "Start voice dictation"}
                >
                  {isRecording ? (
                    <span style={{ width: '10px', height: '10px', background: '#fff', borderRadius: '2px' }} />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="18" height="18">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Action Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {isRecording && (
                  <span style={{ fontSize: '12.5px', color: 'var(--accent-pink)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-pink)', display: 'inline-block', animation: 'blink 1s infinite' }} />
                    AI is listening to your answer...
                  </span>
                )}
                
                <button 
                  onClick={handleNextQuestion}
                  className="btn btn-primary"
                  style={{ padding: '12px 28px', marginLeft: 'auto' }}
                >
                  <span>{currentQuestionIndex === questions.length - 1 ? 'Analyze & Complete' : 'Next Question'}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="14" height="14">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {step === 'feedback' && (
        /* Evaluation Feedback Report Phase */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {loadingFeedback ? (
            /* Loading Spinner */
            <div className="glass-panel" style={{ padding: '60px 40px', background: '#FFFFFF', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
              <div style={{
                width: '60px',
                height: '60px',
                border: '4px solid rgba(138, 112, 214, 0.1)',
                borderTop: '4px solid var(--accent-purple)',
                borderRadius: '50%',
                margin: '0 auto 24px',
                animation: 'spin 1.2s linear infinite'
              }} />
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>Evaluating PREP AI Competency</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>
                Analyzing structure depth, semantic keyword integration, and sample response alignment...
              </p>
            </div>
          ) : errorMessage ? (
            /* Error display view */
            <div className="glass-panel" style={{ padding: '40px', background: '#FFFFFF', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
              <span style={{ fontSize: '32px' }}>⚠️</span>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '12px', marginBottom: '8px' }}>Evaluation Error</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>{errorMessage}</p>
              <button onClick={() => setStep('setup')} className="btn btn-primary" style={{ padding: '10px 24px' }}>
                Return to Setup
              </button>
            </div>
          ) : (
            /* Detailed Report Dashboard */
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* Overall Placement Rating Indicator */}
              <div className="glass-panel" style={{ padding: '32px', background: '#FFFFFF', textAlign: 'center', maxWidth: '500px', margin: '0 auto', width: '100%' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '1px', marginBottom: '16px' }}>
                  OVERALL INTERVIEW EVALUATION
                </p>
                <div style={{ fontSize: '56px', fontWeight: '800', color: 'var(--accent-purple)', lineHeight: 1 }}>
                  {evaluation?.overall_score}<span style={{ fontSize: '20px', color: 'var(--text-muted)' }}>/100</span>
                </div>

                {/* Score breakdown metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', margin: '20px 0', borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Technical</span>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>{evaluation?.technical_score}%</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Communication</span>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>{evaluation?.communication_score}%</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Relevance</span>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>{evaluation?.relevance_score}%</div>
                  </div>
                </div>

                <div style={{ marginTop: '12px', marginBottom: '16px' }}>
                  <span className="badge badge-purple" style={{ fontSize: '11px' }}>
                    {evaluation?.overall_score >= 80 ? 'Hirable - Excellent' : evaluation?.overall_score >= 60 ? 'Hirable - Standard' : 'Requires Preparation'}
                  </span>
                </div>

                {evaluation?.overall_feedback && (
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', background: '#F8FAFC', padding: '12px', borderRadius: '8px', marginBottom: '16px', textAlign: 'left' }}>
                    <strong>AI Panel Summary:</strong> {evaluation.overall_feedback}
                  </p>
                )}

                {evaluation?.recommended_topics && evaluation.recommended_topics.length > 0 && (
                  <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase' }}>RECOMMENDED STUDY TOPICS</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                      {evaluation.recommended_topics.map((t, idx) => (
                        <span key={idx} className="badge badge-amber" style={{ fontSize: '10px' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={() => setStep('setup')} className="btn btn-secondary" style={{ padding: '10px 24px', width: '100%' }}>
                  Start Another Session
                </button>
              </div>

              {/* Breakdown List */}
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '16px', letterSpacing: '0.5px' }}>
                  INDIVIDUAL QUESTION FEEDBACK
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {evaluation?.results?.map((res, index) => {
                    const qObj = questions[index] || {};
                    const ansObj = answers[index] || {};
                    return (
                      <div key={index} className="glass-panel" style={{ padding: '24px', background: '#FFFFFF' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                            Question {index + 1} ({qObj.type || 'technical'})
                          </span>
                          <span className="badge badge-cyan" style={{ fontSize: '11px' }}>
                            Rating: {res.score}%
                          </span>
                        </div>
                        
                        <p style={{ fontSize: '14.5px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px' }}>
                          {qObj.question}
                        </p>

                        <div style={{ marginBottom: '18px' }}>
                          <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '4px', letterSpacing: '0.5px' }}>YOUR RESPONSE</p>
                          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'rgba(138, 112, 214, 0.01)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(138, 112, 214, 0.06)' }}>
                            {ansObj.answer}
                          </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', marginBottom: '18px' }}>
                          <div>
                            <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px', letterSpacing: '0.5px' }}>AI ASSESSMENT NOTES</p>
                            <ul style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {res.strengths?.map((str, sIdx) => (
                                <li key={sIdx} style={{ fontSize: '12.5px', color: 'green', fontWeight: '500', lineHeight: '1.4' }}>✓ {str}</li>
                              ))}
                              <li style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.4', marginTop: '4px' }}>
                                <strong>Feedback:</strong> {res.feedback}
                              </li>
                            </ul>
                          </div>
                          <div>
                            <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px', letterSpacing: '0.5px' }}>MISSING/WEAK POINTS</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {res.missing_points?.map((mp, mIdx) => (
                                <span key={mIdx} className="badge badge-amber" style={{ fontSize: '9px', padding: '2px 6px' }}>{mp}</span>
                              ))}
                              {(!res.missing_points || res.missing_points.length === 0) && (
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>None matched.</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div style={{ background: 'rgba(138, 112, 214, 0.03)', border: '1px solid rgba(138, 112, 214, 0.08)', padding: '14px', borderRadius: '8px' }}>
                          <p style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: '700', marginBottom: '6px', letterSpacing: '0.5px' }}>MODEL OPTIMAL ANSWER SUGGESTION</p>
                          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                            {res.model_answer}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* Embedded Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes blink {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}} />

      </div>
    </div>
  );
}
