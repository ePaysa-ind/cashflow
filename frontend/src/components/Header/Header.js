/**
 * Header Component
 * 
 * Purpose: Main application header with user menu, navigation, and branding
 * Features: User authentication status, dropdown menu, responsive design
 * 
 * @component
 * @version 1.0.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

/**
 * Main Header Component
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onMenuItemClick - Callback for menu item clicks
 * @param {string} props.activeMenuItem - Currently active menu item
 * @returns {JSX.Element} Header component
 */
const Header = ({ onMenuItemClick, activeMenuItem = 'dashboard' }) => {
  // Hooks
  const navigate = useNavigate();
  const { user, getUserDisplayName, getUserInitials } = useAuth();
  
  // State
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  // Refs
  const userMenuRef = useRef(null);
  
  // Debug logging
  const DEBUG = process.env.NODE_ENV === 'development';
  const debugLog = (action, data) => {
    if (DEBUG) {
      console.log(`[Header] ${action}:`, data);
    }
  };
  
  /**
   * Handle clicks outside user menu to close it
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    
    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  /**
   * Handle user sign out
   */
  const handleSignOut = async () => {
    debugLog('Sign out initiated', { user: user?.email });
    
    try {
      setIsSigningOut(true);
      
      // Sign out from Firebase
      await signOut(auth);
      
      debugLog('Sign out successful', null);
      
      // Clear any local storage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('qash_')) {
          localStorage.removeItem(key);
        }
      });
      
      // Navigate to landing page
      navigate('/');
      
    } catch (error) {
      console.error('[Header] Sign out error:', error);
      alert('Failed to sign out. Please try again.');
    } finally {
      setIsSigningOut(false);
      setShowUserMenu(false);
    }
  };
  
  /**
   * Handle menu item click
   * @param {string} item - Menu item identifier
   */
  const handleMenuClick = (item) => {
    debugLog('Menu item clicked', { item });
    
    // Close user menu
    setShowUserMenu(false);
    
    // Call parent handler if provided
    if (onMenuItemClick) {
      onMenuItemClick(item);
    }
  };
  
  /**
   * Toggle user menu
   */
  const toggleUserMenu = () => {
    setShowUserMenu(prev => !prev);
    debugLog('User menu toggled', { isOpen: !showUserMenu });
  };
  
  return (
    <header className="qash-header">
      <div className="header-container">
        {/* Logo and Brand */}
        <div className="header-brand">
          <div className="logo-wrapper">
            <div className="logo">Q</div>
          </div>
          <h1 className="brand-name">Qash</h1>
        </div>
        
        {/* Navigation */}
        <nav className="header-nav">
          <button
            className={`nav-item ${activeMenuItem === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleMenuClick('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`nav-item ${activeMenuItem === 'documents' ? 'active' : ''}`}
            onClick={() => handleMenuClick('documents')}
          >
            Documents
          </button>
          <button
            className={`nav-item ${activeMenuItem === 'analytics' ? 'active' : ''}`}
            onClick={() => handleMenuClick('analytics')}
          >
            Analytics
          </button>
        </nav>
        
        {/* User Section */}
        {user && (
          <div className="header-user" ref={userMenuRef}>
            <button
              className="user-button"
              onClick={toggleUserMenu}
              aria-expanded={showUserMenu}
              aria-haspopup="true"
              disabled={isSigningOut}
            >
              <div className="user-avatar">
                {getUserInitials()}
              </div>
              <span className="user-name">
                {getUserDisplayName()}
              </span>
              <svg
                className={`menu-arrow ${showUserMenu ? 'open' : ''}`}
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
              >
                <path
                  d="M2.5 4.5L6 8L9.5 4.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            
            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="user-menu">
                <div className="menu-header">
                  <div className="menu-user-info">
                    <div className="menu-user-avatar">
                      {getUserInitials()}
                    </div>
                    <div className="menu-user-details">
                      <div className="menu-user-name">
                        {getUserDisplayName()}
                      </div>
                      <div className="menu-user-email">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="menu-divider" />
                
                <button
                  className="menu-item"
                  onClick={() => handleMenuClick('profile')}
                >
                  <svg className="menu-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M8 8C9.65685 8 11 6.65685 11 5C11 3.34315 9.65685 2 8 2C6.34315 2 5 3.34315 5 5C5 6.65685 6.34315 8 8 8Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 14C2 12.3431 3.34315 11 5 11H11C12.6569 11 14 12.3431 14 14"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Profile
                </button>
                
                <button
                  className="menu-item"
                  onClick={() => handleMenuClick('settings')}
                >
                  <svg className="menu-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12.9 10.1C12.8 10.3 12.8 10.6 12.8 10.9L13.9 11.8C14 11.9 14 12.1 13.9 12.2L12.9 13.8C12.8 13.9 12.6 14 12.5 13.9L11.2 13.4C10.9 13.6 10.6 13.8 10.2 13.9L10 15.3C10 15.4 9.9 15.5 9.7 15.5H7.7C7.6 15.5 7.4 15.4 7.4 15.3L7.2 13.9C6.8 13.8 6.5 13.6 6.2 13.4L4.9 13.9C4.8 14 4.6 13.9 4.5 13.8L3.5 12.2C3.4 12.1 3.4 11.9 3.5 11.8L4.6 10.9C4.6 10.6 4.6 10.3 4.6 10.1C4.6 9.9 4.6 9.6 4.6 9.3L3.5 8.4C3.4 8.3 3.4 8.1 3.5 8L4.5 6.4C4.6 6.3 4.8 6.2 4.9 6.3L6.2 6.8C6.5 6.6 6.8 6.4 7.2 6.3L7.4 4.9C7.4 4.8 7.6 4.7 7.7 4.7H9.7C9.9 4.7 10 4.8 10 4.9L10.2 6.3C10.6 6.4 10.9 6.6 11.2 6.8L12.5 6.3C12.6 6.2 12.8 6.3 12.9 6.4L13.9 8C14 8.1 14 8.3 13.9 8.4L12.8 9.3C12.8 9.6 12.8 9.9 12.9 10.1Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Settings
                </button>
                
                <button
                  className="menu-item"
                  onClick={() => handleMenuClick('help')}
                >
                  <svg className="menu-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle
                      cx="8"
                      cy="8"
                      r="6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M6.06 6C6.24 5.5 6.73 5 7.5 5H8.5C9.33 5 10 5.67 10 6.5C10 7.33 9.33 8 8.5 8H8V9"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="8" cy="11" r="0.5" fill="currentColor" />
                  </svg>
                  Help & Support
                </button>
                
                <div className="menu-divider" />
                
                <button
                  className="menu-item menu-item-danger"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                >
                  <svg className="menu-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M6 2H11C12.1046 2 13 2.89543 13 4V12C13 13.1046 12.1046 14 11 14H6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 8H2M2 8L4 6M2 8L4 10"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {isSigningOut ? 'Signing out...' : 'Sign Out'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;