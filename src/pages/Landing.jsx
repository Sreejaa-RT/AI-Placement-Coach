import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      position: 'relative',
      background: 'var(--bg-dark)',
      boxSizing: 'border-box'
    }} className="animate-fade-in">
      
      {/* Decorative Warm Pastel Blur Spheres */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '15%',
        width: '400px',
        height: '400px',
        background: 'rgba(138, 112, 214, 0.08)',
        borderRadius: '50%',
        filter: 'blur(90px)',
        zIndex: -1
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '15%',
        width: '450px',
        height: '450px',
        background: 'rgba(96, 182, 167, 0.05)',
        borderRadius: '50%',
        filter: 'blur(90px)',
        zIndex: -1
      }} />

      <div style={{
        width: '100%',
        maxWidth: '1000px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '40px'
      }}>
        {/* Brand Badge */}
        <div className="badge badge-cyan" style={{ fontSize: '12px', padding: '6px 14px' }}>
          ✦ PREP AI: PREPARE SMARTER. GET HIRED.
        </div>

        {/* Headline & Description */}
        <div style={{ maxWidth: '750px' }}>
          <h1 style={{
            fontSize: '52px',
            fontWeight: '800',
            color: 'var(--text-primary)',
            lineHeight: '1.2',
            letterSpacing: '-1.5px',
            marginBottom: '20px'
          }}>
            Accelerate Your Interview & <br />
            Career Preparation with <span className="text-gradient-cyan-blue">PREP AI</span>
          </h1>
          <p style={{
            fontSize: '17px',
            color: 'var(--text-secondary)',
            lineHeight: '1.6',
            margin: '0 auto',
            maxWidth: '620px'
          }}>
            A personal career counselor at your fingertips. Grade your resume ATS compatibility, conduct voice mock interviews, attempt aptitude practice sets, and roadmap your future.
          </p>
        </div>

        {/* Get Started Button */}
        <div>
          <button 
            onClick={() => navigate('/login')} 
            className="btn btn-primary"
            style={{
              padding: '16px 44px',
              fontSize: '15px',
              borderRadius: '9999px',
              boxShadow: '0 8px 24px rgba(138, 112, 214, 0.3)'
            }}
          >
            <span>Get Started Free</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" width="16" height="16">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
          width: '100%',
          marginTop: '40px'
        }}>
          
          <div className="glass-card" style={{ padding: '24px', background: '#FFFFFF', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'rgba(138, 112, 214, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="22" height="22">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>Resume Analyzer</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Audit your resume structure and missing keywords to pass target corporate ATS systems.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '24px', background: '#FFFFFF', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'rgba(167, 139, 250, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-purple)'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="22" height="22">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>Mock Interviewer</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Practice speaking or writing answers directly to dynamic, domain-specific AI panels.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '24px', background: '#FFFFFF', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'rgba(242, 157, 110, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-amber)'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="22" height="22">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-16.25a8.966 8.966 0 016-2.25c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-16.25v14.25" />
              </svg>
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>Aptitude Prep</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Attempt multiple choice tests on DSA, Algorithms, OS, DBMS and Math with explanations.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '24px', background: '#FFFFFF', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'rgba(96, 182, 167, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-emerald)'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="22" height="22">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-1.074-.765 7.99 7.99 0 001.258-3.807A8.967 8.967 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>Career Counselor</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Chat with an advisor to plan software career tracks and manage salary targets.
            </p>
          </div>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 900px) {
          h1 {
            font-size: 34px !important;
          }
          div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />

    </div>
  );
}
