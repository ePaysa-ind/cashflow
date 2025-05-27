import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

function Landing() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if user is already authenticated
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/dashboard');
      } else {
        setCheckingAuth(false);
      }
    });

    return unsubscribe;
  }, [navigate]);

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid #e5e7eb',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            margin: '0 auto 16px',
            animation: 'spin 0.8s linear infinite'
          }} />
          <p style={{ color: '#6b7280' }}>Loading...</p>
        </div>
      </div>
    );
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (error) {
      // User-friendly error messages
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email. Please sign up.');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Extract initials from full name
      const nameParts = fullName.trim().split(' ');
      const initials = nameParts.length >= 2 
        ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
        : fullName.slice(0, 2).toUpperCase();
      
      // Store user profile in localStorage
      const userProfile = {
        fullName: fullName,
        email: email,
        initials: initials,
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem(`qash_profile_${user.uid}`, JSON.stringify(userProfile));
      
      navigate('/dashboard');
    } catch (error) {
      // User-friendly error messages
      if (error.code === 'auth/email-already-in-use') {
        setError('User exists, please login.');
      } else if (error.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError('Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // SVG Icons
  const icons = {
    money: (color = '#3b82f6') => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2V22" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    chart: (color = '#10b981') => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 20V10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 20V4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6 20V14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    shield: (color = '#8b5cf6') => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22S20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    target: (color = '#f59e0b') => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="12" r="6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="12" r="2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      
      {/* Fixed Header */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '16px 24px',
        zIndex: 1000
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {icons.money()}
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: '700', 
            color: '#1f2937',
            margin: 0 
          }}>
            Qash
          </h1>
        </div>
      </header>

      {/* Main Content - Split Layout */}
      <div style={{ flex: 1, display: 'flex', paddingTop: '60px' }}>
        {/* Left Side - Features */}
        <div style={{
          flex: 1,
          backgroundColor: '#f8fafc',
          padding: '48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          borderRight: '1px solid #e5e7eb'
        }}>
          <div style={{ maxWidth: '500px' }}>
            <h2 style={{
              fontSize: '48px',
              fontWeight: '800',
              color: '#1f2937',
              marginBottom: '24px',
              lineHeight: '1.1'
            }}>
              CFO-Level Financial Intelligence
            </h2>
            <p style={{
              fontSize: '20px',
              color: '#6b7280',
              marginBottom: '48px',
              lineHeight: '1.5'
            }}>
              Upload financial documents and get instant executive insights powered by AI.
            </p>

            {/* Feature Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flexShrink: 0 }}>{icons.money('#3b82f6')}</div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                    Cash Flow Analysis
                  </h4>
                  <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                    Real-time liquidity tracking
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flexShrink: 0 }}>{icons.chart('#10b981')}</div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                    Revenue Analytics
                  </h4>
                  <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                    Growth trends & margins
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flexShrink: 0 }}>{icons.shield('#8b5cf6')}</div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                    Risk Assessment
                  </h4>
                  <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                    Early warning system
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flexShrink: 0 }}>{icons.target('#f59e0b')}</div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                    Strategic Insights
                  </h4>
                  <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                    Actionable recommendations
                  </p>
                </div>
              </div>
            </div>

            {/* Trust Badge */}
            <div style={{
              marginTop: '48px',
              padding: '16px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              {icons.shield('#10b981')}
              <div>
                <div style={{ fontWeight: '600', color: '#166534' }}>Enterprise Security</div>
                <div style={{ fontSize: '14px', color: '#15803d' }}>
                  Your documents can be processed locally - never leaving your device
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Forms */}
        <div style={{
          width: '480px',
          backgroundColor: 'white',
          padding: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ width: '100%', maxWidth: '360px' }}>
            {/* Tab Switcher */}
            <div style={{
              display: 'flex',
              backgroundColor: '#f3f4f6',
              padding: '4px',
              borderRadius: '8px',
              marginBottom: '32px'
            }}>
              <button
                onClick={() => setActiveTab('login')}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: activeTab === 'login' ? 'white' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: activeTab === 'login' ? '#1f2937' : '#6b7280',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: activeTab === 'login' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                Log In
              </button>
              <button
                onClick={() => setActiveTab('signup')}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: activeTab === 'signup' ? 'white' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: activeTab === 'signup' ? '#1f2937' : '#6b7280',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: activeTab === 'signup' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                Sign Up
              </button>
            </div>

            <h3 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '8px'
            }}>
              {activeTab === 'login' ? 'Welcome back' : 'Get started'}
            </h3>
            <p style={{
              color: '#6b7280',
              marginBottom: '32px'
            }}>
              {activeTab === 'login' 
                ? 'Enter your credentials to access your dashboard' 
                : 'Create an account to start analyzing documents'}
            </p>

            {/* Form */}
            <form onSubmit={activeTab === 'login' ? handleLogin : handleSignup}>
              {/* Full Name field - only show for signup */}
              {activeTab === 'signup' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="John Doe"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>
              )}
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>

              {error && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  color: '#dc2626',
                  fontSize: '14px',
                  marginBottom: '16px'
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: loading ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#2563eb')}
                onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#3b82f6')}
              >
                {loading ? 'Processing...' : (activeTab === 'login' ? 'Log In' : 'Sign Up')}
              </button>
            </form>

            {/* Alternative Actions */}
            <div style={{
              marginTop: '32px',
              paddingTop: '32px',
              borderTop: '1px solid #e5e7eb',
              textAlign: 'center'
            }}>
              <p style={{
                color: '#6b7280',
                fontSize: '14px'
              }}>
                {activeTab === 'login' 
                  ? "Don't have an account? " 
                  : "Already have an account? "}
                <button
                  onClick={() => setActiveTab(activeTab === 'login' ? 'signup' : 'login')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#3b82f6',
                    fontWeight: '500',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  {activeTab === 'login' ? 'Sign up' : 'Log in'}
                </button>
              </p>
            </div>

            {/* Demo Account */}
            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#eff6ff',
              borderRadius: '6px',
              fontSize: '13px',
              textAlign: 'center',
              color: '#1e40af'
            }}>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Landing;