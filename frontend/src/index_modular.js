/**
 * Application Entry Point (Refactored)
 * 
 * Purpose: Root component setup with providers and routing
 * Features: Authentication provider, routing, error boundaries
 * 
 * @version 3.1.0
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Providers
import { AuthProvider } from './context/AuthContext';

// Components
import App from './App_new'; // Using the new refactored App
import Landing from './components/Landing';
import ProtectedRoute from './components/ProtectedRoute';

// Styles
import './index.css';

// Performance monitoring
import reportWebVitals from './reportWebVitals';

/**
 * Error Boundary Component
 * Catches and displays errors gracefully
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught:', error, errorInfo);
    }
    
    // TODO: Log to error reporting service (Sentry, etc.)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h1 style={{ color: '#dc2626', marginBottom: '16px' }}>
            Oops! Something went wrong
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            We're sorry for the inconvenience. Please refresh the page to try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: '24px', textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', color: '#6b7280' }}>
                Error Details (Development Only)
              </summary>
              <pre style={{
                marginTop: '8px',
                padding: '12px',
                backgroundColor: '#f3f4f6',
                borderRadius: '4px',
                fontSize: '12px',
                overflow: 'auto'
              }}>
                {this.state.error?.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Root App Component
 * Wraps the entire application with necessary providers
 */
const RootApp = () => {
  // Log environment info in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[App] Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      API_URL: process.env.REACT_APP_API_URL,
      FIREBASE_PROJECT: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      BUILD_TIME: new Date().toISOString()
    });
  }

  return (
    <React.StrictMode>
      <ErrorBoundary>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Redirect old auth routes to landing page */}
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/signup" element={<Navigate to="/" replace />} />
              
              {/* Protected dashboard route */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <App />
                  </ProtectedRoute>
                } 
              />
              
              {/* Landing page with integrated auth */}
              <Route path="/" element={<Landing />} />
              
              {/* 404 - Redirect to landing */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
};

// Get root element
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element. Make sure public/index.html has a div with id="root"');
}

// Create root and render
const root = ReactDOM.createRoot(rootElement);
root.render(<RootApp />);

// Performance monitoring
if (process.env.NODE_ENV === 'development') {
  reportWebVitals(console.log);
} else {
  // In production, send to analytics endpoint
  reportWebVitals((metric) => {
    // TODO: Send to your analytics service
    // Example: window.gtag('event', metric.name, { value: metric.value });
  });
}

// Service Worker registration (if needed)
// import * as serviceWorkerRegistration from './serviceWorkerRegistration';
// serviceWorkerRegistration.register();