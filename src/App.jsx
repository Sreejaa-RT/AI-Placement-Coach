import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Resume from './pages/Resume';
import Interview from './pages/Interview';
import Aptitude from './pages/Aptitude';
import Counselor from './pages/Counselor';
import Profile from './pages/Profile';

// Layout for authorized panels (injects the sidebar alongside subpages)
function MainLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#005947' }}>
      <Sidebar />
      <main style={{
        flexGrow: 1,
        padding: '20px 24px 20px 20px',
        overflowY: 'auto',
        minWidth: 0,
        height: '100vh',
        boxSizing: 'border-box'
      }}>
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          minHeight: 'calc(100vh - 40px)',
          boxSizing: 'border-box',
          boxShadow: 'var(--shadow-glass)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <Outlet />
        </div>
      </main>
      
      {/* Mobile sidebar adjust */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          div[style*="display: flex"] {
            flex-direction: column !important;
          }
          main {
            padding: 16px !important;
            height: auto !important;
          }
        }
      `}} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Portal Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          {/* Shielded Sub-Routes with layout structure */}
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/resume" element={<Resume />} />
            <Route path="/interview" element={<Interview />} />
            <Route path="/aptitude" element={<Aptitude />} />
            <Route path="/counselor" element={<Counselor />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
