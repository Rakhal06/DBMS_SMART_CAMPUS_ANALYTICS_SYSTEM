// Login.jsx  —  Drop into src/
// SmartCampus Authentication Page

import React, { useState } from 'react';
import { Zap, Eye, EyeOff, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';

const API = 'http://127.0.0.1:8000/api';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Wrong username or password');
        return;
      }
      // Save token + user info
      localStorage.setItem('sc_token',    data.token);
      localStorage.setItem('sc_user',     JSON.stringify({
        username:   data.username,
        full_name:  data.full_name,
        role:       data.role,
        can_insert: data.can_insert,
      }));
      onLogin(data);
    } catch {
      setError('Cannot reach server — make sure backend is running on port 8000');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#020B18',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'DM Sans','Inter',system-ui,sans-serif",
      padding: 20,
    }}>

      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 300, borderRadius: '50%',
        background: 'radial-gradient(ellipse, #3B82F615 0%, transparent 70%)',
        pointerEvents: 'none',
      }}/>

      <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 32px #3B82F640',
          }}>
            <Zap size={26} color="#fff" fill="#fff"/>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#F1F5F9', margin: 0 }}>
            SmartCampus
          </h1>
          <p style={{ fontSize: 12, color: '#334155', marginTop: 6, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            IIIT Dharwad · DA264 · Authorized Access Only
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#0A1628',
          border: '1px solid #1E293B',
          borderRadius: 20,
          padding: 32,
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#F1F5F9',
            margin: '0 0 6px' }}>Sign In</h2>
          <p style={{ fontSize: 12, color: '#475569', margin: '0 0 24px', fontWeight: 600 }}>
            Enter your credentials to access the dashboard
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Username */}
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700,
                color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em',
                marginBottom: 6 }}>Username</label>
              <div style={{ position: 'relative' }}>
                <User size={14} style={{ position: 'absolute', left: 12, top: '50%',
                  transform: 'translateY(-50%)', color: '#334155' }}/>
                <input
                  type="text"
                  value={username}
                  onChange={e => { setUsername(e.target.value); setError(''); }}
                  placeholder="Enter username"
                  autoComplete="username"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: '#060F1C', border: `1px solid ${error ? '#F43F5E40' : '#1E293B'}`,
                    borderRadius: 10, padding: '11px 12px 11px 36px',
                    color: '#E2E8F0', fontSize: 13, fontWeight: 600, outline: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#3B82F6'}
                  onBlur={e  => e.target.style.borderColor = error ? '#F43F5E40' : '#1E293B'}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700,
                color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em',
                marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%',
                  transform: 'translateY(-50%)', color: '#334155' }}/>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: '#060F1C', border: `1px solid ${error ? '#F43F5E40' : '#1E293B'}`,
                    borderRadius: 10, padding: '11px 40px 11px 36px',
                    color: '#E2E8F0', fontSize: 13, fontWeight: 600, outline: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#3B82F6'}
                  onBlur={e  => e.target.style.borderColor = error ? '#F43F5E40' : '#1E293B'}
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)', background: 'none', border: 'none',
                    color: '#334155', cursor: 'pointer', padding: 0, display: 'flex' }}>
                  {showPass ? <EyeOff size={14}/> : <Eye size={14}/>}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 12px', borderRadius: 10,
                background: '#F43F5E10', border: '1px solid #F43F5E25',
              }}>
                <AlertCircle size={13} style={{ color: '#F43F5E', flexShrink: 0 }}/>
                <span style={{ fontSize: 12, color: '#F43F5E', fontWeight: 600 }}>{error}</span>
              </div>
            )}

            {/* Submit button */}
            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '13px', borderRadius: 12, border: 'none',
                background: loading ? '#1E293B' : 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                color: loading ? '#475569' : '#fff',
                fontSize: 13, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.15s', marginTop: 4,
                boxShadow: loading ? 'none' : '0 4px 16px #3B82F640',
              }}>
              {loading ? (
                <>
                  <div style={{ width: 14, height: 14, borderRadius: '50%',
                    border: '2px solid #475569', borderTopColor: '#94A3B8',
                    animation: 'spin 0.8s linear infinite' }}/>
                  Signing in...
                </>
              ) : (
                <>
                  <Lock size={14}/>
                  Sign In to SmartCampus
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <p style={{ fontSize: 10, color: '#1E293B', fontWeight: 700 }}>
            🔒 Authorized personnel only · IIIT Dharwad
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        input::placeholder { color: #334155; }
      `}</style>
    </div>
  );
}