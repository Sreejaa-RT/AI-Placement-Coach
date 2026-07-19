import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'var(--bg-dark)',
        color: 'var(--text-primary)',
        gap: '20px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '3px solid rgba(138, 112, 214, 0.1)',
          borderTop: '3px solid var(--accent-cyan)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{
          fontFamily: 'Outfit, sans-serif',
          fontSize: '16px',
          color: 'var(--text-secondary)',
          letterSpacing: '0.05em',
          fontWeight: '500'
        }}>Loading Coach Space...</p>
        
        {/* Inline keyframe injection for spin */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />; // REDIRECT TO LOGIN ROUTE DIRECTLY
  }

  return children;
}
