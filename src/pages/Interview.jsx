import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Interview() {
  const { userProfile, updateUserStats } = useAuth();
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

  const currentQuestionsList = questionsPool[jobRole] || questionsPool['Software Engineer'];

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

  const startInterview = () => {
    setAnswers([]);
    setCurrentQuestionIndex(0);
    setCurrentAnswerText('');
    setStep('active');
  };

  const handleNextQuestion = () => {
    // Record current answer
    const updatedAnswers = [...answers, {
      question: currentQuestionsList[currentQuestionIndex],
      answer: currentAnswerText.trim() || "(No answer provided)"
    }];
    setAnswers(updatedAnswers);
    setCurrentAnswerText('');

    if (currentQuestionIndex < currentQuestionsList.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Last question completed, process feedback
      generateEvaluationReport(updatedAnswers);
    }
  };

  const generateEvaluationReport = (finalAnswers) => {
    setStep('feedback');
    setLoadingFeedback(true);

    // Simulate AI feedback generation
    setTimeout(() => {
      let cumulativeScore = 0;
      const feedbackReports = finalAnswers.map((ans, index) => {
        const ansLength = ans.answer.length;
        let score = 30; // base score
        let reviews = [];
        let missingKeywords = [];
        let modelAnswer = "";

        // Give simulated score based on word length & keywords
        if (ans.answer.includes("process") || ans.answer.includes("DOM") || ans.answer.includes("index") || ans.answer.includes("data") || ans.answer.includes("roadmap")) {
          score += 25;
        }
        if (ansLength > 100) {
          score += 25;
          reviews.push("Good descriptive answer structure. You clearly explained definitions.");
        } else {
          score += 5;
          reviews.push("Response is too brief. Try to structure technical answers with Definitions, Use Cases, and Examples.");
        }
        
        if (ansLength < 40) {
          reviews.push("Missing core details. Answer should ideally outline technical tradeoffs.");
        }

        // Add role-specific details
        if (jobRole === 'Software Engineer') {
          if (index === 0) {
            missingKeywords = ['memory allocation', 'context switching', 'CPU core scheduling'];
            modelAnswer = "A process represents a program in execution containing its own address space, memory, and resources. A thread is the smallest unit of execution inside a process, sharing the parent process's memory space. Choose processes for independent tasks that require memory isolation (e.g., separate web server handlers) and threads for resource-sharing tasks where context switching overhead must be minimal.";
          } else if (index === 1) {
            missingKeywords = ['chaining', 'open addressing', 'load factor'];
            modelAnswer = "Collisions occur when two keys hash to the same table index. They are resolved via: (1) Chaining (Linked Lists): elements are stored in a list at that index. (2) Open Addressing (Linear/Quadratic Probing or Double Hashing): searching for the next empty slot. Chaining is generally preferred for simple implementation and robustness against high load factors.";
          } else {
            missingKeywords = ['search complexity', 'AVL trees', 'rotations'];
            modelAnswer = "A Binary Tree is a tree where each node has at most two children. A Binary Search Tree (BST) enforces the ordering property: left children are smaller than the node, right children are larger. BST search speed is O(log N) average, but degrades to O(N) linear time if unbalanced (skewed). Balancing via rotations (like in AVL or Red-Black trees) is needed to maintain O(log N) complexity.";
          }
        } else {
          missingKeywords = ['industry standards', 'performance trade-offs', 'architectural patterns'];
          modelAnswer = "An ideal response should structure the concept, reference practical applications from your projects, highlight system bottlenecks, and explain how you resolved similar latency or concurrency challenges in deployment.";
        }

        const finalAnsScore = Math.min(100, score + Math.floor(Math.random() * 20));
        cumulativeScore += finalAnsScore;

        return {
          ...ans,
          score: finalAnsScore,
          reviews,
          missingKeywords,
          modelAnswer
        };
      });

      const averageScore = Math.round(cumulativeScore / finalAnswers.length);
      
      setEvaluation({
        overallScore: averageScore,
        reports: feedbackReports
      });
      setLoadingFeedback(false);

      // Save statistics to Global state
      const currentCompleted = userProfile?.interviewStats?.completedCount || 0;
      updateUserStats({
        interviewStats: {
          score: averageScore,
          completedCount: currentCompleted + 1,
          lastPracticed: new Date().toISOString()
        }
      });
    }, 2500);
  };

  return (
    <div className="main-content animate-slide-up" style={{ padding: '20px 0' }}>
      
      {/* Page Title */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
          <span className="text-gradient-cyan-blue">MOCK INTERVIEW</span> ROOM
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', fontWeight: '500' }}>
          Simulate a real coding or systems placement panel. Speak or write your answers and get assessed immediately.
        </p>
      </div>

      {step === 'setup' && (
        /* Setup Phase View */
        <div className="glass-panel" style={{ padding: '40px', background: '#FFFFFF', maxWidth: '650px', margin: '0 auto' }}>
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
          {/* Progress Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
            <span className="badge badge-purple" style={{ textTransform: 'uppercase' }}>
              Question {currentQuestionIndex + 1} of {currentQuestionsList.length}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>
              Domain: {jobRole} ({difficulty})
            </span>
          </div>

          {/* Question Text */}
          <div className="glass-card" style={{ marginBottom: '24px', borderLeft: '4px solid var(--accent-cyan)', background: 'rgba(138, 112, 214, 0.02)', boxShadow: 'none' }}>
            <p style={{ fontSize: '15.5px', fontWeight: '600', color: 'var(--text-primary)', lineHeight: '1.6' }}>
              {currentQuestionsList[currentQuestionIndex]}
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
              <span>{currentQuestionIndex === currentQuestionsList.length - 1 ? 'Analyze & Complete' : 'Next Question'}</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="14" height="14">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
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
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>Evaluating Placement Competency</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>
                Analyzing structure depth, semantic keyword integration, and sample response alignment...
              </p>
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
                  {evaluation?.overallScore}<span style={{ fontSize: '20px', color: 'var(--text-muted)' }}>/100</span>
                </div>
                <div style={{ marginTop: '12px', marginBottom: '16px' }}>
                  <span className="badge badge-purple" style={{ fontSize: '11px' }}>
                    {evaluation?.overallScore >= 80 ? 'Hirable - Excellent' : evaluation?.overallScore >= 60 ? 'Hirable - Standard' : 'Requires Preparation'}
                  </span>
                </div>
                <button onClick={() => setStep('setup')} className="btn btn-secondary" style={{ padding: '10px 24px' }}>
                  Start Another Session
                </button>
              </div>

              {/* Breakdown List */}
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '16px', letterSpacing: '0.5px' }}>
                  INDIVIDUAL QUESTION FEEDBACK
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {evaluation?.reports.map((report, index) => (
                    <div key={index} className="glass-panel" style={{ padding: '24px', background: '#FFFFFF' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-cyan)' }}>
                          Question {index + 1}
                        </span>
                        <span className="badge badge-cyan" style={{ fontSize: '11px' }}>
                          Rating: {report.score}%
                        </span>
                      </div>
                      
                      <p style={{ fontSize: '14.5px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px' }}>
                        {report.question}
                      </p>

                      <div style={{ marginBottom: '18px' }}>
                        <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '4px', letterSpacing: '0.5px' }}>YOUR RESPONSE</p>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'rgba(138, 112, 214, 0.01)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(138, 112, 214, 0.06)' }}>
                          {report.answer}
                        </p>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', marginBottom: '18px' }}>
                        <div>
                          <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px', letterSpacing: '0.5px' }}>AI ASSESSMENT NOTES</p>
                          <ul style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {report.reviews.map((rev, rIdx) => (
                              <li key={rIdx} style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{rev}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px', letterSpacing: '0.5px' }}>RECOMMENDED TOPIC GAPS</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {report.missingKeywords.map((kw, kIdx) => (
                              <span key={kIdx} className="badge badge-amber" style={{ fontSize: '9px', padding: '1px 6px' }}>{kw}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div style={{ background: 'rgba(138, 112, 214, 0.03)', border: '1px solid rgba(138, 112, 214, 0.08)', padding: '14px', borderRadius: '8px' }}>
                        <p style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: '700', marginBottom: '6px', letterSpacing: '0.5px' }}>MODEL OPTIMAL ANSWER SUGGESTION</p>
                        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                          {report.modelAnswer}
                        </p>
                      </div>
                    </div>
                  ))}
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
  );
}
