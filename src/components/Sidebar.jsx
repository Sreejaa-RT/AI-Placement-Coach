import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      )
    },
    {
      name: 'Resume Analyzer',
      path: '/resume',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      )
    },
    {
      name: 'Mock Interview',
      path: '/interview',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
        </svg>
      )
    },
    {
      name: 'Aptitude Prep',
      path: '/aptitude',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-16.25a8.966 8.966 0 016-2.25c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-16.25v14.25" />
        </svg>
      )
    },
    {
      name: 'AI Counselor',
      path: '/counselor',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-1.074-.765 7.99 7.99 0 001.258-3.807A8.967 8.967 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
      )
    },
    {
      name: 'Profile & Settings',
      path: '/profile',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      )
    }
  ];

  return (
    <aside className="glass-panel" style={{
      width: '280px',
      height: 'calc(100vh - 40px)',
      position: 'sticky',
      top: '20px',
      left: '20px',
      margin: '20px 0 20px 20px',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px',
      zIndex: 100,
      background: '#FFFFFF',
      border: '1px solid var(--border-glass)'
    }}>
      {/* Brand Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        marginBottom: '20px',
        padding: '0 8px'
      }}>
        <div style={{
          width: '46px',
          height: '46px',
          borderRadius: '12px',
          background: 'var(--grad-cyan-blue)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 10px rgba(0, 89, 71, 0.2)'
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="#FFFFFF" width="26" height="26">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A5.905 5.905 0 018 3.443m4.26 6.704L12 3m0 17.904V12M12 3a49.093 49.093 0 018.232 4.41m0 0a50.58 50.58 0 012.658.813 5.906 5.906 0 01-11.758 3.125v-3.147m0 0L12 3" />
          </svg>
        </div>
        <div>
          <h1 style={{
            fontSize: '20px',
            fontWeight: '900',
            letterSpacing: '0.5px',
            lineHeight: '1.1'
          }}>
            <span className="text-gradient-cyan-blue">PREP</span> AI
          </h1>
          <span style={{ fontSize: '8.5px', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.2px' }}>PREPARE SMARTER. GET HIRED.</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{
        height: '1px',
        background: 'var(--border-glass)',
        margin: '0 -8px 24px -8px'
      }} />

      {/* User Info Quick view */}
      {userProfile && (
        <div className="glass-panel" style={{
          padding: '14px',
          marginBottom: '28px',
          background: 'rgba(138, 112, 214, 0.02)',
          border: '1px solid rgba(138, 112, 214, 0.05)',
          borderRadius: '12px',
          boxShadow: 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'var(--grad-purple-pink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '14px',
              color: '#FFFFFF'
            }}>
              {userProfile.displayName ? userProfile.displayName[0].toUpperCase() : 'U'}
            </div>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{userProfile.displayName}</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ready for hires</p>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Prep Index</span>
            <span className="badge badge-cyan" style={{ fontSize: '10px', padding: '2px 8px' }}>
              {userProfile.readinessScore || 0}%
            </span>
          </div>
          {/* Progress bar background */}
          <div style={{
            width: '100%',
            height: '4px',
            background: 'rgba(138, 112, 214, 0.08)',
            borderRadius: '2px',
            marginTop: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${userProfile.readinessScore || 0}%`,
              height: '100%',
              background: 'var(--grad-cyan-blue)',
              transition: 'width var(--transition-slow)'
            }} />
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: '8px',
              color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              background: isActive ? 'rgba(138, 112, 214, 0.06)' : 'transparent',
              border: '1px solid',
              borderColor: isActive ? 'rgba(138, 112, 214, 0.15)' : 'transparent',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all var(--transition-fast)'
            })}
            className={({ isActive }) => isActive ? 'nav-active' : 'nav-inactive'}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout button */}
      <button 
        onClick={handleLogout}
        className="btn-text"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 14px',
          width: '100%',
          justifyContent: 'flex-start',
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: '14px',
          color: 'var(--text-muted)'
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
        </svg>
        <span>Sign Out</span>
      </button>

      {/* Embedded NavHover CSS rules to make hover state look gorgeous */}
      <style dangerouslySetInnerHTML={{__html: `
        .nav-inactive:hover {
          color: var(--accent-cyan) !important;
          background: rgba(138, 112, 214, 0.03) !important;
          transform: translateX(4px);
        }
        .nav-active {
          box-shadow: 0 4px 12px rgba(138, 112, 214, 0.05);
        }
      `}} />
    </aside>
  );
}
