import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import PageHero from '../components/PageHero';
import { extractTextFromFile, validateResumeFile } from '../utils/textExtractor';
import { saveResumeAnalysis, getUserResumeAnalyses, deleteResumeAnalysis } from '../services/resumeService';

export default function Resume() {
  const { currentUser, userProfile, updateUserStats } = useAuth();

  // File & Text state
  const [selectedFile, setSelectedFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [jobRole, setJobRole] = useState('Software Engineer');
  const [customRole, setCustomRole] = useState('');
  const [customJd, setCustomJd] = useState('');
  const [showTextPreview, setShowTextPreview] = useState(false);

  // Flow states: 'idle' | 'extracting' | 'analyzing' | 'saving' | 'completed'
  const [statusState, setStatusState] = useState('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Results & History
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  const targetRolesList = [
    'Software Engineer',
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'Data Analyst',
    'Data Scientist',
    'Machine Learning Engineer',
    'Java Developer',
    'Python Developer',
    'Mobile App Developer',
    'DevOps Engineer',
    'Cloud Engineer',
    'Cybersecurity Analyst',
    'Other / Custom Role'
  ];

  // Load history from Firestore
  const loadHistory = useCallback(async () => {
    if (!currentUser?.uid) return;
    setLoadingHistory(true);
    try {
      const records = await getUserResumeAnalyses(currentUser.uid);
      setHistory(records);
    } catch (err) {
      console.error('Failed to fetch resume history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const activeRoleName = jobRole === 'Other / Custom Role' ? (customRole.trim() || 'Custom Role') : jobRole;

  // File Handling
  const handleFileSelect = (file) => {
    if (!file) return;
    setErrorMsg('');
    try {
      validateResumeFile(file);
      setSelectedFile(file);
      setStatusState('idle');
      setStatusMessage('');
    } catch (err) {
      console.error('File validation error:', err);
      setSelectedFile(null);
      setErrorMsg(err.message || 'Invalid resume file.');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setExtractedText('');
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Trigger Real AI Resume Audit
  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please upload a resume document first.');
      return;
    }

    const selectedRoleId = targetRolesList.indexOf(jobRole);
    if (selectedRoleId === 13 && (!customRole.trim() || !customJd.trim())) {
      setErrorMsg('Please specify both the custom job role name and the job description.');
      return;
    }

    setErrorMsg('');
    setStatusState('analyzing');
    setStatusMessage('Analyzing resume against target role metrics...');

    try {
      const formData = new FormData();
      formData.append("resume", selectedFile);
      formData.append("job_role_id", selectedRoleId);
      if (selectedRoleId === 13) {
        formData.append("custom_job_description", customJd);
      }

      const response = await fetch('/api/v1/resume/audit', {
        method: 'POST',
        body: formData
        // Content-Type is set automatically by the browser with multipart boundaries
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.detail || errJson.error || errJson.message || `Server responded with status ${response.status}`);
      }

      const aiResult = await response.json();

      setStatusState('saving');
      setStatusMessage('Saving analysis to your Firestore history...');

      const savedRecord = await saveResumeAnalysis(currentUser.uid, {
        fileName: selectedFile ? selectedFile.name : 'Resume.pdf',
        fileSize: selectedFile ? selectedFile.size : 0,
        targetRole: activeRoleName,
        atsScore: aiResult.resume_fit_score,
        fitCategory: aiResult.fit_category,
        predictedLabel: aiResult.predicted_label,
        mlCompatibilityScore: aiResult.ml_compatibility_score,
        skillScore: aiResult.skill_score,
        keywordScore: aiResult.keyword_score,
        similarityScore: aiResult.similarity_score,
        skillMatchRatio: aiResult.skill_match_ratio,
        keywordOverlapRatio: aiResult.keyword_overlap_ratio,
        cosineSimilarity: aiResult.cosine_similarity,
        goodFitProbability: aiResult.good_fit_probability,
        potentialFitProbability: aiResult.potential_fit_probability,
        noFitProbability: aiResult.no_fit_probability,
        skills: {
          technical: aiResult.matched_skills || [],
          tools: [],
          soft: []
        },
        experience: {
          relevantExperience: [],
          strengths: aiResult.strengths || [],
          weaknesses: aiResult.missing_skills?.map(s => `Missing required skill: ${s}`) || [],
          improvements: []
        },
        keywords: {
          matched: aiResult.matched_skills || [],
          missing: aiResult.missing_skills || []
        },
        recommendations: aiResult.suggestions || [],
        priorityImprovements: aiResult.suggestions?.slice(0, 3) || []
      });

      setCurrentAnalysis(savedRecord || aiResult);
      setStatusState('completed');
      setStatusMessage('Analysis completed successfully!');

      // Update AuthContext profile metrics
      const currentUploads = userProfile?.resumeStats?.uploadsCount || 0;
      updateUserStats({
        resumeStats: {
          score: aiResult.resume_fit_score,
          uploadsCount: currentUploads + 1,
          lastAnalyzed: new Date().toISOString(),
          targetRole: activeRoleName
        }
      });

      // Reload history list
      loadHistory();
    } catch (err) {
      console.error('Resume audit error:', err);
      setStatusState('idle');
      setErrorMsg(err.message || 'Unable to connect to the AI analysis service. Please try again.');
    }
  };

  // Delete history item
  const handleDeleteHistoryItem = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this resume analysis record?')) return;

    try {
      await deleteResumeAnalysis(currentUser.uid, id);
      if (currentAnalysis?.id === id) {
        setCurrentAnalysis(null);
      }
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Failed to delete analysis:', err);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--accent-emerald)';
    if (score >= 60) return 'var(--accent-amber)';
    return 'var(--accent-pink)';
  };

  const getScoreBadge = (score) => {
    if (score >= 80) return { label: 'Strong Match', class: 'badge-emerald' };
    if (score >= 60) return { label: 'Needs Tweaks', class: 'badge-amber' };
    return { label: 'Critical Fixes', class: 'badge-rose' };
  };

  const isFormValid = Boolean(selectedFile && (jobRole !== 'Other / Custom Role' || (customRole.trim() && customJd.trim())));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }} className="animate-slide-up">
      
      {/* Page Hero Banner */}
      <PageHero 
        badge="RESUME CHECK"
        title="Resume Analyzer"
        subtitle="Analyze your resume against your target role with AI-powered scoring, keyword analysis, and ATS recommendations."
        supportingLine="Every resume can be stronger. Let's close the gap."
      />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 40px 40px 40px', boxSizing: 'border-box', width: '100%' }}>

      {/* Top Controls Grid: 2 Equal Columns on Desktop */}
      <div className="resume-grid-top" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '24px' }}>
        
        {/* Left Column: Upload Resume Card */}
        <div className="glass-panel" style={{ padding: '28px', background: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                1. Upload Resume
              </h3>
              <span className="badge badge-purple" style={{ fontSize: '11px' }}>PDF / DOCX</span>
            </div>

            {!selectedFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragging ? 'var(--accent-cyan)' : 'rgba(138, 112, 214, 0.22)'}`,
                  borderRadius: '12px',
                  padding: '32px 20px',
                  textAlign: 'center',
                  background: isDragging ? 'rgba(138, 112, 214, 0.06)' : 'rgba(138, 112, 214, 0.02)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                  style={{ display: 'none' }}
                />
                
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(138, 112, 214, 0.08)',
                  color: 'var(--accent-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto'
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>

                <p style={{ fontSize: '14.5px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Upload your resume document
                </p>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  Drag & drop your file here, or click to browse
                </p>

                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '8px 20px', fontSize: '12.5px', background: '#FFFFFF' }}
                >
                  Browse Files
                </button>
              </div>
            ) : (
              <div style={{
                border: '1px solid rgba(138, 112, 214, 0.2)',
                borderRadius: '12px',
                padding: '20px',
                background: 'rgba(138, 112, 214, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(96, 182, 167, 0.12)',
                    color: 'var(--accent-emerald)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '11.5px',
                    flexShrink: 0
                  }}>
                    {selectedFile.name.split('.').pop()?.toUpperCase() || 'DOC'}
                  </div>

                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                      {selectedFile.name}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                      {formatFileSize(selectedFile.size)} • Ready for audit
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px dashed rgba(138, 112, 214, 0.15)' }}>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    style={{
                      background: 'rgba(229, 140, 163, 0.08)',
                      border: '1px solid rgba(229, 140, 163, 0.25)',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'var(--accent-pink)',
                      cursor: 'pointer'
                    }}
                  >
                    Remove File
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Target Job Role & Analyze Card */}
        <div className="glass-panel" style={{ padding: '28px', background: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                2. Target Job Role
              </h3>
              <span className="badge badge-cyan" style={{ fontSize: '11px' }}>AI Parser</span>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label className="glass-label" style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                Select Role to Evaluate Against
              </label>
              <select
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                className="glass-input"
                style={{ cursor: 'pointer', fontSize: '14px', height: '44px' }}
              >
                {targetRolesList.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>

              {jobRole === 'Other / Custom Role' && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="text"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    placeholder="Specify custom role (e.g., AI Engineer)..."
                    className="glass-input"
                    style={{ fontSize: '13.5px', height: '42px' }}
                  />
                  <textarea
                    value={customJd}
                    onChange={(e) => setCustomJd(e.target.value)}
                    placeholder="Paste the target Job Description here..."
                    className="glass-input"
                    style={{ fontSize: '13px', minHeight: '80px', padding: '10px', resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </div>
              )}
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '20px' }}>
              The AI model audits candidate technical skills, relevant experience statements, and missing role keywords specifically for <strong style={{ color: 'var(--text-primary)' }}>{activeRoleName}</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={statusState !== 'idle' || !isFormValid}
            className="btn btn-primary"
            style={{
              width: '100%',
              height: '46px',
              fontSize: '14.5px',
              fontWeight: '700',
              opacity: (statusState !== 'idle' || !isFormValid) ? 0.55 : 1,
              cursor: (statusState !== 'idle' || !isFormValid) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {statusState !== 'idle' ? (
              <>
                <span style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid #fff',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <span>Analyzing Resume...</span>
              </>
            ) : (
              <span>Run Real AI Resume Audit →</span>
            )}
          </button>
        </div>

      </div>

      {/* Extracted Text Preview Card */}
      {showTextPreview && extractedText && (
        <div className="glass-panel" style={{ padding: '20px 24px', background: '#FFFFFF', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              Extracted Resume Text Preview
            </h4>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {extractedText.length} characters
            </span>
          </div>
          <div style={{
            padding: '14px',
            background: '#F8F7FC',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            maxHeight: '180px',
            overflowY: 'auto',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            lineHeight: '1.6'
          }}>
            {extractedText}
          </div>
        </div>
      )}

      {/* Error Card */}
      {errorMsg && (
        <div className="glass-panel animate-fade-in" style={{ padding: '20px 24px', background: 'rgba(229, 140, 163, 0.08)', border: '1px solid var(--accent-pink)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(229, 140, 163, 0.15)',
              color: 'var(--accent-pink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div style={{ flexGrow: 1 }}>
              <h4 style={{ fontSize: '14.5px', fontWeight: '700', color: '#9F2B48', marginBottom: '4px' }}>
                Resume analysis couldn't be completed
              </h4>
              <p style={{ fontSize: '13px', color: '#88223B', margin: '0 0 12px 0', lineHeight: '1.5' }}>
                {errorMsg}
              </p>
              <button
                type="button"
                onClick={() => setErrorMsg('')}
                className="btn btn-secondary"
                style={{ padding: '6px 16px', fontSize: '12px', background: '#FFFFFF', borderColor: 'var(--accent-pink)', color: 'var(--accent-pink)' }}
              >
                Dismiss & Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step-by-Step Processing Status Checklist */}
      {statusState !== 'idle' && (
        <div className="glass-panel animate-fade-in" style={{ padding: '24px', background: '#FFFFFF', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              Analysis Pipeline Progress
            </h4>
            {statusMessage && (
              <span style={{ fontSize: '12.5px', color: 'var(--accent-cyan)', fontWeight: '600' }}>
                {statusMessage}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { id: 'upload', label: 'Resume uploaded successfully' },
              { id: 'extracting', label: 'Document text extracted' },
              { id: 'analyzing', label: `Analyzing resume against ${activeRoleName} recruitment criteria` },
              { id: 'saving', label: 'Saving structured metrics to Firestore' }
            ].map((step, idx) => {
              const stepOrder = ['upload', 'extracting', 'analyzing', 'saving', 'completed'];
              const currentIdx = stepOrder.indexOf(statusState);
              const isCompleted = currentIdx > idx;
              const isCurrent = currentIdx === idx;

              return (
                <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: isCompleted ? 'rgba(96, 182, 167, 0.15)' : isCurrent ? 'rgba(138, 112, 214, 0.15)' : '#F1F5F9',
                    border: isCompleted ? '1px solid var(--accent-emerald)' : isCurrent ? '1px solid var(--accent-cyan)' : '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isCompleted ? 'var(--accent-emerald)' : isCurrent ? 'var(--accent-cyan)' : 'var(--text-muted)',
                    fontSize: '11px',
                    fontWeight: '700',
                    flexShrink: 0
                  }}>
                    {isCompleted ? '✓' : isCurrent ? '●' : '○'}
                  </div>
                  <span style={{
                    fontSize: '13.5px',
                    fontWeight: isCurrent || isCompleted ? '600' : '400',
                    color: isCompleted ? 'var(--text-primary)' : isCurrent ? 'var(--accent-cyan)' : 'var(--text-muted)'
                  }}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Analysis Results View */}
      {currentAnalysis && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }} className="animate-fade-in">
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
              Analysis Results ({currentAnalysis.targetRole})
            </h3>
            <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: '500' }}>
              Document: {currentAnalysis.fileName}
            </span>
          </div>

          {/* Row 1: ATS Score (Left 4 Cols) & Extracted Skills (Right 8 Cols) */}
          <div className="resume-grid-row1" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
            
            {/* Left Column: ATS Score + Detailed Metrics */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* ATS Score Card */}
              <div className="glass-panel" style={{ padding: '24px', background: '#FFFFFF', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '14px' }}>
                  ATS SCORE
                </p>

                <div style={{ position: 'relative', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                  <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="65" cy="65" r="52" fill="transparent" stroke="#F1F5F9" strokeWidth="10" />
                    <circle
                      cx="65"
                      cy="65"
                      r="52"
                      fill="transparent"
                      stroke={getScoreColor(currentAnalysis.atsScore)}
                      strokeWidth="10"
                      strokeDasharray={2 * Math.PI * 52}
                      strokeDashoffset={2 * Math.PI * 52 - (currentAnalysis.atsScore / 100) * (2 * Math.PI * 52)}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '36px', fontWeight: '800', color: getScoreColor(currentAnalysis.atsScore), lineHeight: '1' }}>
                      {currentAnalysis.atsScore}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>/ 100</span>
                  </div>
                </div>

                <span className={`badge ${getScoreBadge(currentAnalysis.atsScore).class}`}>
                  {currentAnalysis.fitCategory || getScoreBadge(currentAnalysis.atsScore).label}
                </span>
              </div>

              {/* Detailed Metrics Card */}
              {(currentAnalysis.predictedLabel || currentAnalysis.predicted_label) && (
                <div className="glass-panel" style={{ padding: '20px 24px', background: '#FFFFFF' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '14px', borderBottom: '1px solid #E2E8F0', paddingBottom: '6px' }}>
                    Inference Details
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Predicted Fit:</span>
                      <span className={`badge ${currentAnalysis.predictedLabel === 'Good Fit' || currentAnalysis.predicted_label === 'Good Fit' ? 'badge-emerald' : currentAnalysis.predictedLabel === 'Potential Fit' || currentAnalysis.predicted_label === 'Potential Fit' ? 'badge-amber' : 'badge-rose'}`} style={{ fontSize: '11px' }}>
                        {currentAnalysis.predictedLabel || currentAnalysis.predicted_label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>ML Compatibility:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{(currentAnalysis.mlCompatibilityScore || currentAnalysis.ml_compatibility_score || 0).toFixed(1)}/100</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Skill Match Score:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>
                        {currentAnalysis.skillScore !== undefined && currentAnalysis.skillScore !== null ? `${(currentAnalysis.skillScore).toFixed(1)}/100` : 
                         currentAnalysis.skill_score !== undefined && currentAnalysis.skill_score !== null ? `${(currentAnalysis.skill_score).toFixed(1)}/100` : 'N/A'}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Keyword Score:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{(currentAnalysis.keywordScore || currentAnalysis.keyword_score || 0).toFixed(1)}/100</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Lexical Similarity:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{(currentAnalysis.similarityScore || currentAnalysis.similarity_score || 0).toFixed(1)}/100</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Categorized Skills Card */}
            <div className="glass-panel" style={{ padding: '24px', background: '#FFFFFF' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
                Extracted Skills
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    TECHNICAL SKILLS ({currentAnalysis.skills?.technical?.length || 0})
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {currentAnalysis.skills?.technical?.length > 0 ? (
                      currentAnalysis.skills.technical.map((sk, i) => (
                        <span key={i} className="badge badge-purple" style={{ fontSize: '11px', padding: '4px 10px' }}>{sk}</span>
                      ))
                    ) : <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>None detected</span>}
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    TOOLS & TECHNOLOGIES ({currentAnalysis.skills?.tools?.length || 0})
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {currentAnalysis.skills?.tools?.length > 0 ? (
                      currentAnalysis.skills.tools.map((tl, i) => (
                        <span key={i} className="badge badge-cyan" style={{ fontSize: '11px', padding: '4px 10px' }}>{tl}</span>
                      ))
                    ) : <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>None detected</span>}
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    SOFT SKILLS & DOMAIN COMPETENCIES ({currentAnalysis.skills?.soft?.length || 0})
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {currentAnalysis.skills?.soft?.length > 0 ? (
                      currentAnalysis.skills.soft.map((sf, i) => (
                        <span key={i} className="badge badge-amber" style={{ fontSize: '11px', padding: '4px 10px' }}>{sf}</span>
                      ))
                    ) : <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>None detected</span>}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Row 2: Experience Analysis Card */}
          <div className="glass-panel" style={{ padding: '24px', background: '#FFFFFF' }}>
            <h4 style={{ fontSize: '14.5px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
              Experience Analysis
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '20px' }}>
              {/* Strengths */}
              <div style={{ padding: '16px', background: 'rgba(96, 182, 167, 0.05)', borderRadius: '10px', border: '1px solid rgba(96, 182, 167, 0.2)' }}>
                <h5 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent-emerald)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>✓</span> Strengths Identified
                </h5>
                <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  {currentAnalysis.experience?.strengths?.length > 0 ? (
                    currentAnalysis.experience.strengths.map((str, i) => (
                      <li key={i}>{str}</li>
                    ))
                  ) : <li>Solid foundation identified.</li>}
                </ul>
              </div>

              {/* Weaknesses */}
              <div style={{ padding: '16px', background: 'rgba(242, 157, 110, 0.05)', borderRadius: '10px', border: '1px solid rgba(242, 157, 110, 0.2)' }}>
                <h5 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent-amber)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⚠</span> Areas to Improve
                </h5>
                <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  {currentAnalysis.experience?.weaknesses?.length > 0 ? (
                    currentAnalysis.experience.weaknesses.map((wk, i) => (
                      <li key={i}>{wk}</li>
                    ))
                  ) : <li>No critical weaknesses detected.</li>}
                </ul>
              </div>
            </div>

            {/* Statement Enhancements Callouts */}
            {currentAnalysis.experience?.improvements?.length > 0 && (
              <div>
                <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '10px' }}>
                  → SUGGESTED STATEMENT IMPROVEMENTS
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {currentAnalysis.experience.improvements.map((imp, idx) => (
                    <div key={idx} style={{ padding: '12px 16px', background: '#F8F7FC', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12.5px' }}>
                      <p style={{ color: 'var(--accent-pink)', fontWeight: '600', margin: '0 0 4px 0' }}>
                        ❌ Original: "{imp.original}"
                      </p>
                      <p style={{ color: 'var(--accent-emerald)', fontWeight: '600', margin: 0 }}>
                        💡 Enhanced: "{imp.improved}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Row 3: Keywords Gap Analysis (Matched vs Missing) */}
          <div className="resume-grid-row3" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
            
            {/* Matched Keywords Card */}
            <div className="glass-panel" style={{ padding: '24px', background: '#FFFFFF' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-emerald)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>✓</span> Matched Keywords ({currentAnalysis.keywords?.matched?.length || 0})
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {currentAnalysis.keywords?.matched?.length > 0 ? (
                  currentAnalysis.keywords.matched.map((kw, i) => (
                    <span key={i} className="badge badge-emerald" style={{ fontSize: '11.5px', padding: '6px 12px' }}>{kw}</span>
                  ))
                ) : (
                  <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>No essential keywords matched yet.</span>
                )}
              </div>
            </div>

            {/* Missing Keywords Card */}
            <div className="glass-panel" style={{ padding: '24px', background: '#FFFFFF' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-pink)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>⚠</span> Missing Keywords ({currentAnalysis.keywords?.missing?.length || 0})
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {currentAnalysis.keywords?.missing?.length > 0 ? (
                  currentAnalysis.keywords.missing.map((kw, i) => (
                    <span key={i} className="badge badge-rose" style={{ fontSize: '11.5px', padding: '6px 12px' }}>{kw}</span>
                  ))
                ) : (
                  <span style={{ fontSize: '12.5px', color: 'var(--accent-emerald)', fontWeight: '600' }}>✓ All major role keywords are present!</span>
                )}
              </div>
            </div>

          </div>

          {/* Row 4: AI Recommendations & Priority Fixes */}
          <div className="glass-panel" style={{ padding: '24px', background: '#FFFFFF' }}>
            <h4 style={{ fontSize: '14.5px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
              AI Recommendations
            </h4>

            {currentAnalysis.priorityImprovements?.length > 0 && (
              <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(242, 157, 110, 0.08)', borderRadius: '10px', border: '1px solid var(--accent-amber)' }}>
                <p style={{ fontSize: '11.5px', fontWeight: '800', color: 'var(--accent-amber)', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  PRIORITY ACTION ITEMS:
                </p>
                <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.6' }}>
                  {currentAnalysis.priorityImprovements.map((p, i) => (
                    <li key={i} style={{ fontWeight: '600' }}>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {currentAnalysis.recommendations?.map((rec, i) => (
                <div key={i} style={{
                  padding: '16px',
                  background: '#FAF9FE',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'flex-start'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '800',
                    color: 'var(--accent-cyan)',
                    background: 'rgba(138, 112, 214, 0.1)',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    flexShrink: 0
                  }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                    {rec}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Resume Analysis History Section */}
      <div className="glass-panel" style={{ padding: '28px', background: '#FFFFFF' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
              Resume Analysis History
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              View or load previous audits saved to your authenticated profile
            </p>
          </div>
          <span className="badge badge-purple" style={{ fontSize: '11px' }}>
            {history.length} Saved Record(s)
          </span>
        </div>

        {loadingHistory ? (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading history records...</p>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" width="48" height="48" style={{ color: 'var(--accent-cyan)', opacity: 0.6, marginBottom: '12px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <h4 style={{ fontSize: '14.5px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
              No resume analyses saved yet
            </h4>
            <p style={{ fontSize: '13px', maxWidth: '300px', margin: '0 auto' }}>
              Upload your resume and select a target role above to run your first real AI recruitment audit.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {history.map((item) => {
              const badge = getScoreBadge(item.atsScore);
              const isCurrent = currentAnalysis?.id === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => setCurrentAnalysis(item)}
                  className="glass-card"
                  style={{
                    padding: '20px',
                    cursor: 'pointer',
                    background: isCurrent ? 'rgba(138, 112, 214, 0.04)' : '#FFFFFF',
                    border: isCurrent ? '2px solid var(--accent-purple)' : '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '130px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', margin: 0, paddingRight: '8px' }}>
                        {item.targetRole}
                      </h4>
                      <span className={`badge ${badge.class}`} style={{ fontSize: '10.5px', flexShrink: 0 }}>
                        ATS {item.atsScore}/100
                      </span>
                    </div>

                    <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '0 0 4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      📄 {item.fileName}
                    </p>
                    <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0 }}>
                      Analyzed {item.formattedDate}
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--accent-cyan)' }}>
                      {isCurrent ? 'Viewing Active Result' : 'View Analysis →'}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteHistoryItem(e, item.id)}
                      title="Delete Record"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Global CSS for spinner and responsive stacking */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @media (max-width: 899px) {
          .resume-grid-top,
          .resume-grid-row1,
          .resume-grid-row3 {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />
      </div>
    </div>
  );
}
