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
import QashLogo from '../QashLogo';
import './Header.css';

/**
 * Main Header Component
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onMenuItemClick - Callback for menu item clicks
 * @param {string} props.activeMenuItem - Currently active menu item
 * @returns {JSX.Element} Header component
 */
const Header = ({ 
  onMenuItemClick, 
  activeMenuItem = 'dashboard',
  showMenu,
  setShowMenu,
  trialDaysRemaining = 0,
  uploadsThisMonth = 0,
  profileCompletion = 0,
  showAutoSaveIndicator = false
}) => {
  // Hooks
  const navigate = useNavigate();
  const { user, getUserDisplayName, getUserInitials } = useAuth();
  
  // State
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  // Refs
  const userMenuRef = useRef(null);
  const menuRef = useRef(null);
  
  // Debug logging
  const DEBUG = process.env.NODE_ENV === 'development';
  const debugLog = (action, data) => {
    if (DEBUG) {
      console.log(`[Header] ${action}:`, data);
    }
  };
  
  /**
   * Handle clicks outside menus to close them
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target) && 
          !event.target.closest('.hamburger-button')) {
        setShowMenu(false);
      }
    };
    
    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setShowMenu]);
  
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
        {/* Hamburger Menu Button */}
        <button
          className="hamburger-button"
          onClick={() => setShowMenu(!showMenu)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 12H21M3 6H21M3 18H21"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        
        {/* Logo and Brand */}
        <div className="header-brand">
          <QashLogo size={40} />
          <h1 className="brand-name">Qash</h1>
        </div>
        
        {/* Slide-out Menu */}
        <div className={`slide-menu ${showMenu ? 'open' : ''}`} ref={menuRef}>
          <div className="menu-content">
            {/* User Profile Section */}
            <div className="menu-profile-section">
              <div className="menu-profile-avatar">
                {getUserInitials()}
              </div>
              <div className="menu-profile-info">
                <div className="menu-profile-name">{getUserDisplayName()}</div>
                <div className="menu-profile-email">{user?.email}</div>
                <div className="menu-profile-stats">
                  <span className="profile-completion">Profile: {profileCompletion}%</span>
                  {trialDaysRemaining > 0 && (
                    <span className="trial-badge">Trial: {trialDaysRemaining} days left</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Upload Limits */}
            <div className="menu-upload-limits">
              <div className="upload-limit-header">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M14 10V12.6667C14 13.403 13.403 14 12.6667 14H3.33333C2.59695 14 2 13.403 2 12.6667V10M11.3333 5.33333L8 2M8 2L4.66667 5.33333M8 2V10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Upload Limits</span>
              </div>
              <div className="upload-limit-info">
                <span>{uploadsThisMonth} / 10 uploads this month</span>
                <div className="upload-progress-bar">
                  <div 
                    className="upload-progress-fill" 
                    style={{ width: `${(uploadsThisMonth / 10) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            
            {/* Menu Items */}
            <nav className="menu-nav">
              <button
                className={`menu-nav-item ${activeMenuItem === 'dashboard' ? 'active' : ''}`}
                onClick={() => {
                  handleMenuClick('dashboard');
                  setShowMenu(false);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M3 10L10 3L17 10M5 8V15C5 15.5523 5.44772 16 6 16H8V12C8 11.4477 8.44772 11 9 11H11C11.5523 11 12 11.4477 12 12V16H14C14.5523 16 15 15.5523 15 15V8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Dashboard
              </button>
              
              <button
                className={`menu-nav-item ${activeMenuItem === 'profile' ? 'active' : ''}`}
                onClick={() => {
                  handleMenuClick('profile');
                  setShowMenu(false);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M10 10C11.6569 10 13 8.65685 13 7C13 5.34315 11.6569 4 10 4C8.34315 4 7 5.34315 7 7C7 8.65685 8.34315 10 10 10Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M4 17C4 15.3431 5.34315 14 7 14H13C14.6569 14 16 15.3431 16 17"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Profile
              </button>
              
              <button
                className={`menu-nav-item ${activeMenuItem === 'documents' ? 'active' : ''}`}
                onClick={() => {
                  handleMenuClick('documents');
                  setShowMenu(false);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M9 2H4C3.46957 2 2.96086 2.21071 2.58579 2.58579C2.21071 2.96086 2 3.46957 2 4V16C2 16.5304 2.21071 17.0391 2.58579 17.4142C2.96086 17.7893 3.46957 18 4 18H16C16.5304 18 17.0391 17.7893 17.4142 17.4142C17.7893 17.0391 18 16.5304 18 16V11M16 2L18 4L10 12L7 13L8 10L16 2Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Saved Documents
              </button>
              
              <button
                className={`menu-nav-item ${activeMenuItem === 'settings' ? 'active' : ''}`}
                onClick={() => {
                  handleMenuClick('settings');
                  setShowMenu(false);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M10 12C11.1046 12 12 11.1046 12 10C12 8.89543 11.1046 8 10 8C8.89543 8 8 8.89543 8 10C8 11.1046 8.89543 12 10 12Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16.2 12.5C16.1 12.7 16 13 16 13.4L17.3 14.5C17.4 14.6 17.5 14.8 17.4 15L16.3 17C16.2 17.1 16 17.2 15.8 17.1L14.3 16.5C14 16.8 13.6 17 13.2 17.2L12.9 18.8C12.9 19 12.7 19.1 12.5 19.1H10.3C10.1 19.1 9.9 19 9.9 18.8L9.6 17.2C9.2 17 8.8 16.8 8.5 16.5L7 17.1C6.8 17.2 6.6 17.1 6.5 17L5.4 15C5.3 14.8 5.4 14.6 5.5 14.5L6.8 13.4C6.8 13 6.7 12.7 6.7 12.5C6.7 12.3 6.8 12 6.8 11.6L5.5 10.5C5.4 10.4 5.3 10.2 5.4 10L6.5 8C6.6 7.9 6.8 7.8 7 7.9L8.5 8.5C8.8 8.2 9.2 8 9.6 7.8L9.9 6.2C9.9 6 10.1 5.9 10.3 5.9H12.5C12.7 5.9 12.9 6 12.9 6.2L13.2 7.8C13.6 8 14 8.2 14.3 8.5L15.8 7.9C16 7.8 16.2 7.9 16.3 8L17.4 10C17.5 10.2 17.4 10.4 17.3 10.5L16 11.6C16 12 16.1 12.3 16.2 12.5Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Settings
              </button>
              
              <button
                className={`menu-nav-item ${activeMenuItem === 'billing' ? 'active' : ''}`}
                onClick={() => {
                  handleMenuClick('billing');
                  setShowMenu(false);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M3 7C3 6.46957 3.21071 5.96086 3.58579 5.58579C3.96086 5.21071 4.46957 5 5 5H15C15.5304 5 16.0391 5.21071 16.4142 5.58579C16.7893 5.96086 17 6.46957 17 7V13C17 13.5304 16.7893 14.0391 16.4142 14.4142C16.0391 14.7893 15.5304 15 15 15H5C4.46957 15 3.96086 14.7893 3.58579 14.4142C3.21071 14.0391 3 13.5304 3 13V7Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3 9H17M7 13H7.01M10 13H10.01"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Billing
              </button>
              
              <button
                className={`menu-nav-item ${activeMenuItem === 'glossary' ? 'active' : ''}`}
                onClick={() => {
                  handleMenuClick('glossary');
                  setShowMenu(false);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M9 3H5C4.46957 3 3.96086 3.21071 3.58579 3.58579C3.21071 3.96086 3 4.46957 3 5V15C3 15.5304 3.21071 16.0391 3.58579 16.4142C3.96086 16.7893 4.46957 17 5 17H15C15.5304 17 16.0391 16.7893 16.4142 16.4142C16.7893 16.0391 17 15.5304 17 15V11M11 9L17 3M17 3H13M17 3V7"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Glossary
              </button>
            </nav>
            
            {/* Sign Out Button */}
            <div className="menu-footer">
              <button
                className="menu-nav-item menu-nav-item-danger"
                onClick={() => {
                  handleSignOut();
                  setShowMenu(false);
                }}
                disabled={isSigningOut}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M7 3H13C14.1046 3 15 3.89543 15 5V15C15 16.1046 14.1046 17 13 17H7"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M11 10H3M3 10L5.5 7.5M3 10L5.5 12.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {isSigningOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Auto-save indicator */}
        {showAutoSaveIndicator && (
          <div className="auto-save-indicator">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M5 8L7 10L11 6"
                stroke="#22c55e"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Saved</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;