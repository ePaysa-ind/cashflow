/**
 * Authentication Context Provider
 * 
 * Purpose: Centralized authentication state management for the entire application
 * Handles: Firebase authentication state, user object, loading states
 * 
 * Usage:
 * 1. Wrap your app with <AuthProvider>
 * 2. Use useAuth() hook in components to access user state
 * 
 * @author Qash Development Team
 * @version 1.0.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

// Create the authentication context
const AuthContext = createContext(null);

/**
 * Custom hook to access authentication context
 * 
 * @returns {Object} Authentication context value containing user, loading, and error states
 * @throws {Error} If used outside of AuthProvider
 * 
 * @example
 * const { user, loading, error } = useAuth();
 * if (loading) return <Spinner />;
 * if (!user) return <Login />;
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  // Ensure hook is used within provider
  if (!context) {
    console.error('[useAuth] Hook called outside of AuthProvider');
    throw new Error('useAuth must be used within an AuthProvider. Make sure your component is wrapped with <AuthProvider>');
  }
  
  return context;
};

/**
 * Authentication Provider Component
 * 
 * Manages Firebase authentication state and provides it to child components
 * Automatically syncs with Firebase auth state changes
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components that need auth access
 */
export const AuthProvider = ({ children }) => {
  // Authentication state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Initially loading while checking auth
  const [error, setError] = useState(null);
  
  // Debug flag for development
  const DEBUG = process.env.NODE_ENV === 'development';
  
  /**
   * Log debug messages in development only
   * @param {string} message - Debug message
   * @param {any} data - Optional data to log
   */
  const debugLog = (message, data = null) => {
    if (DEBUG) {
      console.log(`[AuthContext] ${message}`, data || '');
    }
  };
  
  // Set up Firebase auth state listener
  useEffect(() => {
    debugLog('Initializing auth state listener');
    
    // Clear any previous errors
    setError(null);
    
    try {
      // Subscribe to auth state changes
      const unsubscribe = onAuthStateChanged(
        auth,
        // Success callback
        (currentUser) => {
          if (currentUser) {
            debugLog('User authenticated:', {
              uid: currentUser.uid,
              email: currentUser.email,
              emailVerified: currentUser.emailVerified,
              provider: currentUser.providerData[0]?.providerId
            });
            
            // Update user state with Firebase user object
            setUser(currentUser);
          } else {
            debugLog('No user authenticated');
            setUser(null);
          }
          
          // Authentication check complete
          setLoading(false);
        },
        // Error callback
        (authError) => {
          console.error('[AuthContext] Authentication error:', authError);
          setError({
            code: authError.code,
            message: authError.message,
            timestamp: new Date().toISOString()
          });
          setLoading(false);
        }
      );
      
      // Cleanup function
      return () => {
        debugLog('Cleaning up auth state listener');
        unsubscribe();
      };
      
    } catch (setupError) {
      // Handle any errors during setup
      console.error('[AuthContext] Failed to set up auth listener:', setupError);
      setError({
        code: 'auth/setup-failed',
        message: 'Failed to initialize authentication',
        timestamp: new Date().toISOString()
      });
      setLoading(false);
    }
  }, []); // Empty dependency array - only run once on mount
  
  // Log auth state changes in development
  useEffect(() => {
    if (DEBUG) {
      debugLog('Auth state updated:', {
        isAuthenticated: !!user,
        isLoading: loading,
        hasError: !!error
      });
    }
  }, [user, loading, error, DEBUG]);
  
  // Context value to be provided to children
  const contextValue = {
    // User object from Firebase
    user,
    
    // Loading state - true while checking authentication
    loading,
    
    // Error object if authentication fails
    error,
    
    // Helper methods
    isAuthenticated: !!user,
    
    // Get user display name with fallback (first name only)
    getUserDisplayName: () => {
      if (!user) return 'Guest';
      
      // If user has a display name, get first name only
      if (user.displayName) {
        const firstName = user.displayName.split(' ')[0];
        return firstName || user.displayName;
      }
      
      // Fallback to email username
      return user.email?.split('@')[0] || 'User';
    },
    
    // Get user initials for avatar
    getUserInitials: () => {
      if (!user) return '?';
      
      const name = user.displayName || user.email?.split('@')[0] || '';
      const parts = name.split(' ').filter(Boolean);
      
      if (parts.length === 0) return '?';
      if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
      
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    },
    
    // Check if user email is verified
    isEmailVerified: () => user?.emailVerified || false,
    
    // Get authentication provider
    getAuthProvider: () => {
      if (!user) return null;
      return user.providerData[0]?.providerId || 'unknown';
    }
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Export context for advanced use cases (testing, etc.)
export default AuthContext;