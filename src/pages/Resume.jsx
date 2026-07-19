import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Resume() {
  const { userProfile, updateUserStats } = useAuth();
  const [jobDescription, setJobDescription] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [jobRole, setJobRole] = useState('Software Engineer');
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);

  const roles = [
    'Software Engineer',
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Engineer',
    'Data Scientist',
    'Product Manager',
    'Data Analyst'
  ];

  // A list of keywords per role to run simulated parsing
  const roleKeywordsMap = {
    'Software Engineer': ['Algorithms', 'Data Structures', 'Git', 'System Design', 'OOP', 'Testing', 'Databases', 'Python', 'Java', 'C++'],
    'Frontend Developer': ['React', 'JavaScript', 'HTML5', 'CSS3', 'TypeScript', 'Redux', 'Responsive Design', 'Vite', 'Webpack', 'Tailwind'],
    'Backend Developer': ['Node.js', 'Express', 'Databases', 'SQL', 'NoSQL', 'MongoDB', 'REST APIs', 'Docker', 'Redis', 'Microservices', 'GraphQL'],
    'Full Stack Engineer': ['React', 'Node.js', 'Express', 'SQL', 'MongoDB', 'JavaScript', 'Git', 'REST APIs', 'Cloud Computing', 'TypeScript'],
    'Data Scientist': ['Python', 'Machine Learning', 'SQL', 'R', 'TensorFlow', 'Pandas', 'Statistics', 'Data Visualization', 'Deep Learning', 'PyTorch'],
    'Product Manager': ['Agile', 'Scrum', 'Product Roadmap', 'Wireframing', 'Market Research', 'KPIs', 'Jira', 'SQL', 'A/B Testing', 'User Personas'],
    'Data Analyst': ['SQL', 'Excel', 'Tableau', 'PowerBI', 'Python', 'Data Wrangling', 'R', 'Statistics', 'Reports', 'Dashboards']
  };

  const handleAnalyze = (e) => {
    e.preventDefault();
    if (!resumeText.trim()) return;

    setAnalyzing(true);

    // Simulate AI analyze delay
    setTimeout(() => {
      const selectedKeywords = roleKeywordsMap[jobRole] || [];
      const resumeLower = resumeText.toLowerCase();
      
      // Compute matches
      const matched = [];
      const missing = [];
      
      selectedKeywords.forEach(kw => {
        if (resumeLower.includes(kw.toLowerCase())) {
          matched.push(kw);
        } else {
          missing.push(kw);
        }
      });

      // Analyze formatting issues
      const formattingIssues = [];
      if (resumeText.length < 200) {
        formattingIssues.push("Resume is too short. Include more details about experience and projects.");
      }
      if (!resumeLower.includes("education")) {
        formattingIssues.push("Missing 'Education' header block.");
      }
      if (!resumeLower.includes("experience") && !resumeLower.includes("internship")) {
        formattingIssues.push("Missing 'Experience' or 'Internships' section.");
      }
      if (!resumeLower.includes("project")) {
        formattingIssues.push("No projects detected. Add 2-3 academic or personal projects to increase credibility.");
      }
      if (!resumeLower.includes("contact") && !resumeLower.includes("email") && !resumeLower.includes("@")) {
        formattingIssues.push("No email address or contact info detected.");
      }

      // Calculate score based on matches & formatting
      const keywordWeight = (matched.length / selectedKeywords.length) * 60; // Up to 60 points
      const formattingWeight = Math.max(0, 40 - (formattingIssues.length * 8)); // Up to 40 points
      const score = Math.round(keywordWeight + formattingWeight);

      // Generate action recommendations
      const recommendations = [];
      if (missing.length > 0) {
        recommendations.push(`Include keywords corresponding to the ${jobRole} role, specifically: ${missing.slice(0, 3).join(', ')}.`);
      }
      formattingIssues.forEach(issue => {
        recommendations.push(issue);
      });
      if (recommendations.length === 0) {
        recommendations.push("Your resume looks fantastic and matches the ATS parameters! Keep polishing projects details.");
      }

      const resultsData = {
        score,
        matchedKeywords: matched,
        missingKeywords: missing,
        formattingIssues,
        recommendations
      };

      setResults(resultsData);
      setAnalyzing(false);

      // Save stats to Auth
      const currentUploads = userProfile?.resumeStats?.uploadsCount || 0;
      updateUserStats({
        resumeStats: {
          score: score,
          uploadsCount: currentUploads + 1,
          lastAnalyzed: new Date().toISOString(),
          targetRole: jobRole
        }
      });
    }, 2000);
  };

  return (
    <div className="main-content animate-slide-up" style={{ padding: '20px 0' }}>
      
      {/* Header Banner */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
          <span className="text-gradient-cyan-blue">ATS RESUME</span> REVIEWER
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', fontWeight: '500' }}>
          Rate your resume ATS score instantly, review missing keywords, and adapt your profile details for your target placement domain.
        </p>
      </div>

      <div className="grid-cols-12">
        {/* Left Column: Form & Inputs (Span 8) */}
        <div className="col-span-8">
          <div className="glass-panel" style={{ padding: '28px', background: '#FFFFFF' }}>
            <form onSubmit={handleAnalyze} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                <div>
                  <label className="glass-label">Target Role</label>
                  <select 
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    className="glass-input"
                    style={{ background: '#FFFFFF', cursor: 'pointer' }}
                  >
                    {roles.map((role) => (
                      <option key={role} value={role} style={{ background: '#FFFFFF' }}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="glass-label">Keywords Baseline</label>
                  <div className="glass-input" style={{ background: 'rgba(138, 112, 214, 0.02)', border: '1px solid rgba(138, 112, 214, 0.08)', display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '8px 12px', minHeight: '44px' }}>
                    {roleKeywordsMap[jobRole].slice(0, 4).map((kw, i) => (
                      <span key={i} className="badge badge-purple" style={{ fontSize: '10px' }}>{kw}</span>
                    ))}
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', alignSelf: 'center', marginLeft: '4px', fontWeight: '500' }}>+{roleKeywordsMap[jobRole].length - 4} more</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="glass-label">Optional: Target Job Description</label>
                <textarea 
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the target job description or requirements here to refine recommendations..."
                  className="glass-input"
                  style={{ minHeight: '100px', resize: 'vertical' }}
                />
              </div>

              <div>
                <label className="glass-label">Resume Text</label>
                <textarea 
                  required
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste the text content of your resume here..."
                  className="glass-input"
                  style={{ minHeight: '220px', resize: 'vertical' }}
                />
              </div>

              <button 
                type="submit" 
                disabled={analyzing || !resumeText.trim()}
                className="btn btn-primary"
                style={{ width: 'fit-content', padding: '12px 32px', alignSelf: 'flex-start' }}
              >
                {analyzing ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid #fff',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Scanning Syntax...
                  </span>
                ) : 'Run ATS Audit'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Audit Results (Span 4) */}
        <div className="col-span-4">
          {results ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
              
              {/* ATS Score Card */}
              <div className="glass-panel" style={{ padding: '24px', background: '#FFFFFF', textAlign: 'center' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '1px', marginBottom: '16px' }}>
                  ATS COMPATIBILITY SCORE
                </p>
                <div style={{
                  fontSize: '56px',
                  fontWeight: '800',
                  color: results.score >= 80 ? 'var(--accent-emerald)' : results.score >= 60 ? 'var(--accent-amber)' : 'var(--accent-pink)',
                  lineHeight: '1'
                }}>
                  {results.score}<span style={{ fontSize: '20px', color: 'var(--text-muted)' }}>/100</span>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <span className={`badge ${results.score >= 80 ? 'badge-emerald' : results.score >= 60 ? 'badge-amber' : 'badge-rose'}`}>
                    {results.score >= 80 ? 'Excellent' : results.score >= 60 ? 'Needs Tweaks' : 'Critical Fixes'}
                  </span>
                </div>
              </div>

              {/* Keyword Analytics */}
              <div className="glass-panel" style={{ padding: '24px', background: '#FFFFFF' }}>
                <h3 style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '14px', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
                  KEYWORDS GAP ANALYSIS
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px', letterSpacing: '0.5px' }}>MATCHED KEYWORDS ({results.matchedKeywords.length})</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {results.matchedKeywords.length > 0 ? (
                        results.matchedKeywords.map((kw, i) => (
                          <span key={i} className="badge badge-emerald" style={{ fontSize: '10px' }}>{kw}</span>
                        ))
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>None matched</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px', letterSpacing: '0.5px' }}>MISSING KEYWORDS ({results.missingKeywords.length})</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {results.missingKeywords.length > 0 ? (
                        results.missingKeywords.map((kw, i) => (
                          <span key={i} className="badge badge-amber" style={{ fontSize: '10px' }}>{kw}</span>
                        ))
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>None missing</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="glass-panel" style={{ padding: '24px', background: '#FFFFFF' }}>
                <h3 style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '14px', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
                  IMPROVEMENT PLAN
                </h3>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyleType: 'none', paddingLeft: 0 }}>
                  {results.recommendations.map((rec, i) => (
                    <li key={i} style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      <span style={{ color: 'var(--accent-cyan)' }}>✦</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '32px', background: '#FFFFFF', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" width="48" height="48" style={{ color: 'var(--accent-cyan)', opacity: 0.7, marginBottom: '16px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>Awaiting Audit</h3>
              <p style={{ fontSize: '12.5px', maxWidth: '200px' }}>Input your profile text and select a target role to launch analysis.</p>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />
      
    </div>
  );
}
