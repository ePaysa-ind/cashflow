/**
 * API Service Module
 * 
 * Purpose: Centralized API communication layer with authentication and error handling
 * Features: Automatic auth token injection, request/response logging, error standardization
 * 
 * All API calls should go through this service for consistency and security
 * 
 * @module services/api
 * @version 1.0.0
 */

import axios from 'axios';
import { auth } from '../firebase';

// Get API URL from environment or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Development mode flag
const DEBUG = process.env.NODE_ENV === 'development';

/**
 * Log API debug messages in development
 * @param {string} context - Context of the log (request/response/error)
 * @param {string} message - Log message
 * @param {any} data - Optional data to log
 */
const apiLog = (context, message, data = null) => {
  if (DEBUG) {
    console.log(`[API ${context}] ${message}`, data || '');
  }
};

/**
 * Create axios instance with default configuration
 * Timeout set to 30 seconds for large file uploads
 */
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Request interceptor - adds authentication token to all requests
 * Runs before every API request
 */
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Get current user from Firebase
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        // Get fresh ID token
        const token = await currentUser.getIdToken();
        
        // Add authorization header
        config.headers.Authorization = `Bearer ${token}`;
        
        apiLog('Request', 'Added auth token', {
          email: currentUser.email,
          endpoint: config.url,
          method: config.method.toUpperCase()
        });
      } else {
        apiLog('Request', 'No authenticated user', {
          endpoint: config.url,
          method: config.method.toUpperCase()
        });
      }
      
      // Log request details in development
      apiLog('Request', 'Sending request', {
        url: config.url,
        method: config.method,
        hasAuth: !!config.headers.Authorization,
        contentType: config.headers['Content-Type']
      });
      
    } catch (error) {
      // Log but don't fail the request if token retrieval fails
      console.error('[API Request] Failed to add auth token:', error);
      apiLog('Request', 'Auth token error - continuing without auth', error.message);
    }
    
    return config;
  },
  (error) => {
    // Handle request errors
    console.error('[API Request] Request configuration error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - handles responses and errors uniformly
 */
apiClient.interceptors.response.use(
  // Success response handler
  (response) => {
    apiLog('Response', 'Success', {
      status: response.status,
      endpoint: response.config.url,
      hasData: !!response.data
    });
    
    return response;
  },
  
  // Error response handler
  async (error) => {
    // Destructure error details
    const { config, response, message } = error;
    
    // Build comprehensive error object
    const errorDetails = {
      // HTTP status code if available
      status: response?.status || 0,
      
      // Error message from server or axios
      message: response?.data?.error || response?.data?.message || message,
      
      // Error code for specific handling
      code: response?.data?.code || 'UNKNOWN_ERROR',
      
      // Request details for debugging
      endpoint: config?.url || 'unknown',
      method: config?.method?.toUpperCase() || 'unknown',
      
      // Timestamp for logging
      timestamp: new Date().toISOString()
    };
    
    // Log error details
    console.error('[API Response] Error:', errorDetails);
    
    // Handle specific error scenarios
    if (errorDetails.status === 401) {
      apiLog('Response', 'Authentication error - user may need to login again');
      // Could trigger logout or token refresh here
    } else if (errorDetails.status === 429) {
      apiLog('Response', 'Rate limit exceeded');
      errorDetails.message = 'Too many requests. Please wait a moment and try again.';
    } else if (errorDetails.status === 500) {
      apiLog('Response', 'Server error');
      errorDetails.message = 'Server error. Please try again later.';
    } else if (!response) {
      apiLog('Response', 'Network error - no response received');
      errorDetails.message = 'Network error. Please check your connection.';
    }
    
    // Reject with standardized error object
    return Promise.reject(errorDetails);
  }
);

/**
 * API Methods - All API calls should use these methods
 */

/**
 * Upload and analyze documents
 * @param {File[]} files - Array of files to upload
 * @returns {Promise<Object>} Analysis results
 * @throws {Object} Standardized error object
 */
export const uploadDocuments = async (files) => {
  try {
    apiLog('Upload', 'Starting document upload', {
      fileCount: files.length,
      totalSize: files.reduce((sum, f) => sum + f.size, 0)
    });
    
    // Create FormData for file upload
    const formData = new FormData();
    
    // Append each file
    files.forEach((file, index) => {
      formData.append('documents', file);
      apiLog('Upload', `Added file ${index + 1}`, {
        name: file.name,
        size: file.size,
        type: file.type
      });
    });
    
    // Send request with multipart/form-data
    const response = await apiClient.post('/api/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      // Track upload progress
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        apiLog('Upload', `Progress: ${percentCompleted}%`);
      }
    });
    
    apiLog('Upload', 'Upload successful', {
      filesAnalyzed: response.data.totalFiles
    });
    
    return response.data;
    
  } catch (error) {
    console.error('[API Upload] Upload failed:', error);
    throw error; // Re-throw standardized error from interceptor
  }
};

