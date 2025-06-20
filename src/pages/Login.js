import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

// Modern color palette matching other pages
const colors = {
  primary: '#4361ee',
  secondary: '#3f37c9',
  success: '#4cc9f0',
  warning: '#f72585',
  info: '#4895ef',
  accent: '#560bad',
  lightBg: '#f8f9fa',
  darkText: '#212529',
  lightBorder: '#e9ecef'
};

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Check if user is already authenticated
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log('User already authenticated, redirecting to dashboard');
        navigate('/dashboard');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    console.log('Attempting login with email:', email);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful:', userCredential.user);
      setLoading(false);
      
      // Explicitly redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: colors.lightBg,
      padding: 20
    }}>
      <div style={{ 
        width: '100%',
        maxWidth: 420,
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        padding: 40,
        overflow: 'hidden'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ 
            fontSize: 28, 
            fontWeight: 700, 
            color: colors.darkText,
            marginBottom: 12 
          }}>
            University Reports
          </h1>
          <p style={{ 
            fontSize: 16, 
            color: '#6c757d',
            marginBottom: 0
          }}>
            Staff Login Portal
          </p>
        </div>

        {error && (
          <div style={{ 
            background: 'rgba(247, 37, 133, 0.1)',
            border: `1px solid ${colors.warning}`,
            borderRadius: 8,
            padding: '14px 16px',
            fontSize: 14,
            color: colors.warning,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ 
              display: 'block', 
              marginBottom: 8, 
              fontSize: 14, 
              fontWeight: 600,
              color: colors.darkText
            }}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="email@university.edu"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ 
                width: '100%', 
                padding: '12px 16px',
                borderRadius: 8,
                border: `1px solid ${colors.lightBorder}`,
                fontSize: 15,
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ 
              display: 'block', 
              marginBottom: 8, 
              fontSize: 14, 
              fontWeight: 600,
              color: colors.darkText
            }}>
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ 
                width: '100%', 
                padding: '12px 16px',
                borderRadius: 8,
                border: `1px solid ${colors.lightBorder}`,
                fontSize: 15,
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
              }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            style={{ 
              width: '100%', 
              padding: '14px',
              borderRadius: 8,
              border: 'none',
              background: colors.primary,
              color: '#fff',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.8 : 1,
              boxShadow: '0 4px 12px rgba(67, 97, 238, 0.2)',
              transition: 'all 0.2s',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: 15
            }}
          >
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ 
                  width: 20,
                  height: 20,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <span>Authenticating...</span>
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: '#6c757d' }}>
          <p>Authorized personnel only. This system is for university staff to manage facility reports.</p>
        </div>

        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default Login;