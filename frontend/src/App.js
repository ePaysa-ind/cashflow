import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import { useNavigate } from 'react-router-dom';
import UploadLimitModal from './components/UploadLimitModal';
import Profile from './components/Profile';
import Documents from './components/Documents';
import './App.css';

function App() {
  const navigate = useNavigate();
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [chatHistory, setChatHistory] = useState([]); // Changed from chatResponse to chatHistory
  const [expandedMessages, setExpandedMessages] = useState({}); // Track which messages are expanded
  const [userTier, setUserTier] = useState(null);
  const [uploadsRemaining, setUploadsRemaining] = useState(4); // Default to 4 for free tier
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(0);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [showNudge, setShowNudge] = useState(false);
  const [currentNudge, setCurrentNudge] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [processingStatus, setProcessingStatus] = useState('');
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard'); // Track active menu item
  const [activeNudgeButton, setActiveNudgeButton] = useState(null); // Track active nudge button
  const [lastActivity, setLastActivity] = useState(Date.now()); // Track last user activity
  const [showAutoSaveIndicator, setShowAutoSaveIndicator] = useState(false); // Show auto-save status
  const [showIdleWarning, setShowIdleWarning] = useState(false); // Show idle warning modal
  const [showExportMenu, setShowExportMenu] = useState(false); // Show export dropdown menu
  const [showUploadLimitModal, setShowUploadLimitModal] = useState(false); // Show upload limit modal
  const [analyzedDocumentHashes, setAnalyzedDocumentHashes] = useState(new Set()); // Track analyzed documents
  const [uploadsThisMonth, setUploadsThisMonth] = useState(0); // Current month's upload count
  const [showProfileModal, setShowProfileModal] = useState(false); // Show profile modal
  const [profileCompletion, setProfileCompletion] = useState(0); // Profile completion percentage
  const [showDocumentsModal, setShowDocumentsModal] = useState(false); // Show documents modal

  const API_URL = process.env.NODE_ENV === 'production' 
    ? 'https://localhost:5443/api'  // Use your production domain
    : 'https://localhost:5443/api'; // Development HTTPS (certificates now ready!)
  const maxFiles = 2;
  const maxSize = 20 * 1024 * 1024; // 20MB

  const currentSize = uploadedFiles.reduce((sum, f) => sum + f.size, 0);
  const limitsReached = uploadedFiles.length >= maxFiles || currentSize >= maxSize;

  // Generate hash for document to track re-analyses
  const generateDocumentHash = async (file) => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  // Calculate days until monthly reset
  const getDaysUntilReset = () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const diffTime = Math.abs(nextMonth - now);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Define all callback functions before useEffect
  const checkBackendHealth = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/health`);
      console.log('Backend health:', response.data);
    } catch (err) {
      console.error('Backend health check failed:', err);
    }
  }, [API_URL]);

  const saveCurrentSession = useCallback(() => {
    const user = auth.currentUser;
    if (!user) return;
    
    const sessionData = {
      timestamp: Date.now(),
      analysis: analysis,
      // Don't save chat history - it should be fresh for each session
      // Note: We don't save actual file objects, just metadata
      uploadedFilesMetadata: uploadedFiles.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type,
        lastModified: f.lastModified
      }))
    };
    
    const sessionKey = `qash_session_${user.uid}`;
    localStorage.setItem(sessionKey, JSON.stringify(sessionData));
    
    // Show auto-save indicator
    setShowAutoSaveIndicator(true);
    setTimeout(() => setShowAutoSaveIndicator(false), 2000);
  }, [analysis, uploadedFiles]);

  const handleLogout = useCallback(async () => {
    try {
      // Save session before logout
      saveCurrentSession();
      await signOut(auth);
      navigate('/'); // Redirect to landing page, not login
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [navigate, saveCurrentSession]);

  // Initial setup effect - runs only once on mount
  useEffect(() => {
    checkBackendHealth();
    checkUserTier();
    loadUserProfile();
    checkAndShowNudge();
    loadAutoSavedData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - runs only once on mount

  // Activity tracking effect
  useEffect(() => {
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const updateActivity = () => setLastActivity(Date.now());
    
    activityEvents.forEach(event => {
      window.addEventListener(event, updateActivity);
    });
    
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, []); // Only set up once

  // Click outside handler for export menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportMenu && !event.target.closest('.export-menu-container')) {
        setShowExportMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

  // Session timeout check effect
  useEffect(() => {
    const timeoutInterval = setInterval(() => {
      const inactiveTime = Date.now() - lastActivity;
      const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
      const eightHours = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
      
      // Show warning after 1 hour of inactivity
      if (inactiveTime > oneHour && inactiveTime < eightHours && !showIdleWarning) {
        setShowIdleWarning(true);
      }
      
      // Force logout after 8 hours
      if (inactiveTime > eightHours) {
        // Save current state before logout
        saveCurrentSession();
        handleLogout();
        alert('Your session has expired due to inactivity. Please log in again.');
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(timeoutInterval);
  }, [lastActivity, showIdleWarning, saveCurrentSession, handleLogout]);

  // Auto-save effect
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (analysis || uploadedFiles.length > 0) {
        saveCurrentSession();
      }
    }, 30000);
    
    return () => clearInterval(autoSaveInterval);
  }, [analysis, uploadedFiles, saveCurrentSession]);

  const checkUserTier = () => {
    const user = auth.currentUser;
    if (user) {
      const userDataKey = `moneylens_user_${user.uid}`;
      const userData = JSON.parse(localStorage.getItem(userDataKey) || '{}');
      
      // Initialize trial start date if not exists
      if (!userData.trialStartDate) {
        userData.trialStartDate = new Date().toISOString();
        userData.tier = 'free';
        localStorage.setItem(userDataKey, JSON.stringify(userData));
      }
      
      // Check trial status
      const now = new Date();
      const trialStart = new Date(userData.trialStartDate);
      const daysSinceStart = Math.floor((now - trialStart) / (1000 * 60 * 60 * 24));
      const trialDays = 30 - daysSinceStart;
      
      setTrialDaysRemaining(Math.max(0, trialDays));
      setIsTrialExpired(trialDays <= 0);
      
      // Check if we need to reset monthly uploads
      const lastReset = userData.lastUploadReset ? new Date(userData.lastUploadReset) : new Date();
      
      // Reset if it's a new month
      if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
        userData.uploadsThisMonth = 0;
        userData.lastUploadReset = now.toISOString();
        localStorage.setItem(userDataKey, JSON.stringify(userData));
      }
      
      setUserTier(userData.tier || 'free');
      const uploadsUsed = userData.uploadsThisMonth || 0;
      setUploadsThisMonth(uploadsUsed); // Set the state
      // Free tier gets 4 uploads per month during trial
      const monthlyLimit = userData.tier === 'free' ? 4 : 999;
      setUploadsRemaining(Math.max(0, monthlyLimit - uploadsUsed));
    }
  };

  // Helper function to safely get initials
  const getInitials = (fullName) => {
    if (!fullName || typeof fullName !== 'string') return '?';
    
    const parts = fullName.trim().split(' ').filter(part => part.length > 0);
    if (parts.length === 0) return '?';
    
    if (parts.length === 1) {
      // Single word name - take first two characters
      return parts[0].substring(0, 2).toUpperCase();
    } else {
      // Multiple words - take first character of first and last
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
  };

  const loadUserProfile = () => {
    const user = auth.currentUser;
    if (user) {
      // First try to load the new profile format
      const qashProfileKey = `qash_profile_${user.uid}`;
      const qashProfile = JSON.parse(localStorage.getItem(qashProfileKey) || '{}');
      
      if (qashProfile.fullName) {
        // Use new profile format with calculated initials
        setUserProfile({
          ...qashProfile,
          email: qashProfile.email || user.email,
          initials: getInitials(qashProfile.fullName)
        });
        setProfileForm(qashProfile);
        
        // Calculate profile completion
        const requiredFields = ['fullName', 'email', 'company', 'industry', 'role'];
        const optionalFields = ['zip', 'revenue', 'employees', 'fiscalYear', 'phone'];
        const totalFields = requiredFields.length + optionalFields.length;
        let filledFields = 0;
        
        requiredFields.forEach(field => {
          if (qashProfile[field]?.trim()) filledFields++;
        });
        
        optionalFields.forEach(field => {
          if (qashProfile[field]?.trim()) filledFields++;
        });
        
        const completion = Math.round((filledFields / totalFields) * 100);
        setProfileCompletion(completion);
      } else {
        // Fallback to old format
        const userDataKey = `moneylens_user_${user.uid}`;
        const userData = JSON.parse(localStorage.getItem(userDataKey) || '{}');
        if (userData.profile) {
          setUserProfile({
            ...userData.profile,
            initials: getInitials(userData.profile.fullName)
          });
          setProfileForm(userData.profile);
        } else {
          // No profile found - set default with email
          setUserProfile({
            email: user.email,
            fullName: '',
            initials: getInitials(user.email) // Use email as fallback
          });
        }
        setProfileCompletion(0); // Old format likely incomplete
      }
    }
  };

  const checkAndShowNudge = () => {
    const user = auth.currentUser;
    if (user) {
      const userDataKey = `moneylens_user_${user.uid}`;
      const userData = JSON.parse(localStorage.getItem(userDataKey) || '{}');
      
      // Check if nudge was already shown today
      const today = new Date().toDateString();
      const lastShown = userData.nudges?.lastShown;
      
      if (!lastShown || new Date(lastShown).toDateString() !== today) {
        // Determine which nudge to show based on profile completion
        const profile = userData.profile || {};
        let nudgeToShow = null;
        
        if (!profile.industry) {
          nudgeToShow = {
            title: "Complete Your Profile",
            message: "Add your industry to get tailored financial insights",
            action: "Add Industry",
            field: "industry"
          };
        } else if (!profile.revenue) {
          nudgeToShow = {
            title: "Revenue Range",
            message: "Help us provide benchmarks for your business size",
            action: "Add Revenue",
            field: "revenue"
          };
        } else if (!profile.employees) {
          nudgeToShow = {
            title: "Team Size",
            message: "Get insights based on companies your size",
            action: "Add Team Size",
            field: "employees"
          };
        }
        
        if (nudgeToShow) {
          setCurrentNudge(nudgeToShow);
          setTimeout(() => setShowNudge(true), 2000); // Show after 2 seconds
        }
      }
    }
  };

  const updateProfile = (field, value) => {
    const user = auth.currentUser;
    if (user) {
      const userDataKey = `moneylens_user_${user.uid}`;
      const userData = JSON.parse(localStorage.getItem(userDataKey) || '{}');
      
      userData.profile = {
        ...userData.profile,
        [field]: value
      };
      
      // Calculate profile completion
      const requiredFields = ['fullName', 'email', 'industry', 'zip', 'revenue', 'employees', 'fiscalYear'];
      const filledFields = requiredFields.filter(f => userData.profile[f]);
      userData.profile.profileComplete = filledFields.length === requiredFields.length;
      
      localStorage.setItem(userDataKey, JSON.stringify(userData));
      setUserProfile(userData.profile);
      setProfileForm(userData.profile);
    }
  };

  const dismissNudge = () => {
    setShowNudge(false);
    const user = auth.currentUser;
    if (user) {
      const userDataKey = `moneylens_user_${user.uid}`;
      const userData = JSON.parse(localStorage.getItem(userDataKey) || '{}');
      userData.nudges = {
        lastShown: new Date().toISOString(),
        shownToday: true
      };
      localStorage.setItem(userDataKey, JSON.stringify(userData));
    }
  };

  const getProfileCompletion = () => {
    if (!userProfile) return 0;
    const requiredFields = ['fullName', 'email', 'industry', 'zip', 'revenue', 'employees', 'fiscalYear'];
    const filledFields = requiredFields.filter(field => userProfile[field]);
    return Math.round((filledFields.length / requiredFields.length) * 100);
  };
  
  const handleContinueSession = () => {
    setLastActivity(Date.now());
    setShowIdleWarning(false);
  };
  
  const loadAutoSavedData = () => {
    const user = auth.currentUser;
    if (!user) return;
    
    const sessionKey = `qash_session_${user.uid}`;
    const savedSession = localStorage.getItem(sessionKey);
    
    if (savedSession) {
      try {
        const sessionData = JSON.parse(savedSession);
        
        // Check if session is less than 24 hours old
        const sessionAge = Date.now() - sessionData.timestamp;
        const twentyFourHours = 24 * 60 * 60 * 1000;
        
        if (sessionAge < twentyFourHours) {
          // Restore session data
          if (sessionData.analysis) setAnalysis(sessionData.analysis);
          // Don't restore chat history - keep it fresh
          
          // Show notification that data was restored
          if (sessionData.analysis || sessionData.chatHistory?.length > 0) {
            setError('Previous session restored. Upload new files to continue analysis.');
            setTimeout(() => setError(''), 5000);
          }
        } else {
          // Clear old session data
          localStorage.removeItem(sessionKey);
        }
      } catch (error) {
        console.error('Error loading saved session:', error);
        localStorage.removeItem(sessionKey);
      }
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (limitsReached) return;
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (limitsReached) {
      setError('Upload limit reached. Cannot add more files.');
      return;
    }
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e) => {
    if (limitsReached) {
      setError('Upload limit reached. Cannot add more files.');
      e.target.value = '';
      return;
    }
    
    const files = Array.from(e.target.files);
    handleFiles(files);
    e.target.value = '';
  };

  const handleFiles = (files) => {
    setError('');
    
    if (uploadedFiles.length + files.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed. You currently have ${uploadedFiles.length} files.`);
      return;
    }

    const newSize = files.reduce((sum, f) => sum + f.size, 0);
    if (currentSize + newSize > maxSize) {
      const remainingSize = ((maxSize - currentSize) / (1024 * 1024)).toFixed(1);
      setError(`Total file size would exceed 20MB limit. You have ${remainingSize}MB remaining.`);
      return;
    }

    const validFiles = [];
    for (const file of files) {
      if (uploadedFiles.some(f => f.name === file.name && f.size === file.size)) {
        setError(`File "${file.name}" is already uploaded.`);
        return;
      }
      
      if (file.size > maxSize) {
        setError(`File "${file.name}" is too large. Maximum file size is 20MB.`);
        return;
      }
      
      validFiles.push(file);
    }

    if (uploadedFiles.length + validFiles.length > maxFiles) {
      setError(`Cannot add ${validFiles.length} files. Maximum ${maxFiles} files allowed.`);
      return;
    }

    const finalSize = currentSize + validFiles.reduce((sum, f) => sum + f.size, 0);
    if (finalSize > maxSize) {
      setError('Adding these files would exceed 20MB limit.');
      return;
    }

    setUploadedFiles([...uploadedFiles, ...validFiles]);
  };

  const removeFile = (fileName) => {
    setUploadedFiles(uploadedFiles.filter(f => f.name !== fileName));
    if (uploadedFiles.length === 1) {
      setAnalysis(null);
      setChatHistory([]); // Clear chat when last document is removed
    }
    setError('');
  };

  const handleAnalyze = async () => {
    if (uploadedFiles.length === 0) return;

    // Check if trial has expired
    if (userTier === 'free' && isTrialExpired) {
      setError('Your 30-day free trial has expired. Please upgrade to Pro to continue analyzing documents.');
      return;
    }

    // Check if this is a re-analysis of already analyzed documents
    let isReAnalysis = true;
    const newHashes = [];
    
    for (const file of uploadedFiles) {
      const hash = await generateDocumentHash(file);
      newHashes.push(hash);
      if (!analyzedDocumentHashes.has(hash)) {
        isReAnalysis = false;
      }
    }

    // Check upload limit for free tier (only for new documents)
    if (userTier === 'free' && uploadsRemaining <= 0 && !isReAnalysis) {
      setShowUploadLimitModal(true);
      return;
    }

    setLoading(true);
    setError('');
    setUploadProgress(0);
    setChatHistory([]); // Clear chat when new analysis starts
    
    try {
      // Cloud processing only - 100% SaaS
      setProcessingStatus('Uploading documents to cloud...');
      setUploadProgress(10);
      
      const formData = new FormData();
      uploadedFiles.forEach(file => {
        console.log('Appending file:', file.name, 'Size:', file.size, 'Type:', file.type);
        formData.append('documents', file);
      });

      console.log('Sending request to:', `${API_URL}/analyze`);
      console.log('Number of files:', uploadedFiles.length);
      
      setUploadProgress(25);
      setProcessingStatus('Processing documents with AI...');

      const response = await axios.post(`${API_URL}/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      setUploadProgress(75);

      // Check if any files have errors
      const filesWithErrors = response.data.files.filter(f => f.error);
      if (filesWithErrors.length > 0) {
        // Show error for non-financial documents
        const errorMessages = filesWithErrors.map(f => `${f.fileName}: ${f.error}`).join('\n');
        setError(errorMessages);
        // Clear any partial analysis
        setAnalysis(null);
      } else {
        // Update upload count for free tier (only for new documents)
        if (userTier === 'free' && !isReAnalysis) {
          const user = auth.currentUser;
          const userDataKey = `moneylens_user_${user.uid}`;
          const userData = JSON.parse(localStorage.getItem(userDataKey) || '{}');
          userData.uploadsThisMonth = (userData.uploadsThisMonth || 0) + 1;
          localStorage.setItem(userDataKey, JSON.stringify(userData));
          setUploadsRemaining(Math.max(0, 4 - userData.uploadsThisMonth));
          setUploadsThisMonth(userData.uploadsThisMonth);
          
          // Add document hashes to tracked set
          const updatedHashes = new Set(analyzedDocumentHashes);
          newHashes.forEach(hash => updatedHashes.add(hash));
          setAnalyzedDocumentHashes(updatedHashes);
        }
      
        const analysisResult = {
          files: response.data.files,
          totalFiles: response.data.totalFiles,
          text: response.data.files.map(f => f.fileName).join(', ') + ' analyzed',
          analysis: response.data.files.length > 0 ? response.data.files[0].analysis : null
        };
        
        setAnalysis(analysisResult);
        
        // Automatically save to documents
        saveToDocuments(analysisResult, uploadedFiles);
      }
      
      setUploadProgress(100);
    } catch (err) {
      console.error('Upload Error Details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          headers: err.config?.headers
        }
      });
      console.error('Full error object:', err);
      setError(err.response?.data?.error || err.message || 'An error occurred during analysis');
    } finally {
      setLoading(false);
      setUploadProgress(0);
      setProcessingStatus('');
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) {
      return;
    }

    // Check if user profile exists and has a name
    if (!userProfile || !userProfile.fullName || userProfile.fullName.trim() === '') {
      setChatHistory(prev => [...prev, {
        type: 'system',
        message: 'Please complete your profile to continue. Click on your profile icon in the top right corner to add your name and other details. This helps us personalize your experience.',
        timestamp: new Date()
      }]);
      setShowProfileModal(true); // Open profile modal
      return;
    }

    if (!analysis?.files?.length) {
      setChatHistory([{
        type: 'system',
        message: 'Please analyze documents first before asking questions',
        timestamp: new Date()
      }]);
      return;
    }

    const userMessage = chatInput.trim();
    setChatInput('');
    
    // Add new user message to history
    const newMessageId = Date.now();
    setChatHistory(prev => [...prev, {
      id: newMessageId,
      type: 'user',
      message: userMessage,
      timestamp: new Date()
    }]);
    
    // Collapse all previous messages by setting them to false
    const collapsedState = {};
    for (let i = 0; i < chatHistory.length; i++) {
      collapsedState[i] = false;
    }
    setExpandedMessages(collapsedState);

    setIsChatLoading(true);

    try {
      console.log('Analysis state:', analysis);
      console.log('Sending chat request:', {
        query: userMessage,
        documents: analysis.files
      });

      // Send full documents for chat analysis
      const chatData = {
        query: userMessage,
        documents: analysis.files
      };
      
      const response = await axios.post(`${API_URL}/chat`, chatData);

      // Add AI response to history
      setChatHistory(prev => [...prev, {
        type: 'ai',
        message: response.data.response,
        timestamp: new Date()
      }]);
    } catch (err) {
      console.error('Chat Error Details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
        requestData: {
          query: userMessage,
          documents: analysis?.files || []
        }
      });
      
      // Add error message to history
      setChatHistory(prev => [...prev, {
        type: 'error',
        message: `Error: ${err.response?.data?.error || err.message}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const insertNudgeText = (text) => {
    setChatInput(text);
  };

  const handleUpgradeClick = () => {
    setShowUploadLimitModal(false);
    // Navigate to billing page or show upgrade modal
    setActiveMenuItem('billing');
    // You can implement the actual upgrade flow here
  };

  const saveToDocuments = (analysisData, files) => {
    const user = auth.currentUser;
    if (!user) return;
    
    const documentsKey = `qash_documents_${user.uid}`;
    const existingDocs = JSON.parse(localStorage.getItem(documentsKey) || '[]');
    
    const newDocument = {
      id: Date.now().toString(),
      fileName: files.map(f => f.name).join(', '),
      fileCount: files.length,
      uploadDate: new Date().toISOString(),
      analysis: analysisData,
      size: files.reduce((sum, f) => sum + f.size, 0),
      status: 'completed'
    };
    
    // Add to beginning of array (most recent first)
    existingDocs.unshift(newDocument);
    
    // Keep only last 100 documents
    if (existingDocs.length > 100) {
      existingDocs.pop();
    }
    
    localStorage.setItem(documentsKey, JSON.stringify(existingDocs));
    
    // Show success notification
    const successMsg = document.createElement('div');
    successMsg.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: #10b981;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      z-index: 9999;
      animation: slideIn 0.3s ease-out;
    `;
    successMsg.textContent = 'Analysis saved to Documents';
    document.body.appendChild(successMsg);
    setTimeout(() => document.body.removeChild(successMsg), 3000);
  };

  const handleProfileUpdate = (updatedProfile) => {
    // Ensure initials are always calculated
    const profileWithInitials = {
      ...updatedProfile,
      initials: getInitials(updatedProfile.fullName)
    };
    setUserProfile(profileWithInitials);
    setProfileForm(updatedProfile);
    setProfileCompletion(updatedProfile.completionPercentage || 0);
  };

  const handleViewDocument = (doc) => {
    // Load the saved analysis
    setAnalysis(doc.analysis);
    setShowDocumentsModal(false);
    
    // Show notification
    const msg = document.createElement('div');
    msg.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: #3B82F6;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      z-index: 9999;
      animation: slideIn 0.3s ease-out;
    `;
    msg.textContent = 'Document loaded successfully';
    document.body.appendChild(msg);
    setTimeout(() => document.body.removeChild(msg), 3000);
  };

  const exportChat = (saveToHistory = false) => {
    if (chatHistory.length === 0) return;
    
    // Create chat content
    let chatContent = `Qash Document Q&A Export\n`;
    chatContent += `Date: ${new Date().toLocaleString()}\n`;
    chatContent += `Documents: ${uploadedFiles.map(f => f.name).join(', ')}\n`;
    chatContent += `${'-'.repeat(80)}\n\n`;
    
    // Add chat messages
    chatHistory.forEach((msg, index) => {
      const timestamp = new Date(msg.timestamp).toLocaleTimeString();
      const sender = msg.type === 'user' ? userProfile?.initials || 'User' : 
                     msg.type === 'ai' ? 'Qash' : 'System';
      
      chatContent += `[${timestamp}] ${sender}:\n`;
      chatContent += `${msg.message}\n\n`;
    });
    
    // Create filename with document name and timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    // Use the actual document name without extension
    const docName = uploadedFiles.length > 0 
      ? uploadedFiles[0].name.replace(/\.[^/.]+$/, '') // Remove file extension
      : 'chat';
    const filename = `${docName}_${timestamp}.txt`;
    
    if (saveToHistory) {
      // Save to analysis history in localStorage
      const user = auth.currentUser;
      if (user) {
        const historyKey = `qash_analysis_history_${user.uid}`;
        const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
        
        history.push({
          id: Date.now(),
          filename: filename,
          content: chatContent,
          documentName: uploadedFiles[0]?.name || 'Unknown',
          date: new Date().toISOString(),
          type: 'chat_export'
        });
        
        // Keep only last 50 items
        if (history.length > 50) {
          history.shift();
        }
        
        localStorage.setItem(historyKey, JSON.stringify(history));
        
        // Show success message
        setError(''); // Clear any existing errors
        const successMsg = document.createElement('div');
        successMsg.style.cssText = `
          position: fixed;
          bottom: 20px;
          right: 20px;
          background-color: #10b981;
          color: white;
          padding: 12px 20px;
          border-radius: 6px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          z-index: 9999;
          animation: slideIn 0.3s ease-out;
        `;
        successMsg.textContent = 'Chat saved to analysis history';
        document.body.appendChild(successMsg);
        setTimeout(() => document.body.removeChild(successMsg), 3000);
      }
    } else {
      // Download to local device
      const blob = new Blob([chatContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  // Calculate enhanced CFO metrics from analysis data
  const getCFOMetrics = () => {
    if (!analysis?.files) return null;

    let totalAmount = 0;
    let highUrgencyCount = 0;
    let overdueCount = 0;
    let avgConfidence = 0;
    
    const validAnalyses = analysis.files.filter(f => f.analysis && !f.analysis.rawAnalysis);
    
    validAnalyses.forEach(file => {
      const data = file.analysis;
      
      // Extract numeric amount
      if (data.amount) {
        const numericAmount = parseFloat(data.amount.replace(/[^\d.-]/g, ''));
        if (!isNaN(numericAmount)) totalAmount += numericAmount;
      }
      
      // Count urgency levels
      if (data.urgencyLevel === 'HIGH') highUrgencyCount++;
      
      // Check if overdue
      if (data.dueDate) {
        const dueDate = new Date(data.dueDate);
        if (dueDate < new Date() && !isNaN(dueDate)) overdueCount++;
      }
      
      // Average confidence
      if (data.confidence === 'HIGH') avgConfidence += 90;
      else if (data.confidence === 'MEDIUM') avgConfidence += 70;
      else avgConfidence += 50;
    });

    if (validAnalyses.length > 0) {
      avgConfidence = Math.round(avgConfidence / validAnalyses.length);
    }

    // Get the primary document type
    const documentTypes = validAnalyses.map(f => f.analysis?.documentType).filter(Boolean);
    const primaryDocType = documentTypes[0] || 'unknown';

    return {
      totalAmount,
      highUrgencyCount,
      overdueCount,
      avgConfidence,
      documentsProcessed: validAnalyses.length,
      executiveSummary: validAnalyses[0]?.analysis?.executiveSummary || {},
      riskAssessment: validAnalyses[0]?.analysis?.riskAssessment || {},
      actionableInsights: validAnalyses[0]?.analysis?.actionableInsights || {},
      alertsAndFlags: validAnalyses[0]?.analysis?.alertsAndFlags || {},
      boardReporting: validAnalyses[0]?.analysis?.boardReporting || {},
      documentType: primaryDocType,
      hasFinancialMetrics: !!(validAnalyses[0]?.analysis?.executiveSummary?.revenueGrowth || 
                             validAnalyses[0]?.analysis?.executiveSummary?.grossMargin ||
                             validAnalyses[0]?.analysis?.executiveSummary?.workingCapital)
    };
  };

  // Format amount with proper units (millions/billions)
  const formatAmount = (amount) => {
    if (amount >= 1000000) {
      return amount >= 1000000000 
        ? `$${(amount / 1000000000).toFixed(1)}B`
        : `$${(amount / 1000000).toFixed(0)}M`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const cfoMetrics = getCFOMetrics();

  // SVG Icon Components
  const icons = {
    profile: (color = '#6B7280') => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    documents: (color = '#6B7280') => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 2V8H20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 13H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 17H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 9H9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    settings: (color = '#6B7280') => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    billing: (color = '#6B7280') => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 9H21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21 7V17C21 17.5304 20.7893 18.0391 20.4142 18.4142C20.0391 18.7893 19.5304 19 19 19H5C4.46957 19 3.96086 18.7893 3.58579 18.4142C3.21071 18.0391 3 17.5304 3 17V7C3 6.46957 3.21071 5.96086 3.58579 5.58579C3.96086 5.21071 4.46957 5 5 5H19C19.5304 5 20.0391 5.21071 20.4142 5.58579C20.7893 5.96086 21 6.46957 21 7Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 15H16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    glossary: (color = '#6B7280') => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    logout: (color = '#6B7280') => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 17L21 12L16 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21 12H9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    clock: (color = '#6B7280') => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 6V12L16 14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    chart: (color = '#6B7280') => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 20V10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 20V4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6 20V14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    lock: (color = '#6B7280') => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    search: (color = '#6B7280') => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21 21L16.65 16.65" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    money: (color = '#6B7280') => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2V22" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    arrowUpRight: (color = '#6B7280') => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 17L17 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 7H17V17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    cloud: (color = '#6B7280') => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 10H16.74C16.3659 8.55239 15.4895 7.28724 14.2586 6.42062C13.0277 5.55401 11.5221 5.14586 10.0195 5.26776C8.51692 5.38966 7.11288 6.03371 6.04289 7.08739C4.9729 8.14106 4.30452 9.53743 4.15335 11.0363C2.88246 11.242 1.73611 11.9161 0.934378 12.9241C0.132648 13.9321 -0.268615 15.2017 -0.196056 16.4839C-0.123497 17.7661 0.417952 18.9701 1.32868 19.8767C2.2394 20.7833 3.45416 21.3275 4.73737 21.4H18C19.0609 21.4 20.0783 20.9786 20.8284 20.2284C21.5786 19.4783 22 18.4609 22 17.4C22 16.3391 21.5786 15.3217 20.8284 14.5716C20.0783 13.8214 19.0609 13.4 18 13.4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    alert: (color = '#6B7280') => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="12" y1="17" x2="12.01" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    target: (color = '#6B7280') => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="12" r="6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="12" r="2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    clipboard: (color = '#6B7280') => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 4H18C18.5304 4 19.0391 4.21071 19.4142 4.58579C19.7893 4.96086 20 5.46957 20 6V20C20 20.5304 19.7893 21.0391 19.4142 21.4142C19.0391 21.7893 18.5304 22 18 22H6C5.46957 22 4.96086 21.7893 4.58579 21.4142C4.21071 21.0391 4 20.5304 4 20V6C4 5.46957 4.21071 4.96086 4.58579 4.58579C4.96086 4.21071 5.46957 4 6 4H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    fire: (color = '#6B7280') => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 14C19 16.7625 17.5125 19.0625 15.2875 20.0875C14.025 20.675 12.55 21 11 21C6.02944 21 2 16.9706 2 12C2 9.8 2.775 7.78125 4.06875 6.2C5.54375 4.38125 7.68125 3.21875 10.0875 3.01875C10.6375 2.975 11.2 3 11.7625 3.0625C13.2 3.225 14.5375 3.7375 15.6625 4.5C15.8625 4.6375 16.05 4.7875 16.2375 4.95C16.5375 5.2125 16.825 5.5 17.0875 5.8C18.5125 7.625 19.0125 9.3125 19 11.0625C19 11.6375 18.9375 12.1875 18.8125 12.7125C18.7625 12.9625 18.6875 13.2 18.6 13.425C18.55 13.5625 18.4875 13.6875 18.425 13.8125C18.3625 13.9375 18.2875 14.05 18.2125 14.1625C18.15 14.2625 18.075 14.3625 18 14.45C17.925 14.5375 17.85 14.625 17.775 14.7C17.5875 14.9 17.375 15.075 17.15 15.225C16.925 15.375 16.675 15.5 16.425 15.6C16.1625 15.7 15.8875 15.775 15.6 15.825C15.3125 15.875 15.025 15.9 14.7375 15.9C14.4 15.9 14.075 15.8625 13.75 15.8C13.425 15.7375 13.1125 15.6375 12.8125 15.5125C12.5125 15.3875 12.225 15.2375 11.9625 15.05C11.7 14.8625 11.4625 14.65 11.25 14.4125C11.0375 14.175 10.85 13.925 10.6875 13.65C10.525 13.375 10.3875 13.0875 10.2875 12.7875C10.1875 12.4875 10.1125 12.175 10.075 11.8625C10.0375 11.55 10.025 11.225 10.05 10.9C10.075 10.575 10.125 10.25 10.2125 9.925C10.3 9.6 10.4125 9.2875 10.5625 8.9875C10.7125 8.6875 10.8875 8.4 11.0875 8.1375C11.2875 7.875 11.5125 7.625 11.7625 7.4125C12.0125 7.2 12.275 7.0125 12.5625 6.85C12.85 6.6875 13.15 6.5625 13.4625 6.4625C13.775 6.3625 14.1 6.3 14.425 6.2625C14.75 6.225 15.075 6.225 15.4 6.25C15.7375 6.275 16.0625 6.3375 16.3875 6.425C16.7125 6.5125 17.025 6.6375 17.3125 6.7875C17.6 6.9375 17.875 7.1125 18.125 7.3125C18.375 7.5125 18.6 7.7375 18.8 7.9875C19 8.2375 19.175 8.5 19.3125 8.7875C19.45 9.075 19.5625 9.375 19.6375 9.6875C19.7125 10 19.75 10.325 19.7625 10.65C19.775 10.975 19.75 11.3 19.7 11.625C19.65 11.95 19.5625 12.2625 19.45 12.5625C19.3375 12.8625 19.1875 13.15 19 13.425V14Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    scissors: (color = '#6B7280') => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="6" cy="6" r="3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="6" cy="18" r="3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="20" y1="4" x2="8.12" y2="15.88" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="14.47" y1="14.48" x2="20" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="8.12" y1="8.12" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    download: (color = '#6B7280') => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="7 10 12 15 17 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="12" y1="15" x2="12" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
        @keyframes slideIn {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-100%);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes nudgeSlideIn {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
      
      {/* Fixed Header */}
      <div style={{
        backgroundColor: '#1f2937',
        color: 'white',
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        height: '60px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            ☰
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img 
              src="/qash-logo.png" 
              alt="Qash Logo" 
              style={{ 
                height: '36px', 
                width: '36px',
                objectFit: 'contain'
              }} 
            />
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
              Cash Flow Analyzer
            </h1>
          </div>
          {showAutoSaveIndicator && (
            <span style={{
              fontSize: '12px',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              animation: 'fadeIn 0.3s ease-out'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Auto-saved
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        </div>
      </div>
      
      {/* Hamburger Menu */}
      {showMenu && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setShowMenu(false)}
            style={{
              position: 'fixed',
              top: '60px', // Start below header
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1999,
              animation: 'fadeIn 0.3s ease-out'
            }}
          />
          
          {/* Menu Panel */}
          <div style={{
            position: 'fixed',
            top: '60px', // Start below header
            left: 0,
            bottom: 0,
            width: '300px',
            backgroundColor: 'white',
            boxShadow: '2px 0 8px rgba(0, 0, 0, 0.15)',
            zIndex: 2000,
            animation: 'slideIn 0.3s ease-out',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Menu Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', color: '#1f2937' }}>Account Menu</h2>
                <button
                  onClick={() => setShowMenu(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#6b7280',
                    padding: '0',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ×
                </button>
              </div>
              
              {/* Profile Info */}
              {userProfile && (
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937' }}>
                    {userProfile.fullName}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    {userProfile.email}
                  </div>
                  {userProfile.companyName && (
                    <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                      {userProfile.companyName}
                    </div>
                  )}
                  
                  {/* Profile Completion */}
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Profile Completion</span>
                      <span style={{ fontSize: '12px', fontWeight: '500', color: getProfileCompletion() === 100 ? '#10b981' : '#f59e0b' }}>
                        {getProfileCompletion()}%
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '6px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${getProfileCompletion()}%`,
                        height: '100%',
                        backgroundColor: getProfileCompletion() === 100 ? '#10b981' : '#f59e0b',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Menu Items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {/* Trial Status and Upload Limit */}
              {userTier === 'free' && (
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '6px',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '8px'
                  }}>
                    {icons.clock(trialDaysRemaining > 0 ? '#059669' : '#dc2626')}
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontWeight: '500', 
                        color: trialDaysRemaining > 0 ? '#059669' : '#dc2626'
                      }}>
                        {trialDaysRemaining > 0 ? `${trialDaysRemaining} days left in trial` : 'Trial Expired'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {trialDaysRemaining > 0 ? 'Upgrade to Pro for unlimited access' : 'Upgrade now to continue'}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    {icons.chart('#1e40af')}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', color: '#1e40af' }}>
                        {uploadsRemaining} uploads remaining
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        Monthly limit: 4 documents
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <button
                onClick={() => {
                  setShowProfileModal(true);
                  setShowMenu(false);
                  setActiveMenuItem('profile');
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: activeMenuItem === 'profile' ? '#f3f4f6' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: activeMenuItem === 'profile' ? '#1f2937' : '#374151',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = activeMenuItem === 'profile' ? '#f3f4f6' : 'transparent'}
              >
                <div style={{ position: 'relative' }}>
                  {icons.profile(profileCompletion === 100 ? '#10B981' : '#F59E0B')}
                  {profileCompletion < 100 && (
                    <span style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      backgroundColor: '#F59E0B',
                      color: 'white',
                      fontSize: '10px',
                      padding: '2px 4px',
                      borderRadius: '10px',
                      fontWeight: '600'
                    }}>
                      {profileCompletion}%
                    </span>
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: '500' }}>Profile</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {profileCompletion === 100 ? 'Complete' : `${profileCompletion}% complete`}
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setShowDocumentsModal(true);
                  setShowMenu(false);
                  setActiveMenuItem('documents');
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: activeMenuItem === 'documents' ? '#f3f4f6' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: activeMenuItem === 'documents' ? '#1f2937' : '#374151',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = activeMenuItem === 'documents' ? '#f3f4f6' : 'transparent'}
              >
                {icons.documents(activeMenuItem === 'documents' ? '#1f2937' : '#6B7280')}
                <div>
                  <div style={{ fontWeight: '500' }}>Documents</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>View analysis history</div>
                </div>
              </button>
              
              <button
                onClick={() => setActiveMenuItem('settings')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: activeMenuItem === 'settings' ? '#f3f4f6' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: activeMenuItem === 'settings' ? '#1f2937' : '#374151',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = activeMenuItem === 'settings' ? '#f3f4f6' : 'transparent'}
              >
                {icons.settings(activeMenuItem === 'settings' ? '#1f2937' : '#6B7280')}
                <div>
                  <div style={{ fontWeight: '500' }}>Settings</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Preferences & notifications</div>
                </div>
              </button>
              
              <button
                onClick={() => setActiveMenuItem('billing')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: activeMenuItem === 'billing' ? '#f3f4f6' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: activeMenuItem === 'billing' ? '#1f2937' : '#374151',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = activeMenuItem === 'billing' ? '#f3f4f6' : 'transparent'}
              >
                {icons.billing(activeMenuItem === 'billing' ? '#1f2937' : '#6B7280')}
                <div>
                  <div style={{ fontWeight: '500' }}>Billing</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {userTier === 'free' ? 'Upgrade to Pro' : 'Manage subscription'}
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setShowGlossary(!showGlossary);
                  setShowMenu(false);
                  setActiveMenuItem('glossary');
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: activeMenuItem === 'glossary' ? '#f3f4f6' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: activeMenuItem === 'glossary' ? '#1f2937' : '#374151',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = activeMenuItem === 'glossary' ? '#f3f4f6' : 'transparent'}
              >
                {icons.glossary(activeMenuItem === 'glossary' ? '#1f2937' : '#6B7280')}
                <div>
                  <div style={{ fontWeight: '500' }}>Glossary</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Financial terms explained</div>
                </div>
              </button>
              
              <div style={{ borderTop: '1px solid #e5e7eb', margin: '8px 0' }} />
              
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#dc2626',
                  textAlign: 'left',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {icons.logout('#dc2626')}
                <div style={{ fontWeight: '500' }}>Logout</div>
              </button>
            </div>
            
            {/* Menu Footer */}
            <div style={{
              padding: '16px',
              borderTop: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
              fontSize: '12px',
              color: '#6b7280'
            }}>
              <div style={{ marginBottom: '4px' }}>Qash v2.2</div>
              <div>© 2025 All rights reserved</div>
            </div>
          </div>
        </>
      )}

      {/* Smart Nudge */}
      {showNudge && currentNudge && (
        <div style={{
          position: 'fixed',
          top: '70px',
          right: '20px',
          width: '320px',
          padding: '16px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          border: '1px solid #e5e7eb',
          zIndex: 1000,
          animation: 'nudgeSlideIn 0.5s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <h4 style={{ margin: 0, fontSize: '16px', color: '#1f2937' }}>{currentNudge.title}</h4>
            <button
              onClick={dismissNudge}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#6b7280',
                padding: '0',
                width: '24px',
                height: '24px'
              }}
            >
              ×
            </button>
          </div>
          <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#6b7280' }}>
            {currentNudge.message}
          </p>
          <button
            onClick={() => {
              setEditingProfile(true);
              dismissNudge();
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            {currentNudge.action}
          </button>
        </div>
      )}

      {/* Profile Edit Modal */}
      {editingProfile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            width: '90%',
            maxWidth: '500px',
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#1f2937' }}>Edit Profile</h2>
              <button
                onClick={() => setEditingProfile(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#374151', marginBottom: '4px' }}>Full Name</label>
                <input
                  type="text"
                  value={profileForm.fullName || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#374151', marginBottom: '4px' }}>Company Name</label>
                <input
                  type="text"
                  value={profileForm.companyName || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, companyName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#374151', marginBottom: '4px' }}>Industry</label>
                <select
                  value={profileForm.industry || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, industry: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select Industry</option>
                  <option value="technology">Technology</option>
                  <option value="finance">Finance</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="retail">Retail</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="services">Services</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#374151', marginBottom: '4px' }}>ZIP Code</label>
                <input
                  type="text"
                  value={profileForm.zip || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, zip: e.target.value })}
                  placeholder="12345"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#374151', marginBottom: '4px' }}>Annual Revenue</label>
                <select
                  value={profileForm.revenue || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, revenue: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select Range</option>
                  <option value="0-1M">$0 - $1M</option>
                  <option value="1M-10M">$1M - $10M</option>
                  <option value="10M-50M">$10M - $50M</option>
                  <option value="50M-100M">$50M - $100M</option>
                  <option value="100M+">$100M+</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#374151', marginBottom: '4px' }}>Number of Employees</label>
                <select
                  value={profileForm.employees || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, employees: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select Range</option>
                  <option value="1-10">1-10</option>
                  <option value="11-50">11-50</option>
                  <option value="51-200">51-200</option>
                  <option value="201-500">201-500</option>
                  <option value="500+">500+</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#374151', marginBottom: '4px' }}>Fiscal Year End</label>
                <select
                  value={profileForm.fiscalYear || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, fiscalYear: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select Month</option>
                  <option value="january">January</option>
                  <option value="february">February</option>
                  <option value="march">March</option>
                  <option value="april">April</option>
                  <option value="may">May</option>
                  <option value="june">June</option>
                  <option value="july">July</option>
                  <option value="august">August</option>
                  <option value="september">September</option>
                  <option value="october">October</option>
                  <option value="november">November</option>
                  <option value="december">December</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => {
                  Object.keys(profileForm).forEach(key => {
                    if (profileForm[key] !== userProfile[key]) {
                      updateProfile(key, profileForm[key]);
                    }
                  });
                  setEditingProfile(false);
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditingProfile(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: 'white',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Glossary Modal */}
      {showGlossary && (
        <div style={{
          position: 'fixed',
          top: '60px',
          right: '20px',
          width: '400px',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #d0d0d0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#1f2937' }}>Financial Metrics Glossary</h3>
            <button 
              onClick={() => setShowGlossary(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#6b7280'
              }}
            >
              ×
            </button>
          </div>
          <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ color: '#374151' }}>Revenue Growth:</strong>
              <div style={{ color: '#6b7280', marginTop: '2px' }}>Year-over-Year percentage change in revenue</div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ color: '#374151' }}>Gross Margin:</strong>
              <div style={{ color: '#6b7280', marginTop: '2px' }}>(Revenue - Cost of Goods Sold) / Revenue</div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ color: '#374151' }}>DSO (Days Sales Outstanding):</strong>
              <div style={{ color: '#6b7280', marginTop: '2px' }}>Average days to collect payment after a sale</div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ color: '#374151' }}>Working Capital:</strong>
              <div style={{ color: '#6b7280', marginTop: '2px' }}>Current Assets - Current Liabilities</div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ color: '#374151' }}>Current Ratio:</strong>
              <div style={{ color: '#6b7280', marginTop: '2px' }}>Current Assets / Current Liabilities (liquidity measure)</div>
            </div>
            <div>
              <strong style={{ color: '#374151' }}>Operating Margin:</strong>
              <div style={{ color: '#6b7280', marginTop: '2px' }}>Operating Income / Revenue (operational efficiency)</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Idle Warning Modal */}
      {showIdleWarning && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '24px' }}>
              {icons.clock('#f59e0b')}
            </div>
            <h2 style={{ 
              margin: '0 0 16px 0', 
              fontSize: '24px', 
              color: '#1f2937',
              fontWeight: '600'
            }}>
              Still there?
            </h2>
            <p style={{ 
              margin: '0 0 24px 0', 
              fontSize: '16px', 
              color: '#6b7280',
              lineHeight: '1.5'
            }}>
              You've been inactive for an hour. Would you like to continue your session? 
              Your work has been auto-saved.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={handleContinueSession}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  minWidth: '120px'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
              >
                Continue
              </button>
              <button
                onClick={handleLogout}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'white',
                  color: '#6b7280',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  minWidth: '120px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f3f4f6';
                  e.target.style.borderColor = '#d1d5db';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.borderColor = '#e5e7eb';
                }}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content Area with Scrolling */}
      <div style={{ 
        flex: 1, 
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column',
        paddingTop: '60px' // Account for fixed header height
      }}>
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left Column - Upload & Chat */}
          <div style={{ width: '40%', padding: '20px', borderRight: '1px solid #d0d0d0', overflowY: 'auto' }}>
            {/* Upload Section */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div>
                  <h2 style={{ color: '#333', fontSize: '18px', margin: 0 }}>Document Analysis</h2>
                  {userTier === 'free' && (
                    <p style={{ 
                      margin: '4px 0 0 0', 
                      fontSize: '12px', 
                      color: uploadsRemaining > 0 ? '#6B7280' : '#DC2626'
                    }}>
                      {uploadsRemaining > 0 
                        ? `${uploadsRemaining} uploads remaining this month`
                        : 'Monthly limit reached - Re-analysis available'
                      }
                    </p>
                  )}
                </div>
                
                {/* Format Icons */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  <span style={{ padding: '4px 8px', backgroundColor: '#f8f9fa', border: '1px solid #d0d0d0', borderRadius: '4px', fontSize: '11px' }}>PDF</span>
                  <span style={{ padding: '4px 8px', backgroundColor: '#f8f9fa', border: '1px solid #d0d0d0', borderRadius: '4px', fontSize: '11px' }}>DOC</span>
                  <span style={{ padding: '4px 8px', backgroundColor: '#f8f9fa', border: '1px solid #d0d0d0', borderRadius: '4px', fontSize: '11px' }}>XLS</span>
                  <span style={{ padding: '4px 8px', backgroundColor: '#f8f9fa', border: '1px solid #d0d0d0', borderRadius: '4px', fontSize: '11px' }}>JPG</span>
                  <span style={{ padding: '4px 8px', backgroundColor: '#f8f9fa', border: '1px solid #d0d0d0', borderRadius: '4px', fontSize: '11px' }}>WEBP</span>
                </div>
              </div>


              {/* Document List */}
              {uploadedFiles.length > 0 && (
                <div style={{ marginBottom: '15px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#374151' }}>Uploaded Documents</h4>
                  {uploadedFiles.map((file, index) => (
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
                      <span>{index + 1}. {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                      <button 
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc2626',
                          cursor: 'pointer',
                          fontSize: '16px'
                        }}
                        onClick={() => removeFile(file.name)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Drop Zone */}
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
                  opacity: limitsReached ? 0.5 : 1,
                  position: 'relative'
                }}
              >
                <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Drop files here or click to upload</p>
                <p style={{ 
                  position: 'absolute', 
                  bottom: '8px', 
                  right: '12px', 
                  margin: 0, 
                  color: '#9ca3af', 
                  fontSize: '11px' 
                }}>
                  Max: 2 files or 20MB
                </p>
                <input
                  id="file-input"
                  type="file"
                  multiple={!limitsReached}
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
                  style={{ display: 'none' }}
                  disabled={limitsReached}
                />
              </div>

              {/* Analyze Button - Upload limit check removed for development */}
              <button 
                onClick={handleAnalyze}
                disabled={uploadedFiles.length === 0 || loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: uploadedFiles.length === 0 || loading ? '#e5e7eb' : '#3b82f6',
                  color: uploadedFiles.length === 0 || loading ? '#9ca3af' : 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: uploadedFiles.length === 0 || loading ? 'not-allowed' : 'pointer',
                  marginBottom: '15px',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {loading && (
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #9ca3af',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                )}
                {loading ? `Analyzing Documents... ${uploadProgress}%` : analysis ? 'Re-analyze Documents' : 'Analyze Documents'}
              </button>
              
              {/* Loading Progress Indicator */}
              {loading && (
                <div style={{
                  marginBottom: '15px',
                  padding: '12px',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #3b82f6',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#1e40af'
                }}>
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {icons.cloud('#1e40af')} 
                    <span>{processingStatus || `Processing ${uploadedFiles.length} document${uploadedFiles.length > 1 ? 's' : ''}...`}</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div style={{
                    width: '100%',
                    height: '6px',
                    backgroundColor: '#e0e7ff',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      height: '100%',
                      backgroundColor: '#3b82f6',
                      width: `${uploadProgress}%`,
                      borderRadius: '3px',
                      transition: 'width 0.3s ease-out'
                    }} />
                  </div>
                  
                  <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>
                    Progress: {uploadProgress}%
                  </div>
                  
                  <div style={{ fontSize: '12px', color: '#3730a3' }}>
                    • Extracting text content<br/>
                    • Analyzing financial data<br/>
                    • Generating insights
                  </div>
                </div>
              )}

              {error && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  padding: '16px',
                  borderRadius: '6px',
                  border: '2px solid #dc2626',
                  fontSize: '14px',
                  marginBottom: '15px',
                  boxShadow: '0 2px 4px rgba(220, 38, 38, 0.1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="12" y1="9" x2="12" y2="13" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="12" y1="17" x2="12.01" y2="17" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <div style={{ flex: 1, whiteSpace: 'pre-line' }}>{error}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Section */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              height: 'calc(100vh - 400px)',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              padding: '16px'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '12px',
                paddingBottom: '12px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h3 style={{ fontSize: '16px', color: '#1f2937', margin: 0, fontWeight: '600' }}>
                  Document Q&A
                </h3>
                {chatHistory.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ position: 'relative' }} className="export-menu-container">
                      <button
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: 'transparent',
                          border: '1px solid #e5e7eb',
                          borderRadius: '4px',
                          fontSize: '11px',
                          color: '#6b7280',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="Export chat history"
                      >
                        {icons.download('#6b7280')}
                        Export
                        <span style={{ fontSize: '8px' }}>▼</span>
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
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          zIndex: 1000,
                          minWidth: '180px'
                        }}>
                          <button
                            onClick={() => {
                              exportChat(false);
                              setShowExportMenu(false);
                            }}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              borderBottom: '1px solid #f3f4f6',
                              fontSize: '12px',
                              color: '#374151',
                              cursor: 'pointer',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                          >
                            {icons.download('#6b7280')}
                            Download to device
                          </button>
                          <button
                            onClick={() => {
                              exportChat(true);
                              setShowExportMenu(false);
                            }}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              fontSize: '12px',
                              color: '#374151',
                              cursor: 'pointer',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                          >
                            {icons.documents('#6b7280')}
                            Save to history
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setChatHistory([])}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: 'transparent',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: '#6b7280',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
              
              {/* Nudge Cards - Professional grey styling */}
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '8px', 
                marginBottom: '12px'
              }}>
                <button 
                  style={{
                    padding: '8px 14px',
                    backgroundColor: activeNudgeButton === 'amount' ? '#1f2937' : 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    color: activeNudgeButton === 'amount' ? 'white' : '#6b7280',
                    transition: 'all 0.2s',
                    fontWeight: activeNudgeButton === 'amount' ? '500' : '400'
                  }}
                  onClick={() => {
                    insertNudgeText("What's the total amount due and when?");
                    setActiveNudgeButton('amount');
                  }}
                  onMouseEnter={(e) => {
                    if (activeNudgeButton !== 'amount') {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                      e.currentTarget.style.color = '#1f2937';
                      e.currentTarget.style.borderColor = '#9ca3af';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeNudgeButton !== 'amount') {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.color = '#6b7280';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }
                  }}
                >
                  Amount & Date
                </button>
                <button 
                  style={{
                    padding: '8px 14px',
                    backgroundColor: activeNudgeButton === 'risks' ? '#1f2937' : 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    color: activeNudgeButton === 'risks' ? 'white' : '#6b7280',
                    transition: 'all 0.2s',
                    fontWeight: activeNudgeButton === 'risks' ? '500' : '400'
                  }}
                  onClick={() => {
                    insertNudgeText("What are the top 3 risks?");
                    setActiveNudgeButton('risks');
                  }}
                  onMouseEnter={(e) => {
                    if (activeNudgeButton !== 'risks') {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                      e.currentTarget.style.color = '#1f2937';
                      e.currentTarget.style.borderColor = '#9ca3af';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeNudgeButton !== 'risks') {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.color = '#6b7280';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }
                  }}
                >
                  Key Risks
                </button>
                <button 
                  style={{
                    padding: '8px 14px',
                    backgroundColor: activeNudgeButton === 'summary' ? '#1f2937' : 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    color: activeNudgeButton === 'summary' ? 'white' : '#6b7280',
                    transition: 'all 0.2s',
                    fontWeight: activeNudgeButton === 'summary' ? '500' : '400'
                  }}
                  onClick={() => {
                    insertNudgeText("Summarize in 3 bullet points");
                    setActiveNudgeButton('summary');
                  }}
                  onMouseEnter={(e) => {
                    if (activeNudgeButton !== 'summary') {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                      e.currentTarget.style.color = '#1f2937';
                      e.currentTarget.style.borderColor = '#9ca3af';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeNudgeButton !== 'summary') {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.color = '#6b7280';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }
                  }}
                >
                  Summary
                </button>
                <button 
                  style={{
                    padding: '8px 14px',
                    backgroundColor: activeNudgeButton === 'actions' ? '#1f2937' : 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    color: activeNudgeButton === 'actions' ? 'white' : '#6b7280',
                    transition: 'all 0.2s',
                    fontWeight: activeNudgeButton === 'actions' ? '500' : '400'
                  }}
                  onClick={() => {
                    insertNudgeText("What immediate action is needed?");
                    setActiveNudgeButton('actions');
                  }}
                  onMouseEnter={(e) => {
                    if (activeNudgeButton !== 'actions') {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                      e.currentTarget.style.color = '#1f2937';
                      e.currentTarget.style.borderColor = '#9ca3af';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeNudgeButton !== 'actions') {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.color = '#6b7280';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }
                  }}
                >
                  Actions
                </button>
              </div>

              {/* Chat History */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                marginBottom: '12px',
                backgroundColor: 'white',
                borderRadius: '6px',
                padding: '12px',
                minHeight: '200px',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {chatHistory.length === 0 ? (
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#9ca3af',
                    fontSize: '14px',
                    textAlign: 'center',
                    padding: '40px'
                  }}>
                    <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.5 }}>💭</div>
                    <div style={{ fontWeight: '500', marginBottom: '8px' }}>No conversation yet</div>
                    <div style={{ fontSize: '12px' }}>
                      Upload documents and ask questions to get started
                    </div>
                  </div>
                ) : (
                  <>
                    {chatHistory.map((msg, index) => {
                    const isExpanded = expandedMessages[index] !== false;
                    const isCurrentConversation = index >= chatHistory.length - 2;
                    const shouldShowExpanded = isExpanded || isCurrentConversation;
                    
                    return (
                      <div key={index} style={{
                        marginBottom: index < chatHistory.length - 1 ? '12px' : '0',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: msg.type === 'user' ? 'flex-end' : 'flex-start'
                      }}>
                        <div style={{ display: 'flex', gap: '8px', maxWidth: '85%' }}>
                          {msg.type !== 'user' && (
                            <div style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              backgroundColor: msg.type === 'ai' ? '#3b82f6' : 
                                             msg.type === 'error' ? '#ef4444' : '#f59e0b',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: msg.type === 'ai' ? '10px' : '14px',
                              fontWeight: msg.type === 'ai' ? '600' : 'normal',
                              flexShrink: 0
                            }}>
                              {msg.type === 'ai' ? 'Qash' : 
                               msg.type === 'error' ? '⚠️' : 'ℹ️'}
                            </div>
                          )}
                          <div 
                            onClick={() => {
                              if (!isCurrentConversation) {
                                setExpandedMessages(prev => ({
                                  ...prev,
                                  [index]: !shouldShowExpanded
                                }));
                              }
                            }}
                            style={{
                              flex: 1,
                              padding: '10px 14px',
                              borderRadius: msg.type === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                              backgroundColor: msg.type === 'user' ? '#3b82f6' : 
                                              msg.type === 'error' ? '#fef2f2' : 
                                              msg.type === 'system' ? '#fef3c7' : '#f3f4f6',
                              color: msg.type === 'user' ? 'white' : 
                                     msg.type === 'error' ? '#dc2626' : 
                                     msg.type === 'system' ? '#92400e' : '#1f2937',
                              fontSize: '13px',
                              lineHeight: '1.5',
                              wordBreak: 'break-word',
                              cursor: !isCurrentConversation ? 'pointer' : 'default',
                              opacity: !shouldShowExpanded ? 0.7 : 1,
                              boxShadow: shouldShowExpanded ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                              transition: 'all 0.2s'
                            }}>
                            <div style={{ whiteSpace: 'pre-wrap' }}>
                              {shouldShowExpanded ? (
                                msg.message
                              ) : (
                                <>
                                  {msg.message.split('\n')[0].substring(0, 60)}
                                  {msg.message.length > 60 && '...'}
                                  <span style={{ 
                                    marginLeft: '8px', 
                                    fontSize: '10px', 
                                    opacity: 0.6,
                                    fontStyle: 'italic'
                                  }}>
                                    (expand)
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          {msg.type === 'user' && (
                            <div style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              backgroundColor: '#6366f1',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              fontWeight: '600',
                              flexShrink: 0
                            }}>
                              {userProfile?.initials || 'U'}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                    {/* Loading indicator */}
                    {isChatLoading && (
                      <div style={{
                        marginTop: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start'
                      }}>
                        <div style={{ display: 'flex', gap: '8px', maxWidth: '85%' }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            fontWeight: '600',
                            flexShrink: 0
                          }}>
                            Qash
                          </div>
                          <div style={{
                            flex: 1,
                            padding: '10px 14px',
                            borderRadius: '16px 16px 16px 4px',
                            backgroundColor: '#f3f4f6',
                            fontSize: '13px',
                            lineHeight: '1.5'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{
                                width: '12px',
                                height: '12px',
                                border: '2px solid #6b7280',
                                borderTopColor: 'transparent',
                                borderRadius: '50%',
                                animation: 'spin 0.8s linear infinite'
                              }} />
                              <span style={{ color: '#6b7280' }}>Analyzing your question...</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Chat Form */}
              <form onSubmit={handleChatSubmit} style={{ 
                display: 'flex', 
                gap: '8px',
                backgroundColor: 'white',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about your documents..."
                  disabled={isChatLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleChatSubmit(e);
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '13px',
                    resize: 'none',
                    minHeight: '40px',
                    maxHeight: '120px',
                    backgroundColor: '#fafafa',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
                
                <button 
                  type="submit" 
                  disabled={isChatLoading || !chatInput.trim()}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: isChatLoading || !chatInput.trim() ? '#e5e7eb' : '#10b981',
                    color: isChatLoading || !chatInput.trim() ? '#9ca3af' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: isChatLoading || !chatInput.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isChatLoading && chatInput.trim()) {
                      e.target.style.backgroundColor = '#059669';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isChatLoading && chatInput.trim()) {
                      e.target.style.backgroundColor = '#10b981';
                    }
                  }}
                >
                  {isChatLoading ? (
                    <>
                      <div style={{
                        width: '14px',
                        height: '14px',
                        border: '2px solid #9ca3af',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                      }} />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span>Send</span>
                      {icons.arrowUpRight('white')}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column - CFO Dashboard & Analysis */}
          <div style={{ width: '60%', padding: '20px', overflowY: 'auto', backgroundColor: '#fafafa' }}>
            {/* CFO Executive Dashboard */}
            {analysis && cfoMetrics && (
              <div style={{ marginBottom: '30px' }}>
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ margin: 0, fontSize: '20px', color: '#1f2937' }}>
                      CFO Executive Dashboard
                    </h2>
                    {cfoMetrics.documentType && (
                      <span style={{
                        padding: '2px 8px',
                        backgroundColor: '#e5e7eb',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: '#374151'
                      }}>
                        {cfoMetrics.documentType.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Document Type Message - Show if no financial metrics */}
                {cfoMetrics.documentType && !cfoMetrics.hasFinancialMetrics && (
                  <div style={{
                    marginBottom: '16px',
                    padding: '12px',
                    backgroundColor: '#fef3c7',
                    border: '1px solid #f59e0b',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#92400e'
                  }}>
                    <strong>Document Type: {cfoMetrics.documentType.replace(/_/g, ' ')}</strong>
                    <div style={{ marginTop: '4px' }}>
                      This document type typically contains limited CFO metrics. 
                      {cfoMetrics.documentType === 'invoice' && ' Invoices show amounts and dates but not financial statements.'}
                      {cfoMetrics.documentType === 'receipt' && ' Receipts show transaction details but not comprehensive financials.'}
                      {cfoMetrics.documentType === 'bank_statement' && ' Bank statements show cash position but not P&L metrics.'}
                    </div>
                  </div>
                )}


                {/* CFO Summary Cards */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '16px', 
                  marginBottom: '24px' 
                }}>
                  {/* Cash Management */}
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: 'white', 
                    border: '1px solid #d0d0d0',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {icons.money('#6b7280')}
                      <span>CASH POSITION</span>
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                      {cfoMetrics.totalAmount > 0 ? formatAmount(cfoMetrics.totalAmount) : 'No data'}
                    </div>
                    <div style={{ fontSize: '11px', color: cfoMetrics.totalAmount > 0 ? '#059669' : '#9ca3af' }}>
                      {cfoMetrics.totalAmount > 0 ? 'Available Liquidity' : 'No financial data found'}
                    </div>
                  </div>

                  {/* Revenue Health */}
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: 'white', 
                    border: '1px solid #d0d0d0',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {icons.chart('#6b7280')}
                      <span>REVENUE GROWTH</span>
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                      {cfoMetrics.executiveSummary?.revenueGrowth || 'N/A'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#0891b2' }}>YoY Performance</div>
                  </div>

                  {/* Risk Level */}
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: 'white', 
                    border: '1px solid #d0d0d0',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {icons.alert('#6b7280')}
                      <span>RISK ASSESSMENT</span>
                    </div>
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: '600', 
                      color: cfoMetrics.riskAssessment?.creditRisk === 'HIGH' ? '#dc2626' : 
                             cfoMetrics.riskAssessment?.creditRisk === 'MEDIUM' ? '#d97706' : '#059669'
                    }}>
                      {cfoMetrics.riskAssessment?.creditRisk || 'LOW'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>Credit Risk Level</div>
                  </div>

                  {/* Confidence Score */}
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: 'white', 
                    border: '1px solid #d0d0d0',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {icons.target('#6b7280')}
                      <span>CONFIDENCE</span>
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                      {cfoMetrics.avgConfidence}%
                    </div>
                    <div style={{ fontSize: '11px', color: '#7c3aed' }}>Analysis Accuracy</div>
                  </div>
                </div>

                {/* CFO Detailed Sections - Show only if data exists */}
                {(cfoMetrics.executiveSummary?.revenueGrowth || cfoMetrics.executiveSummary?.grossMargin || 
                  cfoMetrics.executiveSummary?.workingCapital || cfoMetrics.executiveSummary?.currentRatio) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  {/* P&L Health - Show only if P&L data exists */}
                  {(cfoMetrics.executiveSummary?.revenueGrowth || cfoMetrics.executiveSummary?.grossMargin || 
                    cfoMetrics.executiveSummary?.operatingMargin) && (
                  <div style={{ 
                    padding: '10px', 
                    backgroundColor: 'white', 
                    border: '1px solid #d0d0d0',
                    borderRadius: '6px',
                    minHeight: '85px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
                      {icons.chart('#374151')}
                      <h4 style={{ margin: '0 0 0 6px', fontSize: '12px', color: '#1f2937', fontWeight: '600' }}>P&L HEALTH</h4>
                    </div>
                    <div style={{ fontSize: '11px', lineHeight: '1.3' }}>
                      {cfoMetrics.executiveSummary?.revenueGrowth ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span style={{ color: '#6b7280' }}>Revenue:</span> 
                          <span style={{ color: '#059669', fontWeight: '500' }}>{cfoMetrics.executiveSummary.revenueGrowth} ↗️</span>
                        </div>
                      ) : (
                        <div style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '10px' }}>No revenue data found in document</div>
                      )}
                      {cfoMetrics.executiveSummary?.grossMargin ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span style={{ color: '#6b7280' }}>Gross:</span> 
                          <span style={{ color: '#1f2937', fontWeight: '500' }}>{cfoMetrics.executiveSummary.grossMargin}</span>
                        </div>
                      ) : (
                        <div style={{ color: '#9ca3af', fontSize: '10px' }}>No margin data in document</div>
                      )}
                      {cfoMetrics.executiveSummary?.operatingMargin && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#6b7280' }}>Operating:</span> 
                          <span style={{ color: '#1f2937', fontWeight: '500' }}>{cfoMetrics.executiveSummary.operatingMargin}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  )}

                  {/* Balance Sheet - Show only if balance sheet data exists */}
                  {(cfoMetrics.executiveSummary?.workingCapital || cfoMetrics.executiveSummary?.currentRatio || 
                    cfoMetrics.executiveSummary?.dso) && (
                  <div style={{ 
                    padding: '10px', 
                    backgroundColor: 'white', 
                    border: '1px solid #d0d0d0',
                    borderRadius: '6px',
                    minHeight: '85px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
                      {icons.clipboard('#374151')}
                      <h4 style={{ margin: '0 0 0 6px', fontSize: '12px', color: '#1f2937', fontWeight: '600' }}>BALANCE SHEET</h4>
                    </div>
                    <div style={{ fontSize: '11px', lineHeight: '1.3' }}>
                      {cfoMetrics.executiveSummary?.workingCapital ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span style={{ color: '#6b7280' }}>Working Cap:</span> 
                          <span style={{ color: '#1f2937', fontWeight: '500' }}>{cfoMetrics.executiveSummary.workingCapital}</span>
                        </div>
                      ) : (
                        <div style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '10px' }}>No balance sheet data found</div>
                      )}
                      {cfoMetrics.executiveSummary?.currentRatio ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span style={{ color: '#6b7280' }}>Current:</span> 
                          <span style={{ color: '#1f2937', fontWeight: '500' }}>{cfoMetrics.executiveSummary.currentRatio}</span>
                        </div>
                      ) : (
                        <div style={{ color: '#9ca3af', fontSize: '10px' }}>No liquidity ratios found</div>
                      )}
                      {cfoMetrics.executiveSummary?.dso ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#6b7280' }}>DSO:</span> 
                          <span style={{ color: '#1f2937', fontWeight: '500' }}>{cfoMetrics.executiveSummary.dso} days</span>
                        </div>
                      ) : (
                        <div style={{ color: '#9ca3af', fontSize: '10px' }}>No receivables data</div>
                      )}
                    </div>
                  </div>
                  )}
                </div>
                )}

                {/* Alerts & Actions - Enhanced with highlighting */}
                {(cfoMetrics.alertsAndFlags?.criticalIssues || cfoMetrics.actionableInsights?.immediate30Days) && (
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: 'white', 
                    border: '2px solid #dc2626',
                    borderRadius: '8px',
                    marginBottom: '24px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#dc2626', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {icons.alert('#dc2626')}
                    <span>CRITICAL CFO ACTION ITEMS</span>
                  </h4>
                    <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                      {cfoMetrics.alertsAndFlags?.criticalIssues && (
                        <div style={{ 
                          padding: '12px 16px', 
                          backgroundColor: '#fef2f2', 
                          border: '2px solid #dc2626',
                          borderRadius: '6px',
                          marginBottom: '10px'
                        }}>
                          <strong style={{ color: '#dc2626', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {icons.fire('#dc2626')}
                          <span>CRITICAL:</span>
                        </strong> 
                          <div style={{ color: '#991b1b', marginTop: '4px', fontWeight: '500' }}>{cfoMetrics.alertsAndFlags.criticalIssues}</div>
                        </div>
                      )}
                      {cfoMetrics.actionableInsights?.immediate30Days && (
                        <div style={{ 
                          padding: '12px 16px', 
                          backgroundColor: '#eff6ff', 
                          border: '2px solid #2563eb',
                          borderRadius: '6px'
                        }}>
                          <strong style={{ color: '#1d4ed8', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {icons.clock('#1d4ed8')}
                          <span>NEXT 30 DAYS:</span>
                        </strong> 
                          <div style={{ color: '#1e40af', marginTop: '4px', fontWeight: '500' }}>{cfoMetrics.actionableInsights.immediate30Days}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Detailed Financial Analysis Table */}
            {analysis && analysis.files && analysis.files.length > 0 && (
              <div style={{ marginTop: '30px' }}>
                <h2 style={{ 
                  fontSize: '20px', 
                  fontWeight: '600', 
                  color: '#1f2937', 
                  marginBottom: '20px' 
                }}>
                  Detailed Financial Analysis
                </h2>
                
                {analysis.files.map((file, index) => {
                  // Debug log to see the structure
                  console.log('File analysis structure:', file.analysis);
                  
                  return (
                  <div key={index} style={{ marginBottom: '24px' }}>
                    {/* File Header */}
                    <div style={{
                      padding: '12px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '8px 8px 0 0',
                      border: '1px solid #e5e7eb',
                      borderBottom: 'none'
                    }}>
                      <h3 style={{ 
                        margin: 0, 
                        fontSize: '16px', 
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        {file.fileName}
                      </h3>
                    </div>
                    
                    {/* Analysis Table */}
                    {file.analysis && !file.error && (
                      <div style={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0 0 8px 8px',
                        overflow: 'hidden'
                      }}>
                        {/* Executive Summary at the top */}
                        {file.analysis.executiveSummary && (
                          <div style={{
                            padding: '16px',
                            backgroundColor: '#f0f9ff',
                            borderBottom: '1px solid #e5e7eb'
                          }}>
                            <h4 style={{ 
                              margin: '0 0 12px 0', 
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#0369a1',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              {icons.clipboard('#0369a1')}
                              Executive Summary
                            </h4>
                            <div style={{ 
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                              gap: '12px',
                              fontSize: '13px',
                              color: '#0c4a6e'
                            }}>
                              {typeof file.analysis.executiveSummary === 'object' ? (
                                <>
                                  {file.analysis.executiveSummary.revenueGrowth && (
                                    <div>
                                      <strong>Revenue Growth:</strong> {file.analysis.executiveSummary.revenueGrowth}
                                    </div>
                                  )}
                                  {file.analysis.executiveSummary.grossMargin && (
                                    <div>
                                      <strong>Gross Margin:</strong> {file.analysis.executiveSummary.grossMargin}
                                    </div>
                                  )}
                                  {file.analysis.executiveSummary.operatingMargin && (
                                    <div>
                                      <strong>Operating Margin:</strong> {file.analysis.executiveSummary.operatingMargin}
                                    </div>
                                  )}
                                  {file.analysis.executiveSummary.currentRatio && (
                                    <div>
                                      <strong>Current Ratio:</strong> {file.analysis.executiveSummary.currentRatio}
                                    </div>
                                  )}
                                  {file.analysis.executiveSummary.debtToEquity && (
                                    <div>
                                      <strong>Debt to Equity:</strong> {file.analysis.executiveSummary.debtToEquity}
                                    </div>
                                  )}
                                  {file.analysis.executiveSummary.workingCapital && (
                                    <div>
                                      <strong>Working Capital:</strong> {file.analysis.executiveSummary.workingCapital}
                                    </div>
                                  )}
                                  {file.analysis.executiveSummary.roe && (
                                    <div>
                                      <strong>ROE:</strong> {file.analysis.executiveSummary.roe}
                                    </div>
                                  )}
                                  {file.analysis.executiveSummary.dso && (
                                    <div>
                                      <strong>DSO:</strong> {file.analysis.executiveSummary.dso}
                                    </div>
                                  )}
                                  {file.analysis.executiveSummary.burnRate && (
                                    <div>
                                      <strong>Burn Rate:</strong> {file.analysis.executiveSummary.burnRate}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <p style={{ margin: 0 }}>
                                  {file.analysis.executiveSummary}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <table style={{ 
                          width: '100%', 
                          borderCollapse: 'collapse',
                          fontSize: '14px'
                        }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f9fafb' }}>
                              <th style={{ 
                                padding: '12px', 
                                textAlign: 'left',
                                borderBottom: '1px solid #e5e7eb',
                                fontWeight: '600',
                                color: '#374151',
                                width: '30%'
                              }}>
                                Metric
                              </th>
                              <th style={{ 
                                padding: '12px', 
                                textAlign: 'left',
                                borderBottom: '1px solid #e5e7eb',
                                fontWeight: '600',
                                color: '#374151',
                                width: '35%'
                              }}>
                                Analysis
                              </th>
                              <th style={{ 
                                padding: '12px', 
                                textAlign: 'left',
                                borderBottom: '1px solid #e5e7eb',
                                fontWeight: '600',
                                color: '#374151',
                                width: '35%'
                              }}>
                                Clear Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Display all available analysis fields dynamically */}
                            {Object.entries(file.analysis).map(([key, value]) => {
                              // Skip executiveSummary as it's handled separately
                              if (key === 'executiveSummary' || key === 'rawAnalysis' || !value) return null;
                              
                              // Define display settings for each field
                              const fieldConfig = {
                                financialHealth: {
                                  icon: icons.money('#059669'),
                                  label: 'Financial Health',
                                  color: '#059669',
                                  actions: ['Review cash conversion cycle', 'Optimize working capital', 'Monitor liquidity ratios']
                                },
                                keyRisks: {
                                  icon: icons.alert('#dc2626'),
                                  label: 'Key Risks',
                                  color: '#dc2626',
                                  actions: ['Implement risk mitigation plan', 'Set up early warning systems', 'Review insurance coverage']
                                },
                                riskAssessment: {
                                  icon: icons.alert('#dc2626'),
                                  label: 'Risk Assessment',
                                  color: '#dc2626',
                                  actions: ['Monitor risk indicators', 'Update risk matrix', 'Review mitigation strategies']
                                },
                                cashFlowProjection: {
                                  icon: icons.chart('#2563eb'),
                                  label: 'Cash Flow Forecast',
                                  color: '#2563eb',
                                  actions: ['Update 13-week cash flow model', 'Identify timing of cash needs', 'Plan for contingencies']
                                },
                                recommendations: {
                                  icon: icons.target('#7c3aed'),
                                  label: 'Strategic Actions',
                                  color: '#7c3aed',
                                  actions: ['Schedule executive review', 'Assign action owners', 'Set measurable KPIs']
                                },
                                actionableInsights: {
                                  icon: icons.clipboard('#7c3aed'),
                                  label: 'Actionable Insights',
                                  color: '#7c3aed',
                                  actions: ['Prioritize quick wins', 'Allocate resources', 'Track implementation']
                                },
                                growthOpportunities: {
                                  icon: icons.arrowUpRight('#10b981'),
                                  label: 'Growth Opportunities',
                                  color: '#10b981',
                                  actions: ['Develop business case', 'Allocate investment budget', 'Track ROI metrics']
                                },
                                alertsAndFlags: {
                                  icon: icons.fire('#dc2626'),
                                  label: 'Alerts & Flags',
                                  color: '#dc2626',
                                  actions: ['Address critical issues', 'Set up monitoring', 'Define escalation process']
                                },
                                boardReporting: {
                                  icon: icons.clipboard('#374151'),
                                  label: 'Board Reporting',
                                  color: '#374151',
                                  actions: ['Prepare board deck', 'Update KPI dashboard', 'Schedule board meeting']
                                }
                              };
                              
                              const config = fieldConfig[key] || {
                                icon: icons.documents('#6b7280'),
                                label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
                                color: '#6b7280',
                                actions: ['Review findings', 'Take action', 'Monitor progress']
                              };
                              
                              // Handle nested objects
                              const displayValue = typeof value === 'object' 
                                ? Object.entries(value).map(([k, v]) => `${k}: ${v}`).join(', ')
                                : value;
                              
                              // Extract action items from the analysis text dynamically
                              const extractActions = (text, fieldKey) => {
                                const defaultActions = config.actions;
                                const analysisText = typeof text === 'string' ? text.toLowerCase() : '';
                                
                                // Extract specific recommendations based on content
                                const actions = [];
                                
                                // Financial health specific actions
                                if (fieldKey === 'financialHealth') {
                                  if (analysisText.includes('cash flow') || analysisText.includes('liquidity')) {
                                    actions.push('Improve cash collection cycle');
                                  }
                                  if (analysisText.includes('profit') || analysisText.includes('margin')) {
                                    actions.push('Analyze margin improvement opportunities');
                                  }
                                  if (analysisText.includes('working capital')) {
                                    actions.push('Optimize working capital management');
                                  }
                                }
                                
                                // Risk specific actions
                                if (fieldKey === 'keyRisks' || fieldKey === 'riskAssessment') {
                                  if (analysisText.includes('credit')) {
                                    actions.push('Review credit policies');
                                  }
                                  if (analysisText.includes('market')) {
                                    actions.push('Diversify revenue streams');
                                  }
                                  if (analysisText.includes('operational')) {
                                    actions.push('Strengthen operational controls');
                                  }
                                }
                                
                                // Growth specific actions
                                if (fieldKey === 'growthOpportunities') {
                                  if (analysisText.includes('expand')) {
                                    actions.push('Develop expansion roadmap');
                                  }
                                  if (analysisText.includes('product')) {
                                    actions.push('Prioritize product development');
                                  }
                                  if (analysisText.includes('market')) {
                                    actions.push('Execute go-to-market strategy');
                                  }
                                }
                                
                                // If no specific actions extracted, use defaults
                                return actions.length > 0 ? actions.slice(0, 3) : defaultActions;
                              };
                              
                              const dynamicActions = extractActions(displayValue, key);
                              
                              return (
                                <tr key={key}>
                                  <td style={{ 
                                    padding: '12px', 
                                    borderBottom: '1px solid #f3f4f6',
                                    verticalAlign: 'top',
                                    fontWeight: '500'
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      {config.icon}
                                      <span>{config.label}</span>
                                    </div>
                                  </td>
                                  <td style={{ 
                                    padding: '12px', 
                                    borderBottom: '1px solid #f3f4f6',
                                    verticalAlign: 'top',
                                    color: '#6b7280'
                                  }}>
                                    {displayValue}
                                  </td>
                                  <td style={{ 
                                    padding: '12px', 
                                    borderBottom: '1px solid #f3f4f6',
                                    verticalAlign: 'top'
                                  }}>
                                    <ul style={{ 
                                      margin: 0, 
                                      paddingLeft: '20px',
                                      color: config.color
                                    }}>
                                      {dynamicActions.map((action, idx) => (
                                        <li key={idx}>{action}</li>
                                      ))}
                                    </ul>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Error State */}
                    {file.error && (
                      <div style={{
                        padding: '16px',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderTop: 'none',
                        borderRadius: '0 0 8px 8px',
                        color: '#dc2626'
                      }}>
                        <strong>Error:</strong> {file.error}
                      </div>
                    )}
                  </div>
                )})}
              </div>
            )}
            
          </div>
        </div>
        
        {/* Footer - Inside scrollable area */}
        <div style={{ 
          padding: '16px', 
          backgroundColor: 'white', 
          borderTop: '1px solid #d0d0d0',
          textAlign: 'center',
          flexShrink: 0
        }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#1f2937' }}>Reference</h4>
          <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
            CFO Executive Document Analyzer powered by Claude AI | Enhanced financial insights | Maximum 2 files or 20MB total
          </p>
        </div>
      </div>
      
      {/* Upload Limit Modal */}
      <UploadLimitModal
        isOpen={showUploadLimitModal}
        onClose={() => setShowUploadLimitModal(false)}
        uploadsUsed={uploadsThisMonth}
        uploadLimit={4}
        daysUntilReset={getDaysUntilReset()}
        onUpgrade={handleUpgradeClick}
        userTier={userTier}
      />
      
      {/* Profile Modal */}
      {showProfileModal && (
        <Profile
          onClose={() => setShowProfileModal(false)}
          userProfile={userProfile}
          onProfileUpdate={handleProfileUpdate}
        />
      )}
      
      {/* Documents Modal */}
      {showDocumentsModal && (
        <Documents
          onClose={() => setShowDocumentsModal(false)}
          onViewDocument={handleViewDocument}
        />
      )}
    </div>
  );
}

export default App;

