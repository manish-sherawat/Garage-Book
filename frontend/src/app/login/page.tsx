'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Car, Lock, Mail, ChevronRight, Loader2, Sparkles, LayoutDashboard, Settings, Wrench, Quote } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const savedEmail = localStorage.getItem('garagebook_remember_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let apiUrl = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://garagebook-new.vercel.app/api/v1' : 'http://localhost:5000/api/v1');
      if (apiUrl && !apiUrl.endsWith('/api/v1')) {
        apiUrl = `${apiUrl.replace(/\/$/, '')}/api/v1`;
      }
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.access_token) {
        localStorage.setItem('garagebook_token', data.access_token);
        if (rememberMe) {
          localStorage.setItem('garagebook_remember_email', email);
        } else {
          localStorage.removeItem('garagebook_remember_email');
        }
        window.location.href = '/'; 
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('Network error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#09090b',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Left Panel - Branding & Marketing */}
      <div className="login-left-panel" style={{
        flex: 1,
        position: 'relative',
        display: 'none',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '60px',
        overflow: 'hidden',
        color: 'white',
      }}>
        {/* Background Image with Gradient Overlay */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: 'url(/bg-login.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 0
        }}></div>
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 58, 138, 0.8) 100%)',
          zIndex: 1
        }}></div>

        {/* Content Top */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(37, 99, 235, 0.3)'
            }}>
              <Car size={26} color="white" />
            </div>
            <h2 style={{ 
              fontSize: '28px', 
              fontWeight: '900', 
              fontFamily: '"Outfit", "Inter", sans-serif',
              letterSpacing: '-0.04em', 
              margin: 0,
              background: 'linear-gradient(to right, #ffffff, #93c5fd)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              GarageBook <span style={{ color: '#3b82f6', WebkitTextFillColor: 'initial' }}>Pro</span>
            </h2>
          </div>

          <h1 style={{ 
            fontSize: '64px', 
            fontWeight: '900', 
            fontFamily: '"Outfit", "Space Grotesk", sans-serif',
            lineHeight: 1.05, 
            letterSpacing: '-0.03em',
            marginBottom: '24px',
            maxWidth: '540px',
            color: '#f8fafc',
            textShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            Manage your workshop with <span style={{ color: '#60a5fa', fontStyle: 'italic' }}>precision.</span>
          </h1>
          <p style={{ 
            fontSize: '20px', 
            color: '#e2e8f0', 
            lineHeight: 1.6, 
            maxWidth: '460px',
            marginBottom: '40px',
            fontWeight: '400'
          }}>
            The all-in-one enterprise operating system for modern auto repair shops and service centers.
          </p>

        </div>

        {/* Content Bottom (Trust Badges / Stats) */}
        <div style={{ position: 'relative', zIndex: 2, marginTop: 'auto' }}>
          <div style={{ 
            display: 'flex', 
            gap: '24px',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.4)', 
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '16px 24px', 
            borderRadius: '16px',
            maxWidth: 'fit-content'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '20px', fontWeight: '800', color: 'white' }}>500+</span>
              <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Workshops</span>
            </div>
            <div style={{ width: '1px', height: '30px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '20px', fontWeight: '800', color: 'white' }}>99.9%</span>
              <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Uptime</span>
            </div>
            <div style={{ width: '1px', height: '30px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '20px', fontWeight: '800', color: 'white' }}>24/7</span>
              <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px 24px',
        backgroundColor: '#09090b',
        position: 'relative'
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          
          <div style={{ marginBottom: '40px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '42px', fontWeight: '900', fontFamily: '"Outfit", sans-serif', color: 'white', marginBottom: '8px', letterSpacing: '-0.03em' }}>
              Welcome back
            </h2>
            <p style={{ fontSize: '16px', color: '#a1a1aa' }}>
              Sign in to your GarageBook Pro dashboard
            </p>
          </div>

          {error && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#fca5a5',
              padding: '14px 16px',
              borderRadius: '12px',
              marginBottom: '24px',
              fontSize: '14px',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Sparkles size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ width: '100%' }}>
            
            {/* Email Field */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#a1a1aa', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#71717a', pointerEvents: 'none' }}>
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '16px 16px 16px 46px',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    color: 'white',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  placeholder="name@company.com"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#8b5cf6';
                    e.target.style.backgroundColor = 'rgba(139, 92, 246, 0.05)';
                    e.target.style.boxShadow = '0 0 0 4px rgba(139, 92, 246, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>
            
            {/* Password Field */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Password
                </label>
                <a href="#" style={{ fontSize: '13px', fontWeight: '500', color: '#a855f7', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#c084fc'} onMouseOut={(e) => e.currentTarget.style.color = '#a855f7'}>
                  Forgot Password?
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#71717a', pointerEvents: 'none' }}>
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '16px 16px 16px 46px',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    color: 'white',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  placeholder="••••••••"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#8b5cf6';
                    e.target.style.backgroundColor = 'rgba(139, 92, 246, 0.05)';
                    e.target.style.boxShadow = '0 0 0 4px rgba(139, 92, 246, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Remember Me */}
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '32px', cursor: 'pointer', userSelect: 'none', width: 'max-content' }}>
              <div style={{
                width: '20px', height: '20px', borderRadius: '6px', 
                border: rememberMe ? 'none' : '2px solid rgba(255,255,255,0.2)', 
                background: rememberMe ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px',
                transition: 'all 0.2s'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: rememberMe ? 1 : 0, transition: 'opacity 0.2s' }}>
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ display: 'none' }}
              />
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#a1a1aa' }}>Remember me for 30 days</span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="login-submit-btn"
              style={{
                width: '100%',
                background: isLoading ? 'rgba(255,255,255,0.05)' : 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)',
                color: isLoading ? '#71717a' : 'white',
                padding: '16px',
                borderRadius: '16px',
                border: 'none',
                fontSize: '16px',
                fontWeight: '700',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: isLoading ? 'none' : '0 10px 30px -5px rgba(139, 92, 246, 0.5)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In
                  <ChevronRight size={18} />
                </>
              )}
            </button>
            
          </form>

          {/* Social Logins */}
          <div style={{ marginTop: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#27272a' }}></div>
              <span style={{ padding: '0 12px', color: '#71717a', fontSize: '13px', fontWeight: '500' }}>Or continue with</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#27272a' }}></div>
            </div>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              <button style={{
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid #27272a',
                backgroundColor: '#18181b',
                color: '#e4e4e7',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#27272a'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#18181b'}
              onClick={(e) => { e.preventDefault(); alert('Social login not configured yet.'); }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
              
              <button style={{
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid #27272a',
                backgroundColor: '#18181b',
                color: '#e4e4e7',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#27272a'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#18181b'}
              onClick={(e) => { e.preventDefault(); alert('Social login not configured yet.'); }}
              >
                <svg width="18" height="18" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 0H0V10H10V0Z" fill="#F25022"/>
                  <path d="M21 0H11V10H21V0Z" fill="#7FBA00"/>
                  <path d="M10 11H0V21H10V11Z" fill="#00A4EF"/>
                  <path d="M21 11H11V21H21V11Z" fill="#FFB900"/>
                </svg>
                Microsoft
              </button>
            </div>
          </div>

        </div>
        
        {/* Footer */}
        <div style={{ position: 'absolute', bottom: '24px', textAlign: 'center', width: '100%' }}>
          <p style={{ fontSize: '12px', color: '#52525b', margin: 0 }}>
            © 2026 GarageBook Pro. All rights reserved.
          </p>
        </div>
      </div>

      <style>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @media (min-width: 1024px) {
          .login-left-panel {
            display: flex !important;
          }
        }
        
        .login-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 14px 28px -5px rgba(37, 99, 235, 0.5) !important;
        }
        .login-submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
