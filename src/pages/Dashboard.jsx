import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserResumeAnalyses } from '../services/resumeService';

export default function Dashboard() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [latestResumeAnalysis, setLatestResumeAnalysis] = useState(null);
  const [resumeAnalysesCount, setResumeAnalysesCount] = useState(0);
  const [loadingResumeStats, setLoadingResumeStats] = useState(true);

  // Fetch real resume stats from Firestore
  const fetchResumeStats = React.useCallback(async () => {
    if (!currentUser?.uid) {
      setLoadingResumeStats(false);
      return;
    }
    setLoadingResumeStats(true);
    try {
      const records = await getUserResumeAnalyses(currentUser.uid);
      setResumeAnalysesCount(records.length);
      if (records.length > 0) {
        setLatestResumeAnalysis(records[0]);
      } else {
        setLatestResumeAnalysis(null);
      }
    } catch (err) {
      console.error('Error fetching resume stats for dashboard:', err);
    } finally {
      setLoadingResumeStats(false);
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    fetchResumeStats();
  }, [fetchResumeStats]);

  // Metrics with defaults
  const readiness = userProfile?.readinessScore || 0;
  const resumeScore = latestResumeAnalysis?.atsScore || userProfile?.resumeStats?.score || 0;
  const interviewScore = userProfile?.interviewStats?.score || 0;
  const aptitudeScore = userProfile?.aptitudeStats?.score || 0;

  // Visual dial parameters
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (readiness / 100) * circumference;

  const quickActions = [
    {
      title: 'Analyze Resume',
      desc: 'Check ATS score and get dynamic keyword recommendations.',
      route: '/resume',
      badge: 'Resume Check',
      badgeClass: 'badge-cyan',
      color: 'var(--accent-cyan)',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      )
    },
    {
      title: 'Mock Interview',
      desc: 'Start interactive, speech/text-based role mock interviews.',
      route: '/interview',
      badge: 'Practice AI',
      badgeClass: 'badge-purple',
      color: 'var(--accent-purple)',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
        </svg>
      )
    },
    {
      title: 'Aptitude & Technical',
      desc: 'Solve DSA, OS, DBMS and Math recruitment MCQs.',
      route: '/aptitude',
      badge: 'Skill Test',
      badgeClass: 'badge-amber',
      color: 'var(--accent-amber)',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-16.25a8.966 8.966 0 016-2.25c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-16.25v14.25" />
        </svg>
      )
    },
    {
      title: 'AI Career Counselor',
      desc: 'Ask career roadmaps, salary questions or path suggestions.',
      route: '/counselor',
      badge: '24/7 Advisor',
      badgeClass: 'badge-emerald',
      color: 'var(--accent-emerald)',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-1.074-.765 7.99 7.99 0 001.258-3.807A8.967 8.967 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
      )
    }
  ];

  const milestones = [
    { text: 'Analyze and grade your first resume', completed: resumeAnalysesCount > 0 },
    { text: 'Achieve a resume ATS score above 70%', completed: resumeScore >= 70 },
    { text: 'Complete a full Mock Interview simulation', completed: userProfile?.interviewStats?.completedCount > 0 },
    { text: 'Reach an average Mock Interview rating of 75%+', completed: interviewScore >= 75 },
    { text: 'Attempt at least one technical aptitude test', completed: userProfile?.aptitudeStats?.questionsSolved > 0 },
    { text: 'Cross a combined PREP AI Readiness index of 80%', completed: readiness >= 80 }
  ];

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      
      {/* Welcome Banner */}
      <div style={{
        padding: '40px 40px 32px 40px',
        background: 'linear-gradient(135deg, #005947 0%, #00473a 50%, #18A957 100%)',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Pill Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '6px 14px',
          borderRadius: '9999px',
          background: 'rgba(255, 255, 255, 0.12)',
          color: '#2FBF71',
          fontSize: '11px',
          fontWeight: '700',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          marginBottom: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          Prepare Smarter · Get Hired
        </div>

        <h2 style={{ fontSize: '30px', fontWeight: '800', marginBottom: '8px', color: '#FFFFFF', letterSpacing: '-0.5px' }}>
          Welcome back, <span style={{ color: '#2FBF71', textShadow: '0 2px 4px rgba(0,0,0,0.15)' }}>{userProfile?.displayName || 'Developer'}</span>!
        </h2>
        <p style={{ color: '#E6F4ED', fontSize: '14.5px', fontWeight: '500', margin: 0 }}>
          Your PREP AI dashboards are configured and active. Let's make you recruitment-ready!
        </p>

        {/* Motivational Line */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: '#B2D1C1',
          fontSize: '12px',
          fontWeight: '500',
          marginTop: '12px'
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style={{ color: '#2FBF71' }}>
            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
          </svg>
          <span>Every prep counts. Every review counts. Let's close the gap.</span>
        </div>
      </div>

      <div className="main-content" style={{ padding: '32px 40px 40px 40px', boxSizing: 'border-box', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
        <div className="grid-cols-12">
        {/* Left Column: Metrics & Actions (Span 8) */}
        <div className="col-span-8" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Quick Actions Grid */}
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '16px', letterSpacing: '0.8px' }}>
              RECOMMENDED RUNS
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '20px'
            }}>
              {quickActions.map((action, index) => (
                <div 
                  key={index}
                  className="glass-card" 
                  onClick={() => navigate(action.route)}
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '190px',
                    background: '#FFFFFF'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        background: 'rgba(138, 112, 214, 0.06)',
                        border: '1px solid rgba(138, 112, 214, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: action.color
                      }}>
                        {action.icon}
                      </div>
                      <span className={`badge ${action.badgeClass}`}>{action.badge}</span>
                    </div>
                    <h4 style={{ fontSize: '15.5px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>{action.title}</h4>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{action.desc}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--accent-cyan)', fontWeight: '600', marginTop: '12px' }}>
                    <span>Launch Portal</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" width="14" height="14">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Sub-Metrics Breakdown Card */}
          <div className="glass-panel" style={{ padding: '24px', background: '#FFFFFF' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '20px', letterSpacing: '0.5px' }}>PREPARATION STAGE STATS</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '24px'
            }}>
              <div style={{ padding: '16px', background: 'rgba(138, 112, 214, 0.02)', borderRadius: '8px', borderLeft: '3px solid var(--accent-cyan)', border: '1px solid rgba(138, 112, 214, 0.06)', borderLeftWidth: '3px' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.5px' }}>ATS RESUME SCORE</p>
                <p style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
                  {resumeAnalysesCount > 0 ? `${resumeScore}%` : '-'}
                </p>
                <p style={{ fontSize: '11px', color: resumeAnalysesCount > 0 ? 'var(--accent-emerald)' : 'var(--text-muted)', marginTop: '4px', fontWeight: '500' }}>
                  {resumeAnalysesCount > 0 ? `${resumeAnalysesCount} analysis run(s)` : 'No analysis yet'}
                </p>
              </div>
              <div style={{ padding: '16px', background: 'rgba(167, 139, 250, 0.02)', borderRadius: '8px', borderLeft: '3px solid var(--accent-purple)', border: '1px solid rgba(167, 139, 250, 0.06)', borderLeftWidth: '3px' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.5px' }}>MOCK INTERVIEW CAP</p>
                <p style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>{interviewScore}%</p>
                <p style={{ fontSize: '11px', color: 'var(--accent-purple)', marginTop: '4px', fontWeight: '500' }}>
                  {userProfile?.interviewStats?.completedCount || 0} session(s) run
                </p>
              </div>
              <div style={{ padding: '16px', background: 'rgba(242, 157, 110, 0.02)', borderRadius: '8px', borderLeft: '3px solid var(--accent-amber)', border: '1px solid rgba(242, 157, 110, 0.06)', borderLeftWidth: '3px' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.5px' }}>APTITUDE SOLVED</p>
                <p style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>{aptitudeScore}%</p>
                <p style={{ fontSize: '11px', color: 'var(--accent-amber)', marginTop: '4px', fontWeight: '500' }}>
                  {userProfile?.aptitudeStats?.questionsSolved || 0} questions logged
                </p>
              </div>
            </div>
          </div>

          {/* Real Resume Metrics Summary & Top Missing Skills / Empty State */}
          <div className="glass-panel" style={{ padding: '24px', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                RESUME ANALYZER HIGHLIGHTS
              </h3>
              {resumeAnalysesCount > 0 && (
                <button
                  type="button"
                  onClick={() => navigate('/resume')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent-cyan)',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  View All Analyses ({resumeAnalysesCount}) →
                </button>
              )}
            </div>

            {loadingResumeStats ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading resume metrics...</p>
            ) : !latestResumeAnalysis ? (
              <div style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--text-muted)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" width="42" height="42" style={{ color: 'var(--accent-cyan)', opacity: 0.6, marginBottom: '10px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <h4 style={{ fontSize: '14.5px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  No resume analysis yet.
                </h4>
                <p style={{ fontSize: '13px', marginBottom: '16px' }}>
                  Analyze your resume to see your ATS score and personalized keyword gaps.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/resume')}
                  className="btn btn-primary"
                  style={{ padding: '8px 24px', fontSize: '13px' }}
                >
                  Analyze Resume
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.5px' }}>LATEST AUDITED ROLE</p>
                  <p style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
                    {latestResumeAnalysis.targetRole}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    File: {latestResumeAnalysis.fileName} • ATS Score: <span style={{ color: 'var(--accent-purple)', fontWeight: '700' }}>{latestResumeAnalysis.atsScore}%</span>
                  </p>
                </div>

                <div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '6px' }}>TOP MISSING SKILLS</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {latestResumeAnalysis.keywords?.missing?.length > 0 ? (
                      latestResumeAnalysis.keywords.missing.slice(0, 4).map((kw, i) => (
                        <span key={i} className="badge badge-rose" style={{ fontSize: '10.5px' }}>{kw}</span>
                      ))
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--accent-emerald)', fontWeight: '600' }}>✓ Essential keywords matched!</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Readiness Score Dial & Milestones (Span 4) */}
        <div className="col-span-4" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Circular Dial Indicator Card */}
          <div className="glass-panel" style={{
            padding: '30px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            background: '#FFFFFF'
          }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '24px' }}>
              PREP AI READINESS INDEX
            </h3>
            
            <div style={{ position: 'relative', width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="150" height="150" viewBox="0 0 150 150" style={{ transform: 'rotate(-90deg)' }}>
                {/* Track circle */}
                <circle
                  cx="75"
                  cy="75"
                  r={radius}
                  fill="transparent"
                  stroke="rgba(138, 112, 214, 0.06)"
                  strokeWidth="10"
                />
                {/* Progress circle */}
                <circle
                  cx="75"
                  cy="75"
                  r={radius}
                  fill="transparent"
                  stroke="url(#dialGrad)"
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset var(--transition-slow)' }}
                />
                <defs>
                  <linearGradient id="dialGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--accent-cyan)" />
                    <stop offset="100%" stopColor="var(--accent-purple)" />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Central text */}
              <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1 }}>{readiness}%</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', marginTop: '4px', letterSpacing: '0.5px' }}>READY</span>
              </div>
            </div>

            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '24px', lineHeight: '1.6' }}>
              {readiness < 40 
                ? 'Begin your prep by loading a resume to analyze your layout score.' 
                : readiness < 75 
                ? 'Good progress! Engage in more mock interviews to raise your readiness score.'
                : 'Excellent metrics! You are in the top tier of PREP AI prep.'
              }
            </p>
          </div>

          {/* Goals & Checklists Card */}
          <div className="glass-panel" style={{ padding: '24px', background: '#FFFFFF' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '16px', letterSpacing: '0.5px' }}>PREP MILESTONES</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {milestones.map((milestone, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '4px',
                    background: milestone.completed ? 'rgba(96, 182, 167, 0.08)' : '#FFFFFF',
                    border: milestone.completed ? '1px solid var(--accent-emerald)' : '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-emerald)',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    {milestone.completed && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span style={{ 
                    fontSize: '12.5px', 
                    color: milestone.completed ? 'var(--text-muted)' : 'var(--text-secondary)',
                    textDecoration: milestone.completed ? 'line-through' : 'none'
                  }}>
                    {milestone.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
      </div>
      
      {/* Mobile view override rules */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 1024px) {
          .grid-cols-12 {
            display: flex !important;
            flex-direction: column !important;
            gap: 24px !important;
          }
        }
      `}} />

    </div>
  );
}
