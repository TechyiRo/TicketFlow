import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import Space3DBackground from '../components/shared/Space3DBackground';
import { Shield, Zap, Ticket as TicketIcon } from 'lucide-react';

export function AuthPage() {
  const { user, login, registerUser } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleAuthSubmit = async (type, ...args) => {
    if (type === 'login') {
      await login(args[0], args[1]); // username, password
    } else if (type === 'registerUser') {
      await registerUser(...args);
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100dvh',
      display: 'flex',
      overflow: 'hidden',
      position: 'relative',
      background: '#020308',
      fontFamily: '"Inter", sans-serif',
      color: '#fff',
    }}>
      {/* 3D Wireframe Globe and Twinkling Particle Starfield */}
      <Space3DBackground globePosition={isLogin ? 'right-side' : 'center'} />

      {/* Interactive Scanlines overlay for Sci-Fi screen effect */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)',
        backgroundSize: '100% 4px',
        zIndex: 1,
        pointerEvents: 'none',
        opacity: 0.45,
      }} />

      {/* Main Container */}
      <div style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        position: 'relative',
        zIndex: 2,
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        {/* Registration View */}
        {!isLogin && (
          <div style={{
            width: '100%',
            maxWidth: '650px',
            background: 'rgba(5, 8, 22, 0.72)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            borderRadius: '24px',
            border: '1px solid rgba(0, 229, 255, 0.18)',
            boxShadow: '0 0 50px rgba(0, 229, 255, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            transform: mounted ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(15px)',
            opacity: mounted ? 1 : 0,
            transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            overflow: 'hidden',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Header Glowing Line */}
            <div style={{
              height: '3px',
              background: 'linear-gradient(90deg, #00E5FF, #7B2FFF)',
            }} />
            
            <div style={{
              padding: '28px 36px 14px',
              borderBottom: '1px solid rgba(0, 229, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Shield style={{ width: 14, height: 14, color: '#00E5FF' }} />
                  <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.15em', color: '#00E5FF', textTransform: 'uppercase' }}>
                    Registration Console
                  </span>
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                  Create Client Account
                </h2>
              </div>
            </div>

            <div style={{ padding: '24px 36px 32px', overflowY: 'auto', flex: 1 }}>
              <RegisterForm
                activeRole="user"
                onToggleForm={() => setIsLogin(true)}
                onSubmitSuccess={handleAuthSubmit}
              />
            </div>
          </div>
        )}

        {/* Unified Login View */}
        {isLogin && (
          <div style={{
            width: '100%',
            maxWidth: '430px',
            background: 'rgba(5, 8, 22, 0.72)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            borderRadius: '24px',
            border: '1px solid rgba(0, 229, 255, 0.18)',
            boxShadow: '0 0 50px rgba(0, 229, 255, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            transform: mounted ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(15px)',
            opacity: mounted ? 1 : 0,
            transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            overflow: 'hidden',
          }}>
            {/* Header Glowing Line */}
            <div style={{
              height: '3px',
              background: 'linear-gradient(90deg, #00E5FF, #7B2FFF)',
            }} />

            <div style={{ padding: '36px 40px' }}>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(0,229,255,0.1) 0%, rgba(123,47,255,0.1) 100%)',
                  border: '1px solid rgba(0, 229, 255, 0.3)',
                  marginBottom: '16px',
                  boxShadow: '0 0 15px rgba(0, 229, 255, 0.25)',
                }}>
                  <TicketIcon style={{ width: 22, height: 22, color: '#00E5FF' }} />
                </div>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: 900,
                  margin: 0,
                  letterSpacing: '-0.03em',
                  background: 'linear-gradient(135deg, #fff 40%, rgba(0,229,255,0.7) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  TicketFlow Command
                </h2>
                <p style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.65)', marginTop: '6px' }}>
                  Secure role-based support console login
                </p>
              </div>

              <LoginForm
                onToggleForm={() => setIsLogin(false)}
                onSubmitSuccess={handleAuthSubmit}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthPage;
