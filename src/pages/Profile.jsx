import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { currentUser, userProfile, updateUserStats } = useAuth();
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [apiKey, setApiKey] = useState(userProfile?.apiKey || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    
    if (!displayName.trim()) {
      return setError('Name cannot be empty.');
    }

    try {
      setSaving(true);
      await updateUserStats({
        displayName: displayName.trim(),
        apiKey: apiKey.trim()
      });
      setMessage('Profile and settings updated successfully!');
    } catch (err) {
      console.error(err);
      setError('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetStats = async () => {
    const confirm = window.confirm("Are you sure you want to reset all preparation statistics? This will return your readiness score back to 0%.");
    if (!confirm) return;

    setMessage('');
    setError('');
    try {
      setSaving(true);
      await updateUserStats({
        readinessScore: 0,
        resumeStats: { score: 0, uploadsCount: 0, lastAnalyzed: null, targetRole: "" },
        interviewStats: { score: 0, completedCount: 0, lastPracticed: null },
        aptitudeStats: { score: 0, questionsSolved: 0, categories: {} },
        counselingSessions: 0
      });
      setMessage('Placement metrics reset successfully.');
    } catch (err) {
      console.error(err);
      setError('Failed to reset statistics.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="main-content animate-slide-up" style={{ padding: '20px 0' }}>
      
      {/* Header Info */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
          <span className="text-gradient-cyan-blue">PROFILE & CONFIG</span> CONTROL
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', fontWeight: '500' }}>
          Manage your personal placement parameters, configure Custom AI parameters, and check aggregate metrics.
        </p>
      </div>

      <div className="grid-cols-12">
        {/* Left Column: Settings Form (Span 8) */}
        <div className="col-span-8">
          <div className="glass-panel" style={{ padding: '32px', background: '#FFFFFF' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px', letterSpacing: '0.5px' }}>
              ACCOUNT SETTINGS
            </h3>

            {error && (
              <div className="badge badge-rose" style={{ display: 'block', width: '100%', padding: '10px 14px', borderRadius: '8px', fontSize: '12.5px', marginBottom: '20px', textTransform: 'none', letterSpacing: 'normal' }}>
                ⚠️ {error}
              </div>
            )}
            {message && (
              <div className="badge badge-emerald" style={{ display: 'block', width: '100%', padding: '10px 14px', borderRadius: '8px', fontSize: '12.5px', marginBottom: '20px', textTransform: 'none', letterSpacing: 'normal' }}>
                ✓ {message}
              </div>
            )}

            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div>
                <label className="glass-label">Registered Email</label>
                <input 
                  type="text" 
                  value={currentUser?.email || ''} 
                  disabled 
                  className="glass-input" 
                  style={{ background: 'rgba(138,112,214,0.01)', border: '1px solid #E2E8F0', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                />
              </div>

              <div>
                <label className="glass-label">Full Name</label>
                <input 
                  type="text" 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)} 
                  className="glass-input" 
                  placeholder="Jane Doe"
                />
              </div>

              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="glass-label" style={{ margin: 0 }}>Custom LLM API Key (Optional)</label>
                  <span className="badge badge-purple" style={{ fontSize: '9px', textTransform: 'uppercase' }}>Gemini / OpenAI</span>
                </div>
                <input 
                  type="password" 
                  value={apiKey} 
                  onChange={(e) => setApiKey(e.target.value)} 
                  className="glass-input" 
                  placeholder="Paste your API key here (sk-... or AIzaSy...)"
                />
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: '1.4' }}>
                  💡 Setting a custom API key connects the placement portal directly to dynamic model endpoints instead of using built-in simulated modules. This remains stored securely on your browser context.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: '10px 28px' }}>
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
                <button 
                  type="button" 
                  onClick={handleResetStats} 
                  disabled={saving} 
                  className="btn btn-secondary" 
                  style={{ padding: '10px 24px', borderColor: 'rgba(229, 140, 163, 0.25)', color: 'var(--accent-pink)' }}
                  className="btn-danger-hover btn"
                >
                  Reset Prep Metrics
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* Right Column: User Stats Sheet (Span 4) */}
        <div className="col-span-4">
          <div className="glass-panel" style={{ padding: '24px', background: '#FFFFFF' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '20px', letterSpacing: '0.5px' }}>
              PREPARATORY STATS SUMMARY
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Account Created</span>
                <span style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Resumes Analyzed</span>
                <span className="badge badge-cyan">
                  {userProfile?.resumeStats?.uploadsCount || 0} times
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Interviews Run</span>
                <span className="badge badge-purple">
                  {userProfile?.interviewStats?.completedCount || 0} sessions
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Counselor Chats</span>
                <span className="badge badge-emerald">
                  {userProfile?.counselingSessions || 0} calls
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Questions Solved</span>
                <span className="badge badge-amber">
                  {userProfile?.aptitudeStats?.questionsSolved || 0} MCQs
                </span>
              </div>

            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .btn-danger-hover:hover {
          background: rgba(229, 140, 163, 0.08) !important;
          border-color: var(--accent-pink) !important;
          color: var(--accent-pink) !important;
        }
      `}} />

    </div>
  );
}