/**
 * Send chat message about analyzed documents
 * @param {string} query - User's question
 * @param {Object[]} documents - Array of document analysis results
 * @param {string} sessionId - Optional chat session ID
 * @returns {Promise<Object>} Chat response
 */
export const sendChatMessage = async (query, documents, sessionId = null) => {
  try {
    apiLog('Chat', 'Sending chat message', {
      queryLength: query.length,
      documentCount: documents.length,
      hasSession: !!sessionId
    });
    
    const response = await apiClient.post('/api/chat', {
      query,
      documents,
      sessionId
    });
    
    apiLog('Chat', 'Chat response received', {
      responseLength: response.data.response?.length
    });
    
    return response.data;
    
  } catch (error) {
    console.error('[API Chat] Chat request failed:', error);
    throw error;
  }
};

/**
 * Get user profile
 * @returns {Promise<Object>} User profile data
 */
export const getUserProfile = async () => {
  try {
    apiLog('Profile', 'Fetching user profile');
    
    const response = await apiClient.get('/api/user/profile');
    
    apiLog('Profile', 'Profile fetched', {
      hasProfile: !!response.data,
      isComplete: response.data.profileComplete
    });
    
    return response.data;
    
  } catch (error) {
    console.error('[API Profile] Failed to fetch profile:', error);
    throw error;
  }
};

/**
 * Update user profile
 * @param {Object} profileData - Profile fields to update
 * @returns {Promise<Object>} Updated profile
 */
export const updateUserProfile = async (profileData) => {
  try {
    apiLog('Profile', 'Updating profile', {
      fields: Object.keys(profileData)
    });
    
    const response = await apiClient.put('/api/user/profile', profileData);
    
    apiLog('Profile', 'Profile updated successfully');
    
    return response.data;
    
  } catch (error) {
    console.error('[API Profile] Failed to update profile:', error);
    throw error;
  }
};

/**
 * Get user's saved documents
 * @returns {Promise<Object[]>} Array of saved documents
 */
export const getUserDocuments = async () => {
  try {
    apiLog('Documents', 'Fetching user documents');
    
    const response = await apiClient.get('/api/user/documents');
    
    apiLog('Documents', 'Documents fetched', {
      count: response.data.documents?.length || 0
    });
    
    return response.data.documents || [];
    
  } catch (error) {
    console.error('[API Documents] Failed to fetch documents:', error);
    throw error;
  }
};

/**
 * Send financial report via email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} message - Email message
 * @param {Object} document - Document data to attach
 * @returns {Promise<Object>} Send status
 */
export const sendReport = async (to, subject, message, document) => {
  try {
    apiLog('Email', 'Sending report', {
      to,
      documentName: document.fileName
    });
    
    const response = await apiClient.post('/api/send-report', {
      to,
      subject,
      message,
      document
    });
    
    apiLog('Email', 'Report sent successfully');
    
    return response.data;
    
  } catch (error) {
    console.error('[API Email] Failed to send report:', error);
    throw error;
  }
};

/**
 * Check API health
 * @returns {Promise<Object>} Health check response
 */
export const checkHealth = async () => {
  try {
    const response = await apiClient.get('/api/health');
    return response.data;
  } catch (error) {
    console.error('[API Health] Health check failed:', error);
    throw error;
  }
};

/**
 * Get supported file formats
 * @returns {Promise<Object>} Supported formats info
 */
export const getSupportedFormats = async () => {
  try {
    const response = await apiClient.get('/api/supported-formats');
    return response.data;
  } catch (error) {
    console.error('[API Formats] Failed to get formats:', error);
    throw error;
  }
};

// Export the axios instance for advanced use cases
export { apiClient };

// Export default API service object
export default {
  uploadDocuments,
  sendChatMessage,
  getUserProfile,
  updateUserProfile,
  getUserDocuments,
  sendReport,
  checkHealth,
  getSupportedFormats
};