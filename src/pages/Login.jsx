import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, signup, loginWithGoogle, resetPassword } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  
  const navigate = useNavigate();

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (!email || !password) {
      return setError('Please fill in all fields.');
    }
    
    if (isSignUp && !displayName) {
      return setError('Please enter your full name.');
    }

    try {
      setLoading(true);
      if (isSignUp) {
        await signup(email, password, displayName);
      } else {
        await login(email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email address is already in use.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message || 'An error occurred during authentication.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setMessage('');
    try {
      setLoading(true);
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to authenticate with Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      return setError('Please enter your email to reset password.');
    }
    setError('');
    setMessage('');
    try {
      setLoading(true);
      await resetPassword(email);
      setMessage('Password reset email sent! Check your inbox.');
      setShowForgot(false);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      background: 'var(--bg-dark)'
    }} className="animate-fade-in">
      
      <div style={{
        width: '100%',
        maxWidth: '450px',
        background: '#FFFFFF',
        border: '1px solid var(--border-glass-hover)',
        borderRadius: '16px',
        boxShadow: 'var(--shadow-glass)',
        padding: '36px'
      }}>
        
        {/* Header Back Button */}
        <button 
          onClick={() => navigate('/')} 
          className="btn-text" 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            marginBottom: '24px',
            padding: 0
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" width="14" height="14">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Home
        </button>

        {showForgot ? (
          /* Forgot Password card */
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Reset Password
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginBottom: '24px', lineHeight: '1.5' }}>
              Enter your email address and we'll send you a link to reset your account password.
            </p>

            {error && (
              <div className="badge badge-rose" style={{ display: 'block', width: '100%', padding: '10px 14px', borderRadius: '8px', fontSize: '12.5px', marginBottom: '20px', textTransform: 'none', letterSpacing: 'normal' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label className="glass-label">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu" 
                  className="glass-input"
                />
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
                {loading ? 'Sending Request...' : 'Send Reset Link'}
              </button>

              <button 
                type="button" 
                onClick={() => { setShowForgot(false); setError(''); }}
                className="btn btn-text" 
                style={{ width: '100%', fontSize: '13px' }}
              >
                Cancel and Log In
              </button>
            </form>
          </div>
        ) : (
          /* Main Login / Register card */
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginBottom: '24px' }}>
              {isSignUp ? 'Sign up to configure your placement dashboard' : 'Sign in to access your coach space'}
            </p>

            {/* Error & Success States */}
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

            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {isSignUp && (
                <div>
                  <label className="glass-label">Full Name</label>
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Jane Doe" 
                    className="glass-input"
                  />
                </div>
              )}

              <div>
                <label className="glass-label">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane.doe@university.edu" 
                  className="glass-input"
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="glass-label" style={{ margin: 0 }}>Password</label>
                  {!isSignUp && (
                    <button 
                      type="button" 
                      onClick={() => { setShowForgot(true); setError(''); }}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '500' }}
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="glass-input"
                />
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                {loading ? 'Processing...' : (isSignUp ? 'Create Free Account' : 'Sign In')}
              </button>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                margin: '12px 0'
              }}>
                <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>OR</span>
                <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
              </div>

              {/* Google login pop trigger */}
              <button 
                type="button" 
                onClick={handleGoogleSignIn} 
                disabled={loading}
                className="btn btn-secondary" 
                style={{ width: '100%', display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                  <path d="M3.964 10.707a5.416 5.416 0 01-.282-1.707c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.32 0 2.507.454 3.44 1.348l2.582-2.582C13.463.896 11.426 0 9 0 5.4 0 2.349 2.066.957 4.96l3.007 2.332C4.672 5.164 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                <span>Continue with Google</span>
              </button>
            </form>

            {/* Toggle form option */}
            <p style={{
              textAlign: 'center',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              marginTop: '24px'
            }}>
              {isSignUp ? 'Already have an account?' : "Don't have an account yet?"}{' '}
              <button 
                type="button" 
                onClick={() => { setIsSignUp(!isSignUp); setError(''); setDisplayName(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-cyan)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  padding: 0
                }}
              >
                {isSignUp ? 'Sign In' : 'Sign Up Free'}
              </button>
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
