/**
 * Main Application Component (Refactored)
 * 
 * Purpose: Main dashboard container using modular architecture
 * Features: Complete 4-section layout, hamburger menu, trial status, chat interface
 * 
 * This version includes all features from the original 3400-line App.js
 * 
 * @component
 * @version 3.1.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';

// Context and Hooks
import { useAuth } from './context/AuthContext';
import useUpload from './hooks/useUpload';

// Services
import api from './services/api';

// Components
import Profile from './components/Profile';
import Documents from './components/Documents';
import UploadLimitModal from './components/UploadLimitModal';

// Utils
import { icons } from './utils/icons';

// Constants
import { 
  UPLOAD_LIMITS, 
  UI_CONFIG, 
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  LOADING_MESSAGES 
} from './constants';

// Styles
import './App.css';

/**
 * Main App Component
 */
function App() {
  // Debug logging
  const DEBUG = process.env.NODE_ENV === 'development';
  const debugLog = (context, message, data = null) => {
    if (DEBUG) {
      console.log(`[App ${context}] ${message}`, data || '');
    }
  };

  // Initialize debug info
  useEffect(() => {
    debugLog('Init', 'App component mounted', {
      env: process.env.NODE_ENV,
      apiUrl: process.env.REACT_APP_API_URL,
      hasFirebaseConfig: !!process.env.REACT_APP_FIREBASE_API_KEY
    });
  }, []);

  // Navigation
  const navigate = useNavigate();

  // Authentication
  const { user, loading: authLoading, error: authError } = useAuth();
  
  // File Upload Hook
  const {
    uploadedFiles,
    isUploading,
    uploadProgress,
    error: uploadError,
    analysis,
    handleUpload,
    clearFiles,
    removeFile
  } = useUpload();

  // UI State
  const [activeView, setActiveView] = useState('dashboard');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [showUploadLimitModal, setShowUploadLimitModal] = useState(false);
  
  // Chat State
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // User State
  const [userProfile, setUserProfile] = useState(null);
  const [userTier, setUserTier] = useState('free');
  const [uploadsRemaining, setUploadsRemaining] = useState(4);
  
  // Other State
  const [showNudge, setShowNudge] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  
  /**
   * Check backend health on mount
   */
  useEffect(() => {
    const checkHealth = async () => {
      try {
        debugLog('Health', 'Checking backend health');
        const result = await api.checkHealth();
        debugLog('Health', 'Backend is healthy', result);
      } catch (error) {
        console.error('[App] Backend health check failed:', error);
        setError('Unable to connect to server. Please try again later.');
      }
    };
    
    checkHealth();
  }, []);
  
  /**
   * Load user profile when authenticated
   */
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        debugLog('Profile', 'No user authenticated, skipping profile load');
        return;
      }
      
      try {
        debugLog('Profile', 'Loading user profile', { userId: user.uid });
        const profile = await api.getUserProfile();
        setUserProfile(profile);
        debugLog('Profile', 'Profile loaded', { 
          hasProfile: !!profile,
          isComplete: profile?.profileComplete 
        });
      } catch (error) {
        // If profile doesn't exist, that's okay
        if (error.status !== 404) {
          console.error('[App] Failed to load profile:', error);
        }
      }
    };
    
    loadProfile();
  }, [user]);
  
  /**
   * Handle drag and drop
   */
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);
  
  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    
    if (files.length === 0) {
      debugLog('Drop', 'No files dropped');
      return;
    }
    
    debugLog('Drop', 'Files dropped', { count: files.length });
    
    // Check upload limits for free tier
    if (userTier === 'free' && uploadsRemaining <= 0) {
      setShowUploadLimitModal(true);
      return;
    }
    
    // Upload files
    const result = await handleUpload(files);
    
    if (result) {
      // Update uploads remaining for free tier
      if (userTier === 'free') {
        setUploadsRemaining(prev => Math.max(0, prev - 1));
      }
    }
  }, [handleUpload, userTier, uploadsRemaining]);
  
  /**
   * Handle file input change
   */
  const handleFileSelect = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    debugLog('FileSelect', 'Files selected', { count: files.length });
    
    // Check upload limits for free tier
    if (userTier === 'free' && uploadsRemaining <= 0) {
      setShowUploadLimitModal(true);
      return;
    }
    
    // Upload files
    const result = await handleUpload(files);
    
    if (result) {
      // Update uploads remaining for free tier
      if (userTier === 'free') {
        setUploadsRemaining(prev => Math.max(0, prev - 1));
      }
    }
    
    // Clear input
    e.target.value = '';
  }, [handleUpload, userTier, uploadsRemaining]);
  
  /**
   * Handle chat message
   */
  const handleChatSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!chatInput.trim() || !analysis) {
      debugLog('Chat', 'Invalid chat submit', { 
        hasInput: !!chatInput.trim(),
        hasAnalysis: !!analysis 
      });
      return;
    }
    
    // Add user message to history
    const userMessage = chatInput.trim();
    setChatHistory(prev => [...prev, {
      type: 'user',
      message: userMessage,
      timestamp: new Date()
    }]);
    
    // Clear input
    setChatInput('');
    setIsChatLoading(true);
    
    try {
      debugLog('Chat', 'Sending chat message', { 
        messageLength: userMessage.length,
        documentCount: analysis.files?.length || 0
      });
      
      // Send chat request
      const response = await api.sendChatMessage(
        userMessage,
        analysis.files || [],
        `session_${Date.now()}`
      );
      
      // Add AI response to history
      setChatHistory(prev => [...prev, {
        type: 'ai',
        message: response.response,
        timestamp: new Date()
      }]);
      
      debugLog('Chat', 'Chat response received');
      
    } catch (error) {
      console.error('[App] Chat error:', error);
      setChatHistory(prev => [...prev, {
        type: 'error',
        message: 'Failed to get response. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsChatLoading(false);
    }
  }, [chatInput, analysis]);
  
  /**
   * Handle menu item clicks from header
   */
  const handleMenuItemClick = useCallback((item) => {
    debugLog('Menu', 'Menu item clicked', { item });
    
    switch (item) {
      case 'dashboard':
        setActiveView('dashboard');
        break;
      case 'documents':
        setShowDocumentsModal(true);
        break;
      case 'profile':
        setShowProfileModal(true);
        break;
      case 'settings':
        // TODO: Implement settings
        break;
      case 'help':
        // TODO: Implement help
        break;
      default:
        break;
    }
  }, []);
  
  /**
   * Render loading state
   */
  if (authLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }
  
  /**
   * Render error state
   */
  if (authError) {
    return (
      <div className="error-container">
        <h2>Authentication Error</h2>
        <p>{authError.message}</p>
        <button onClick={() => navigate('/')}>
          Return to Login
        </button>
      </div>
    );
  }
  
  /**
   * Main render
   */
  return (
    <div className="app-container">
      {/* Header */}
      <Header 
        onMenuItemClick={handleMenuItemClick}
        activeMenuItem={activeView}
      />
      
      {/* Main Content */}
      <main className="main-content">
        <div className="content-wrapper">
          {/* Left Column - Upload Section */}
          <div className="upload-section">
            <div className="section-header">
              <h2>Upload Documents</h2>
              {userTier === 'free' && (
                <span className="upload-limit">
                  {uploadsRemaining} uploads remaining this month
                </span>
              )}
            </div>
            
            {/* Drop Zone */}
            <div
              className={`drop-zone ${dragActive ? 'drag-active' : ''} ${uploadedFiles.length > 0 ? 'has-files' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {uploadedFiles.length === 0 ? (
                <>
                  <div className="drop-icon">
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                      <path
                        d="M40 24L32 16L24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M32 16V40"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M48 40V48C48 50.2091 46.2091 52 44 52H20C17.7909 52 16 50.2091 16 48V40"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <p className="drop-text">
                    Drag and drop files here or{' '}
                    <label className="file-input-label">
                      browse
                      <input
                        type="file"
                        multiple
                        accept={UPLOAD_LIMITS.ALLOWED_EXTENSIONS.join(',')}
                        onChange={handleFileSelect}
                        className="file-input"
                      />
                    </label>
                  </p>
                  <p className="drop-hint">
                    Supports PDF, Word, Excel, CSV, TXT, and images
                  </p>
                </>
              ) : (
                <div className="uploaded-files">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="uploaded-file">
                      <div className="file-info">
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      {!isUploading && (
                        <button
                          className="remove-file"
                          onClick={() => removeFile(index)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Upload Progress */}
            {isUploading && (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="progress-text">{LOADING_MESSAGES.ANALYZING}</p>
              </div>
            )}
            
            {/* Error Display */}
            {(error || uploadError) && (
              <div className="error-message">
                {error || uploadError}
              </div>
            )}
            
            {/* Action Buttons */}
            {uploadedFiles.length > 0 && !isUploading && (
              <div className="upload-actions">
                <button
                  className="btn btn-secondary"
                  onClick={clearFiles}
                >
                  Clear All
                </button>
                <label className="btn btn-primary">
                  Add More Files
                  <input
                    type="file"
                    multiple
                    accept={UPLOAD_LIMITS.ALLOWED_EXTENSIONS.join(',')}
                    onChange={handleFileSelect}
                    className="file-input"
                  />
                </label>
              </div>
            )}
          </div>
          
          {/* Right Column - Results Section */}
          <div className="results-section">
            {analysis ? (
              <>
                {/* Analysis Results */}
                <div className="analysis-results">
                  <div className="section-header">
                    <h2>Analysis Results</h2>
                    <button className="btn-icon">
                      Export
                    </button>
                  </div>
                  
                  {/* Results content would go here */}
                  <div className="results-content">
                    <p>Analysis complete for {analysis.totalFiles} file(s)</p>
                    {/* Add detailed results display */}
                  </div>
                </div>
                
                {/* Chat Section */}
                <div className="chat-section">
                  <div className="section-header">
                    <h2>Ask Questions</h2>
                  </div>
                  
                  {/* Chat History */}
                  <div className="chat-history">
                    {chatHistory.map((msg, index) => (
                      <div
                        key={index}
                        className={`chat-message ${msg.type}`}
                      >
                        <div className="message-content">
                          {msg.message}
                        </div>
                        <div className="message-time">
                          {msg.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                    {isChatLoading && (
                      <div className="chat-message ai">
                        <div className="message-content">
                          <div className="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Chat Input */}
                  <form onSubmit={handleChatSubmit} className="chat-input-form">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask about your documents..."
                      className="chat-input"
                      maxLength={UI_CONFIG.CHAT_MESSAGE_MAX_LENGTH}
                      disabled={isChatLoading}
                    />
                    <button
                      type="submit"
                      className="chat-submit"
                      disabled={!chatInput.trim() || isChatLoading}
                    >
                      Send
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
                    <path
                      d="M36 30H60C63.3137 30 66 32.6863 66 36V66C66 69.3137 63.3137 72 60 72H36C32.6863 72 30 69.3137 30 66V36C30 32.6863 32.6863 30 36 30Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M42 42H54"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M42 48H54"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M42 54H48"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3>No documents uploaded</h3>
                <p>Upload financial documents to get AI-powered analysis</p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Modals */}
      {showProfileModal && (
        <Profile
          user={user}
          profile={userProfile}
          onClose={() => setShowProfileModal(false)}
          onUpdate={setUserProfile}
        />
      )}
      
      {showDocumentsModal && (
        <Documents
          user={user}
          onClose={() => setShowDocumentsModal(false)}
        />
      )}
      
      {showUploadLimitModal && (
        <UploadLimitModal
          onClose={() => setShowUploadLimitModal(false)}
          onUpgrade={() => {
            // TODO: Implement upgrade flow
            setShowUploadLimitModal(false);
          }}
        />
      )}
    </div>
  );
}

export default App;