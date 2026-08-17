import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import PageHero from '../components/PageHero';

export default function Counselor() {
  const { userProfile, updateUserStats } = useAuth();
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hello! I am your AI Career Advisor. I can help you compile software development roadmaps, prepare for system design queries, or structure salary negotiation dialogues. Ask me anything below!",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    "What is a standard Backend Roadmap?",
    "How to handle salary negotiations?",
    "Prep checklist for campus drives?",
    "Top DBMS topics to review?"
  ];

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = (textToSend) => {
    if (!textToSend.trim()) return;

    const newMsg = {
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    setIsTyping(true);

    // Dynamic Mock responses based on keyword queries
    setTimeout(() => {
      let aiText = "That's an interesting question! To give you the best feedback, make sure to detail your target role, programming background, and current timeline. Let me know which sub-areas you'd like to dive into.";
      
      const query = textToSend.toLowerCase();
      
      if (query.includes("roadmap") || query.includes("backend")) {
        aiText = "Here is an industry-standard Backend Roadmap:\n1. **Language**: Master one of JavaScript/Node.js, Python, Java, or Go.\n2. **Databases**: Learn SQL (PostgreSQL/MySQL) and NoSQL (MongoDB/Redis).\n3. **APIs**: Understand RESTful conventions, JSON structures, and basic GraphQL.\n4. **Hosting/Deployment**: Learn git workflows, basic Docker containers, and Cloud platforms (AWS, GCP, or render.com).";
      } else if (query.includes("negotiate") || query.includes("negotiation") || query.includes("salary")) {
        aiText = "When negotiating placement offers, follow these rules:\n1. **Do not state a number first**: Let them make the starting offer, or ask for the budget scale.\n2. **Focus on market value**: Anchor your requests on local placement averages and competitive stats.\n3. **Use compound proposals**: Negotiate base salary, signing bonus, and remote days together rather than in isolation.\n4. **Be enthusiastic**: Express gratitude for the team fit before discussing compensation alterations.";
      } else if (query.includes("checklist") || query.includes("campus") || query.includes("drive")) {
        aiText = "Campus Placement Checklist (1-Month Out):\n- **Resume**: Audit structure and verify keywords compatibility in the ATS Analyzer.\n- **Data Structures**: Revise Trees, Graphs, Hash Maps, and Binary Search.\n- **Behavioral**: Draft three Star-method stories (Situation, Task, Action, Result) outlining team conflict, project bottlenecks, and achievements.\n- **DBMS & OS**: Practice Joins, Normalization, Transactions, Deadlocks, and Threading parameters.";
      } else if (query.includes("dbms") || query.includes("database")) {
        aiText = "Top Database Management topics for placement tests:\n1. **Joins**: Understand Inner, Left, Right, and Full Outer Joins.\n2. **Normalization**: Revise 1NF, 2NF, 3NF, and BCNF definitions and conversion guidelines.\n3. **ACID Properties**: Define Atomicity, Consistency, Isolation, and Durability.\n4. **Indexing**: Understand differences between clustered and non-clustered index lookup complexities.";
      }

      setMessages((prev) => [...prev, {
        sender: 'ai',
        text: aiText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsTyping(false);

      // Increment sessions logged
      const currentSessions = userProfile?.counselingSessions || 0;
      updateUserStats({ counselingSessions: currentSessions + 1 });
    }, 1500);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(inputText);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100vh' }} className="animate-slide-up">
      
      {/* Page Hero Banner */}
      <PageHero 
        badge="24/7 ADVISOR"
        title="AI Career Counselor"
        subtitle="Get personalized guidance for career paths, skills, placements, and interview preparation."
        supportingLine="Your career path starts with the right next step."
      />

      <div style={{ padding: '32px 40px 40px 40px', boxSizing: 'border-box', width: '100%', flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', flexGrow: 1, minHeight: 0 }}>
        
        {/* Left Side: Chat Workspace */}
        <div className="glass-panel" style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
          background: '#FFFFFF'
        }}>
          {/* Quick suggestions header */}
          <div style={{ padding: '16px', background: 'rgba(138, 112, 214, 0.02)', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '8px', letterSpacing: '0.5px' }}>
              TAP TO ASK MENTOR
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  style={{
                    background: 'rgba(138, 112, 214, 0.04)',
                    border: '1px solid rgba(138, 112, 214, 0.15)',
                    borderRadius: '9999px',
                    padding: '6px 12px',
                    color: 'var(--accent-cyan)',
                    fontSize: '11.5px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                  className="quick-prompt-btn"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Area */}
          <div style={{
            flexGrow: 1,
            overflowY: 'auto',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                style={{
                  display: 'flex',
                  justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  width: '100%'
                }}
              >
                <div style={{
                  maxWidth: '75%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                }}>
                  <div style={{
                    padding: '12px 18px',
                    borderRadius: '16px',
                    borderTopRightRadius: msg.sender === 'user' ? '4px' : '16px',
                    borderTopLeftRadius: msg.sender === 'ai' ? '4px' : '16px',
                    background: msg.sender === 'user' ? 'var(--grad-cyan-blue)' : 'rgba(138, 112, 214, 0.03)',
                    border: '1px solid',
                    borderColor: msg.sender === 'user' ? 'transparent' : 'rgba(138, 112, 214, 0.08)',
                    color: msg.sender === 'user' ? '#FFFFFF' : 'var(--text-primary)',
                    fontSize: '13.5px',
                    fontWeight: msg.sender === 'user' ? '600' : '400',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-line'
                  }}>
                    {msg.text}
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>{msg.time}</span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{
                  padding: '12px 18px',
                  borderRadius: '16px',
                  borderTopLeftRadius: '4px',
                  background: 'rgba(138, 112, 214, 0.03)',
                  border: '1px solid rgba(138, 112, 214, 0.08)',
                  display: 'flex',
                  gap: '4px'
                }}>
                  <span className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)', display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out' }} />
                  <span className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)', display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out 0.2s' }} />
                  <span className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)', display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out 0.4s' }} />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Form input row */}
          <form onSubmit={handleFormSubmit} style={{
            padding: '16px 24px',
            background: 'rgba(138, 112, 214, 0.01)',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            gap: '12px',
            flexShrink: 0
          }}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask career path roadmaps, how to solve conflict interview questions, or negotiate salaries..."
              className="glass-input"
              style={{ flexGrow: 1 }}
            />
            <button type="submit" disabled={!inputText.trim()} className="btn btn-primary" style={{ padding: '0 24px', borderRadius: '8px' }}>
              Send
            </button>
          </form>

        </div>

        {/* Right Side: Guidance Cards Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
          
          <div className="glass-panel" style={{ padding: '20px', background: '#FFFFFF' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent-purple)', marginBottom: '10px' }}>
              🔑 SALARY NEGOTIATION RULE
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Always let the employer state their budget scale first. Frame requests around market compensation standards rather than personal finance requirements.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '20px', background: '#FFFFFF' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent-cyan)', marginBottom: '10px' }}>
              💡 STAR METHOD PARADIGM
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              When addressing behavioral queries, frame answers as:
              <br />• **S**ituation (Context)
              <br />• **T**ask (Goal)
              <br />• **A**ction (Your logic/work)
              <br />• **R**esult (Quantifiable result)
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '20px', background: '#FFFFFF' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent-emerald)', marginBottom: '10px' }}>
              📈 COGNITIVE PREP METRIC
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Review systems index logs daily. Completing mock interviews and scanning resumes directly feed parameters back to your dashboard score index.
            </p>
          </div>

        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .quick-prompt-btn:hover {
          background: rgba(138, 112, 214, 0.1) !important;
          transform: translateY(-1px);
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }
        @media (max-width: 900px) {
          div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="overflowY: auto"] {
            display: none !important;
          }
        }
      `}} />

      </div>
    </div>
  );
}
