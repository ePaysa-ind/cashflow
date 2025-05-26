import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();

  // Calculate password strength
  const calculatePasswordStrength = (pwd) => {
    let strength = 0;
    
    // Length check
    if (pwd.length >= 8) strength += 25;
    if (pwd.length >= 12) strength += 25;
    
    // Character variety checks
    if (/[a-z]/.test(pwd)) strength += 12.5; // lowercase
    if (/[A-Z]/.test(pwd)) strength += 12.5; // uppercase
    if (/[0-9]/.test(pwd)) strength += 12.5; // numbers
    if (/[^a-zA-Z0-9]/.test(pwd)) strength += 12.5; // special chars
    
    setPasswordStrength(strength);
    return strength;
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 25) return '#dc2626'; // red
    if (passwordStrength <= 50) return '#f59e0b'; // orange
    if (passwordStrength <= 75) return '#f59e0b'; // orange
    return '#10b981'; // green
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 25) return 'Weak';
    if (passwordStrength <= 50) return 'Fair';
    if (passwordStrength <= 75) return 'Good';
    return 'Strong';
  };

  const handlePasswordChange = (e) => {
    const pwd = e.target.value;
    setPassword(pwd);
    calculatePasswordStrength(pwd);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate full name
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Validate password strength - 8+ chars, alphanumeric
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must contain both letters and numbers.');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Initialize user data in localStorage with free tier settings
      const userId = userCredential.user.uid;
      
      // Generate initials from full name
      const nameParts = fullName.trim().split(' ');
      const initials = nameParts.length >= 2 
        ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
        : fullName.slice(0, 2).toUpperCase();
      
      // Save new profile format for Qash
      const qashProfile = {
        fullName: fullName.trim(),
        email: email,
        company: companyName.trim() || '',
        initials: initials,
        completionPercentage: companyName.trim() ? 20 : 10, // Basic info filled
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(`qash_profile_${userId}`, JSON.stringify(qashProfile));
      
      // Also save legacy format for compatibility
      const userData = {
        tier: 'free',
        uploadsThisMonth: 0,
        lastUploadReset: new Date().toISOString(),
        signupDate: new Date().toISOString(),
        trialStartDate: new Date().toISOString(),
        profile: {
          fullName: fullName.trim(),
          companyName: companyName.trim() || null,
          email: email,
          industry: null,
          zip: null,
          revenue: null,
          employees: null,
          fiscalYear: null,
          profileComplete: false
        },
        nudges: {
          lastShown: null,
          shownToday: false
        }
      };
      localStorage.setItem(`moneylens_user_${userId}`, JSON.stringify(userData));
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Signup error:', error);
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('An account with this email already exists.');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address.');
          break;
        case 'auth/operation-not-allowed':
          setError('Email/password accounts are not enabled.');
          break;
        case 'auth/weak-password':
          setError('Password is too weak. Please use a stronger password.');
          break;
        default:
          setError('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Link 
        to="/" 
        style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          color: 'white',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          opacity: 0.9,
          transition: 'opacity 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.9'}
      >
        ← Back to Home
      </Link>
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">MoneyLens</h1>
          <p className="auth-subtitle">Create your account</p>
          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#eff6ff',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#1e40af',
            border: '1px solid #dbeafe'
          }}>
            🎉 <strong>Free Tier:</strong> 1 document analysis per month
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="fullName" className="form-label">Full Name</label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="form-input"
              placeholder="Enter your full name"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="companyName" className="form-label">Company Name <span style={{ fontSize: '12px', color: '#6b7280' }}>(optional)</span></label>
            <input
              type="text"
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="form-input"
              placeholder="Enter your company name"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={handlePasswordChange}
              required
              className="form-input"
              placeholder="Create a password (8+ chars, letters & numbers)"
              disabled={loading}
            />
            {password && (
              <div style={{ marginTop: '8px' }}>
                {/* Password Strength Bar */}
                <div style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '2px',
                  overflow: 'hidden',
                  marginBottom: '4px'
                }}>
                  <div style={{
                    width: `${passwordStrength}%`,
                    height: '100%',
                    backgroundColor: getPasswordStrengthColor(),
                    transition: 'width 0.3s ease, background-color 0.3s ease'
                  }} />
                </div>
                <p className="form-helper" style={{ 
                  color: getPasswordStrengthColor(),
                  fontSize: '12px',
                  margin: 0
                }}>
                  Password strength: {getPasswordStrengthText()}
                  {passwordStrength < 50 && ' - Add uppercase, numbers, or special characters'}
                </p>
              </div>
            )}
            <p className="form-helper" style={{ marginTop: '4px' }}>At least 8 characters with letters and numbers</p>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="form-input"
              placeholder="Confirm your password"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="error-alert">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-footer">
          <p className="auth-link-text">
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;