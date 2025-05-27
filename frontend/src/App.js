/**
 * Main Application Component (Modular Version)
 * 
 * Purpose: Main dashboard with complete 4-section layout
 * Features: File upload, analysis display, chat interface, hamburger menu
 * 
 * @component
 * @version 3.1.1 - Fixed UI/UX with proper Qash branding
 * @updated 2024-01-27
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';

// Context and Hooks
import { useAuth } from './context/AuthContext';
import useUpload from './hooks/useUpload';

// Services
import api from './services/api';

// Components
import Header from './components/Header/Header';
import Profile from './components/Profile';
import Documents from './components/Documents';
import UploadLimitModal from './components/UploadLimitModal';
import ExecutiveSummary from './components/ExecutiveSummary';
import DetailedAnalysis from './components/DetailedAnalysis';
import ActionItems from './components/ActionItems';
import ChatSection from './components/ChatSection';

// Utils
import { icons } from './utils/icons';

// Constants
import { UPLOAD_LIMITS } from './constants';

const maxFiles = UPLOAD_LIMITS.MAX_FILES;
const maxSize = UPLOAD_LIMITS.MAX_TOTAL_SIZE;

// Styles
import './App.css';

function App() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // File Upload Hook
  const {
    uploadedFiles: uploadedFilesFromHook,
    isUploading,
    uploadProgress,
    error: uploadError,
    analysis,
    handleUpload: uploadFiles,
    clearFiles,
    removeFile: removeFileFromHook
  } = useUpload();
  
  // Local state for selected files (before upload)
  const [selectedFiles, setSelectedFiles] = useState([]);

  // UI State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [showUploadLimitModal, setShowUploadLimitModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard');
  const [dragActive, setDragActive] = useState(false);
  const [showAutoSaveIndicator, setShowAutoSaveIndicator] = useState(false);
  
  // Chat State
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState({});
  
  // User State
  const [userProfile, setUserProfile] = useState(null);
  const [userTier, setUserTier] = useState('free');
  const [uploadsRemaining, setUploadsRemaining] = useState(4);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(30);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [uploadsThisMonth, setUploadsThisMonth] = useState(0);
  
  // Profile State
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [editingProfile, setEditingProfile] = useState(false);
  
  // Session State
  const [showIdleWarning, setShowIdleWarning] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [currentSessionId, setCurrentSessionId] = useState(null);
  
  // Export and Display State
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [currentNudge, setCurrentNudge] = useState(null);
  
  // Other State
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

  const maxFiles = UPLOAD_LIMITS.MAX_FILES;
  const maxSize = UPLOAD_LIMITS.MAX_FILE_SIZE;
  const currentSize = uploadedFiles.reduce((sum, f) => sum + f.size, 0);
  const limitsReached = uploadedFiles.length >= maxFiles || currentSize >= maxSize;

  /**
   * Check user tier and trial status
   */
  useEffect(() => {
    if (!user) return;
    
    const userDataKey = `qash_user_${user.uid}`;
    const userData = JSON.parse(localStorage.getItem(userDataKey) || '{}');
    
    // Initialize trial if new user
    if (!userData.trialStartDate) {
      userData.trialStartDate = new Date().toISOString();
      userData.tier = 'free';
      localStorage.setItem(userDataKey, JSON.stringify(userData));
    }
    
    // Calculate trial days
    const now = new Date();
    const trialStart = new Date(userData.trialStartDate);
    const daysSinceStart = Math.floor((now - trialStart) / (1000 * 60 * 60 * 24));
    const trialDays = 30 - daysSinceStart;
    
    setTrialDaysRemaining(Math.max(0, trialDays));
    setIsTrialExpired(trialDays <= 0);
    
    // Check monthly uploads
    const lastReset = userData.lastUploadReset ? new Date(userData.lastUploadReset) : new Date();
    
    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
      userData.uploadsThisMonth = 0;
      userData.lastUploadReset = now.toISOString();
      localStorage.setItem(userDataKey, JSON.stringify(userData));
    }
    
    setUserTier(userData.tier || 'free');
    const uploadsUsed = userData.uploadsThisMonth || 0;
    setUploadsThisMonth(uploadsUsed);
    const monthlyLimit = userData.tier === 'free' ? 4 : 999;
    setUploadsRemaining(Math.max(0, monthlyLimit - uploadsUsed));
  }, [user]);

  /**
   * Load user profile and calculate completion
   */
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        const profile = await api.getUserProfile();
        setUserProfile(profile);
        
        // Calculate profile completion
        const completion = getProfileCompletion(profile);
        setProfileCompletion(completion);
      } catch (error) {
        // Profile doesn't exist yet, that's ok
        setProfileCompletion(0);
      }
    };
    
    loadProfile();
  }, [user]);

  /**
   * Handle menu item clicks
   */
  const handleMenuItemClick = (item) => {
    setActiveMenuItem(item);
    
    switch(item) {
      case 'dashboard':
        // Already on dashboard
        break;
      case 'profile':
        setShowProfileModal(true);
        break;
      case 'documents':
        setShowDocumentsModal(true);
        break;
      case 'settings':
        // TODO: Implement settings modal
        break;
      case 'billing':
        // TODO: Implement billing modal
        break;
      case 'glossary':
        setShowGlossary(true);
        break;
      default:
        break;
    }
  };
  
  /**
   * Handle logout
   */
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  /**
   * Calculate profile completion percentage
   */
  const getProfileCompletion = (profile) => {
    if (!profile) return 0;
    
    const fields = ['company_name', 'industry', 'company_size', 'role'];
    const filledFields = fields.filter(field => profile[field] && profile[field].trim() !== '').length;
    return Math.round((filledFields / fields.length) * 100);
  };
  
  /**
   * Auto-save session data periodically
   */
  useEffect(() => {
    if (!user || !analysis) return;
    
    const saveInterval = setInterval(() => {
      saveCurrentSession();
    }, 30000); // Save every 30 seconds
    
    return () => clearInterval(saveInterval);
  }, [user, analysis, chatHistory]);
  
  /**
   * Save current session to localStorage
   */
  const saveCurrentSession = useCallback(() => {
    if (!user || !analysis) return;
    
    const sessionData = {
      id: currentSessionId || Date.now().toString(),
      timestamp: new Date().toISOString(),
      analysis,
      chatHistory,
      uploadedFiles: uploadedFiles.map(f => ({ name: f.name, size: f.size }))
    };
    
    const sessionKey = `qash_session_${user.uid}_${sessionData.id}`;
    localStorage.setItem(sessionKey, JSON.stringify(sessionData));
    
    // Show auto-save indicator
    setShowAutoSaveIndicator(true);
    setTimeout(() => setShowAutoSaveIndicator(false), 2000);
    
    if (!currentSessionId) {
      setCurrentSessionId(sessionData.id);
    }
  }, [user, analysis, chatHistory, uploadedFiles, currentSessionId]);
  
  /**
   * Check and show nudges based on user activity
   */
  useEffect(() => {
    if (!user || !analysis) return;
    
    const checkNudges = () => {
      // Profile completion nudge
      if (profileCompletion < 100 && !showNudge) {
        setCurrentNudge({
          type: 'profile',
          message: 'Complete your profile to unlock personalized insights',
          action: () => setShowProfileModal(true)
        });
        setShowNudge(true);
        return;
      }
      
      // Export nudge after analysis
      if (analysis && chatHistory.length > 2 && !showNudge) {
        setCurrentNudge({
          type: 'export',
          message: 'Ready to share? Export your analysis as a report',
          action: () => setShowExportMenu(true)
        });
        setShowNudge(true);
      }
    };
    
    const nudgeTimer = setTimeout(checkNudges, 5000);
    return () => clearTimeout(nudgeTimer);
  }, [user, analysis, profileCompletion, chatHistory, showNudge]);

  /**
   * Handle drag events
   */
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    
    if (userTier === 'free' && uploadsRemaining <= 0) {
      setShowUploadLimitModal(true);
      return;
    }
    
    await handleFileSelect({ target: { files } });
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    if (userTier === 'free' && uploadsRemaining <= 0) {
      setShowUploadLimitModal(true);
      return;
    }
    
    // Add files to upload list
    const newFiles = files.filter(file => {
      const exists = selectedFiles.some(f => f.name === file.name);
      if (exists) {
        setError(`File ${file.name} already uploaded`);
        return false;
      }
      return true;
    });
    
    if (newFiles.length + selectedFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }
    
    const currentSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);
    const totalSize = newFiles.reduce((sum, f) => sum + f.size, 0) + currentSize;
    if (totalSize > maxSize) {
      setError('Total file size exceeds 20MB limit');
      return;
    }
    
    // Add files to state - they'll be analyzed when user clicks Analyze
    setSelectedFiles(prev => [...prev, ...newFiles]);
    setError(null);
    
    // Clear file input
    if (e.target.value) {
      e.target.value = '';
    }
  };

  /**
   * Handle analyze button
   */
  const handleAnalyze = async () => {
    if (selectedFiles.length === 0) return;
    
    if (userTier === 'free' && isTrialExpired) {
      setError('Your 30-day free trial has expired. Please upgrade to Pro to continue.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setProcessingStatus('Analyzing documents...');
    
    try {
      const result = await uploadFiles(selectedFiles);
      if (result) {
        // Clear selected files after successful upload
        setSelectedFiles([]);
      }
      
      if (userTier === 'free') {
        const userDataKey = `qash_user_${user.uid}`;
        const userData = JSON.parse(localStorage.getItem(userDataKey) || '{}');
        userData.uploadsThisMonth = (userData.uploadsThisMonth || 0) + 1;
        localStorage.setItem(userDataKey, JSON.stringify(userData));
        setUploadsThisMonth(userData.uploadsThisMonth);
        setUploadsRemaining(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setError('Failed to analyze documents. Please try again.');
    } finally {
      setLoading(false);
      setProcessingStatus('');
    }
  };

  /**
   * Handle chat submit
   */
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    
    if (!chatInput.trim() || !analysis) return;
    
    const userMessage = chatInput.trim();
    setChatHistory(prev => [...prev, {
      type: 'user',
      message: userMessage,
      timestamp: new Date()
    }]);
    
    setChatInput('');
    setIsChatLoading(true);
    
    try {
      const response = await api.sendChatMessage(
        userMessage,
        analysis.files || [],
        `session_${Date.now()}`
      );
      
      setChatHistory(prev => [...prev, {
        type: 'ai',
        message: response.response,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setChatHistory(prev => [...prev, {
        type: 'error',
        message: 'Failed to get response. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  /**
   * Remove file from upload list
   */
  const handleRemoveFile = (fileName) => {
    setSelectedFiles(prev => prev.filter(f => f.name !== fileName));
  };
  
  /**
   * Export chat and analysis as text report
   */
  const exportChat = (saveToHistory = false) => {
    if (!analysis || chatHistory.length === 0) return;
    
    const report = `
QASH FINANCIAL ANALYSIS REPORT
Generated: ${new Date().toLocaleString()}
User: ${user?.email || 'Unknown'}

========================================
EXECUTIVE SUMMARY
========================================
${JSON.stringify(getCFOMetrics(), null, 2)}

========================================
DOCUMENTS ANALYZED
========================================
${analysis?.files?.map(f => `- ${f.fileName || f.name}`).join('\n') || 'No files'}

========================================
ANALYSIS DETAILS
========================================
${JSON.stringify(analysis, null, 2)}

========================================
CHAT HISTORY
========================================
${chatHistory.map(msg => 
  `[${msg.timestamp.toLocaleString()}] ${msg.type.toUpperCase()}: ${msg.message}`
).join('\n\n')}

========================================
Report generated by Qash.solutions
`;
    
    // Create download link
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qash-report-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    
    // Save to history if requested
    if (saveToHistory) {
      saveCurrentSession();
    }
  };
  
  /**
   * Get CFO metrics for executive summary
   */
  const getCFOMetrics = () => {
    if (!analysis || !analysis.files) return {};
    
    let metrics = {
      totalDocuments: analysis.files.length,
      totalAmount: 0,
      avgConfidence: 0,
      keyInsights: []
    };
    
    analysis.files.forEach(file => {
      if (file.analysis && !file.analysis.rawAnalysis) {
        const data = file.analysis;
        
        if (data.amount) {
          const amount = parseFloat(data.amount.replace(/[^\d.-]/g, ''));
          if (!isNaN(amount)) metrics.totalAmount += amount;
        }
        
        if (data.confidence === 'HIGH') metrics.avgConfidence += 90;
        else if (data.confidence === 'MEDIUM') metrics.avgConfidence += 70;
        else metrics.avgConfidence += 50;
        
        if (data.keyInsights) {
          metrics.keyInsights = metrics.keyInsights.concat(data.keyInsights);
        }
      }
    });
    
    if (analysis.files.length > 0) {
      metrics.avgConfidence = Math.round(metrics.avgConfidence / analysis.files.length);
    }
    
    return metrics;
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f5f5f5' }}>
      {/* Header with Hamburger Menu */}
      <Header
        onMenuItemClick={handleMenuItemClick}
        activeMenuItem={activeMenuItem}
        showMenu={showMenu}
        setShowMenu={setShowMenu}
        trialDaysRemaining={trialDaysRemaining}
        uploadsThisMonth={uploadsThisMonth}
        profileCompletion={profileCompletion}
        showAutoSaveIndicator={showAutoSaveIndicator}
      />
      
      
      {/* Nudge System */}
      {showNudge && currentNudge && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          maxWidth: '320px',
          zIndex: 100,
          display: 'flex',
          alignItems: 'start',
          gap: '12px'
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
            <path
              d="M10 2C14.4183 2 18 5.58172 18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2Z"
              fill="#3b82f6"
            />
            <path
              d="M10 6V10M10 14H10.01"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#1f2937' }}>
              {currentNudge.message}
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  currentNudge.action();
                  setShowNudge(false);
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Take Action
              </button>
              <button
                onClick={() => setShowNudge(false)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'white',
                  color: '#6b7280',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div style={{ 
        flex: 1, 
        overflow: 'hidden', 
        display: 'flex',
        marginTop: '64px'
      }}>
        {/* Left Column - 40% */}
        <div style={{ 
          width: '40%', 
          padding: '20px', 
          borderRight: '1px solid #d0d0d0', 
          overflowY: 'auto',
          backgroundColor: 'white'
        }}>
          {/* Upload Section */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '15px' }}>
              <h2 style={{ color: '#333', fontSize: '18px', margin: 0 }}>
                Document Analysis
              </h2>
              {userTier === 'free' && (
                <p style={{ 
                  margin: '4px 0 0 0', 
                  fontSize: '12px', 
                  color: uploadsRemaining > 0 ? '#6B7280' : '#DC2626'
                }}>
                  {uploadsRemaining > 0 
                    ? `${uploadsRemaining} uploads remaining this month`
                    : 'Monthly limit reached'
                  }
                </p>
              )}
            </div>

            {/* Uploaded Files List */}
            {selectedFiles.length > 0 && (
              <div style={{ marginBottom: '15px' }}>
                {selectedFiles.map((file, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '8px 12px',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #d0d0d0',
                    borderRadius: '4px',
                    marginBottom: '5px',
                    fontSize: '13px'
                  }}>
                    <span>{file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                    <button 
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#dc2626',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                      onClick={() => handleRemoveFile(file.name)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Drop Zone */}
            <div 
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => !limitsReached && document.getElementById('file-input').click()}
              style={{ 
                padding: '40px 20px',
                border: '2px dashed #d0d0d0',
                borderRadius: '8px',
                textAlign: 'center',
                backgroundColor: dragActive ? '#f0f9ff' : '#fafafa',
                cursor: limitsReached ? 'not-allowed' : 'pointer',
                marginBottom: '15px',
                opacity: limitsReached ? 0.5 : 1
              }}
            >
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ margin: '0 auto 12px' }}>
                <path
                  d="M40 30V38C40 39.0609 39.5786 40.0783 38.8284 40.8284C38.0783 41.5786 37.0609 42 36 42H12C10.9391 42 9.92172 41.5786 9.17157 40.8284C8.42143 40.0783 8 39.0609 8 38V30"
                  stroke="#9ca3af"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M34 16L24 6L14 16"
                  stroke="#9ca3af"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M24 6V30"
                  stroke="#9ca3af"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                Drop files here or click to upload
              </p>
              <p style={{ margin: '8px 0 0 0', color: '#9ca3af', fontSize: '12px' }}>
                PDF, DOC, XLS, JPG, PNG • Max 2 files, 20MB total
              </p>
              <input
                id="file-input"
                type="file"
                multiple
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
                style={{ display: 'none' }}
                disabled={limitsReached}
              />
            </div>

            {/* Analyze Button */}
            <button 
              onClick={handleAnalyze}
              disabled={selectedFiles.length === 0 || loading || isUploading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: selectedFiles.length === 0 || loading || isUploading ? '#e5e7eb' : '#3b82f6',
                color: selectedFiles.length === 0 || loading || isUploading ? '#9ca3af' : 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: uploadedFiles.length === 0 || loading || isUploading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading || isUploading ? 'Analyzing...' : 'Analyze Documents'}
            </button>

            {/* Progress Bar */}
            {isUploading && uploadProgress > 0 && (
              <div style={{ marginTop: '10px' }}>
                <div style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${uploadProgress}%`,
                    height: '100%',
                    backgroundColor: '#3b82f6',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <p style={{ 
                  margin: '4px 0 0 0', 
                  fontSize: '12px', 
                  color: '#6b7280',
                  textAlign: 'center'
                }}>
                  {processingStatus || `Processing... ${uploadProgress}%`}
                </p>
              </div>
            )}

            {/* Error Display */}
            {(error || uploadError) && (
              <div style={{
                marginTop: '10px',
                padding: '10px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                color: '#dc2626',
                fontSize: '13px'
              }}>
                {error || uploadError}
              </div>
            )}
          </div>

          {/* Chat Section - Always visible */}
          <ChatSection
            chatHistory={chatHistory}
            chatInput={chatInput}
            setChatInput={setChatInput}
            isChatLoading={isChatLoading}
            handleChatSubmit={handleChatSubmit}
            expandedMessages={expandedMessages}
            setExpandedMessages={setExpandedMessages}
            disabled={!analysis}
          />
        </div>

        {/* Right Column - 60% */}
        <div style={{ 
          width: '60%', 
          padding: '20px', 
          overflowY: 'auto',
          backgroundColor: '#f9fafb'
        }}>
          {analysis ? (
            <>
              {/* Export Button */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                marginBottom: '16px',
                position: 'relative'
              }}>
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#374151'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M14 10V12.6667C14 13.403 13.403 14 12.6667 14H3.33333C2.59695 14 2 13.403 2 12.6667V10M11.3333 5.33333L8 2M8 2L4.66667 5.33333M8 2V10"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Export
                </button>
                
                {showExportMenu && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '4px',
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    minWidth: '180px',
                    zIndex: 10
                  }}>
                    <button
                      onClick={() => {
                        exportChat(false);
                        setShowExportMenu(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        backgroundColor: 'white',
                        border: 'none',
                        borderBottom: '1px solid #e5e7eb',
                        textAlign: 'left',
                        fontSize: '14px',
                        cursor: 'pointer',
                        color: '#374151'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                    >
                      Export as Text
                    </button>
                    <button
                      onClick={() => {
                        exportChat(true);
                        setShowExportMenu(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        backgroundColor: 'white',
                        border: 'none',
                        borderBottom: '1px solid #e5e7eb',
                        textAlign: 'left',
                        fontSize: '14px',
                        cursor: 'pointer',
                        color: '#374151'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                    >
                      Export & Save to History
                    </button>
                    <button
                      onClick={async () => {
                        setShowExportMenu(false);
                        const emailTo = prompt('Enter email address:');
                        if (emailTo) {
                          try {
                            setLoading(true);
                            await api.sendReport(
                              emailTo,
                              'Qash Financial Analysis Report',
                              'Please find attached your financial analysis report.',
                              {
                                fileName: `qash-report-${new Date().toISOString().split('T')[0]}.txt`,
                                analysis,
                                chatHistory,
                                files: analysis?.files?.map(f => f.fileName || f.name) || []
                              }
                            );
                            alert('Report sent successfully!');
                          } catch (error) {
                            alert('Failed to send report. Please try again.');
                          } finally {
                            setLoading(false);
                          }
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        backgroundColor: 'white',
                        border: 'none',
                        textAlign: 'left',
                        fontSize: '14px',
                        cursor: 'pointer',
                        color: '#374151'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                    >
                      Email Report
                    </button>
                  </div>
                )}
              </div>
              
              <ExecutiveSummary analysis={analysis} />
              <DetailedAnalysis analysis={analysis} />
              <ActionItems analysis={analysis} />
            </>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#6b7280'
            }}>
              <svg width="96" height="96" viewBox="0 0 96 96" fill="none" style={{ marginBottom: '16px' }}>
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
              <h3 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>No documents analyzed</h3>
              <p style={{ margin: 0, fontSize: '14px' }}>Upload financial documents to get AI-powered analysis</p>
            </div>
          )}
        </div>
      </div>
      
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
            setShowUploadLimitModal(false);
          }}
        />
      )}
    </div>
  );
}

export default App;