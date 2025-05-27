/**
 * File Upload Hook
 * 
 * Purpose: Manages file upload state, validation, and API communication
 * Features: File validation, progress tracking, error handling, retry logic
 * 
 * @module hooks/useUpload
 * @version 1.0.0
 */

import { useState, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { uploadDocuments } from '../services/api';
import { UPLOAD_LIMITS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants';

/**
 * Custom hook for file upload functionality
 * 
 * @returns {Object} Upload state and methods
 * 
 * @example
 * const { 
 *   uploadedFiles, 
 *   handleUpload, 
 *   isUploading,
 *   uploadProgress,
 *   error 
 * } = useUpload();
 */
export const useUpload = () => {
  // Authentication context
  const { user } = useAuth();
  
  // Upload state
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  
  // Analysis results
  const [analysis, setAnalysis] = useState(null);
  
  // Abort controller for cancelling uploads
  const abortControllerRef = useRef(null);
  
  // Debug mode
  const DEBUG = process.env.NODE_ENV === 'development';
  
  /**
   * Log debug messages
   * @param {string} action - Action being performed
   * @param {any} data - Data to log
   */
  const debugLog = (action, data) => {
    if (DEBUG) {
      console.log(`[useUpload] ${action}:`, data);
    }
  };
  
  /**
   * Validate a single file
   * @param {File} file - File to validate
   * @returns {Object} Validation result { valid: boolean, error?: string }
   */
  const validateFile = useCallback((file) => {
    debugLog('Validating file', {
      name: file.name,
      size: file.size,
      type: file.type
    });
    
    // Check if file exists
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }
    
    // Check file size
    if (file.size > UPLOAD_LIMITS.MAX_FILE_SIZE) {
      const maxSizeMB = UPLOAD_LIMITS.MAX_FILE_SIZE / (1024 * 1024);
      return { 
        valid: false, 
        error: `File "${file.name}" is too large. Maximum size is ${maxSizeMB}MB` 
      };
    }
    
    // Check file type
    const allowedTypes = Object.keys(UPLOAD_LIMITS.ALLOWED_TYPES);
    if (!allowedTypes.includes(file.type)) {
      // Also check by extension as fallback
      const extension = '.' + file.name.split('.').pop().toLowerCase();
      if (!UPLOAD_LIMITS.ALLOWED_EXTENSIONS.includes(extension)) {
        return { 
          valid: false, 
          error: `File type not supported for "${file.name}". Please upload PDF, Word, Excel, CSV, or image files` 
        };
      }
    }
    
    // Check for empty files
    if (file.size === 0) {
      return { 
        valid: false, 
        error: `File "${file.name}" is empty` 
      };
    }
    
    // File is valid
    return { valid: true };
  }, []);
  
  /**
   * Validate multiple files
   * @param {File[]} files - Array of files to validate
   * @returns {Object} Validation result { valid: boolean, errors?: Object }
   */
  const validateFiles = useCallback((files) => {
    const errors = {};
    let isValid = true;
    
    // Check file count
    if (files.length > UPLOAD_LIMITS.MAX_FILES) {
      errors.general = ERROR_MESSAGES.UPLOAD_TOO_MANY_FILES;
      isValid = false;
    }
    
    // Check total size
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > UPLOAD_LIMITS.MAX_TOTAL_SIZE) {
      const maxSizeMB = UPLOAD_LIMITS.MAX_TOTAL_SIZE / (1024 * 1024);
      errors.general = `Total file size exceeds ${maxSizeMB}MB limit`;
      isValid = false;
    }
    
    // Validate each file
    files.forEach((file, index) => {
      const validation = validateFile(file);
      if (!validation.valid) {
        errors[`file_${index}`] = validation.error;
        isValid = false;
      }
    });
    
    debugLog('Files validation result', { isValid, errors });
    
    return { valid: isValid, errors };
  }, [validateFile]);
  
  /**
   * Reset upload state
   */
  const resetUpload = useCallback(() => {
    debugLog('Resetting upload state', null);
    
    setUploadedFiles([]);
    setIsUploading(false);
    setUploadProgress(0);
    setError(null);
    setValidationErrors({});
    setAnalysis(null);
    
    // Cancel any ongoing upload
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);
  
  /**
   * Handle file upload with validation and error handling
   * @param {File[]} files - Files to upload
   * @returns {Promise<Object|null>} Analysis results or null if failed
   */
  const handleUpload = useCallback(async (files) => {
    debugLog('Starting upload', {
      fileCount: files.length,
      user: user?.email || 'anonymous'
    });
    
    // Reset previous state
    setError(null);
    setValidationErrors({});
    setUploadProgress(0);
    
    try {
      // Validate files
      const validation = validateFiles(files);
      if (!validation.valid) {
        setValidationErrors(validation.errors);
        setError(validation.errors.general || 'File validation failed');
        return null;
      }
      
      // Check authentication
      if (!user) {
        setError(ERROR_MESSAGES.AUTH_REQUIRED);
        console.error('[useUpload] User not authenticated');
        return null;
      }
      
      // Set upload state
      setIsUploading(true);
      setUploadedFiles(files);
      
      // Create abort controller for this upload
      abortControllerRef.current = new AbortController();
      
      // Simulate progress for better UX
      // Real progress would come from axios onUploadProgress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);
      
      // Upload files
      debugLog('Calling upload API', { files: files.map(f => f.name) });
      
      const result = await uploadDocuments(files);
      
      // Clear progress interval
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Check for errors in response
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Store analysis results
      setAnalysis(result);
      
      debugLog('Upload successful', {
        filesAnalyzed: result.totalFiles,
        hasErrors: result.files?.some(f => f.error)
      });
      
      // Check if any files had errors
      const filesWithErrors = result.files?.filter(f => f.error) || [];
      if (filesWithErrors.length > 0) {
        const errorMessages = filesWithErrors.map(f => `${f.fileName}: ${f.error}`).join('\n');
        setError(`Some files had errors:\n${errorMessages}`);
      }
      
      return result;
      
    } catch (uploadError) {
      // Handle different error types
      console.error('[useUpload] Upload failed:', uploadError);
      
      let errorMessage = ERROR_MESSAGES.UPLOAD_FAILED;
      
      if (uploadError.name === 'AbortError') {
        errorMessage = 'Upload cancelled';
      } else if (uploadError.status === 401) {
        errorMessage = ERROR_MESSAGES.AUTH_EXPIRED;
      } else if (uploadError.status === 413) {
        errorMessage = ERROR_MESSAGES.UPLOAD_FILE_TOO_LARGE;
      } else if (uploadError.status === 429) {
        errorMessage = 'Upload limit reached. Please try again later';
      } else if (uploadError.message) {
        errorMessage = uploadError.message;
      }
      
      setError(errorMessage);
      setUploadProgress(0);
      
      return null;
      
    } finally {
      // Clean up
      setIsUploading(false);
      abortControllerRef.current = null;
      
      // Reset progress after a delay
      setTimeout(() => {
        setUploadProgress(0);
      }, 1000);
    }
  }, [user, validateFiles]);
  
  /**
   * Cancel ongoing upload
   */
  const cancelUpload = useCallback(() => {
    debugLog('Cancelling upload', null);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setIsUploading(false);
    setUploadProgress(0);
    setError('Upload cancelled');
  }, []);
  
  /**
   * Remove a file from the uploaded files list
   * @param {number} index - Index of file to remove
   */
  const removeFile = useCallback((index) => {
    debugLog('Removing file', { index });
    
    setUploadedFiles(prev => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      return newFiles;
    });
    
    // Clear errors related to this file
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`file_${index}`];
      return newErrors;
    });
  }, []);
  
  /**
   * Clear all uploaded files
   */
  const clearFiles = useCallback(() => {
    debugLog('Clearing all files', null);
    
    setUploadedFiles([]);
    setValidationErrors({});
    setError(null);
    setAnalysis(null);
  }, []);
  
  // Return hook interface
  return {
    // State
    uploadedFiles,
    isUploading,
    uploadProgress,
    error,
    validationErrors,
    analysis,
    
    // Actions
    handleUpload,
    cancelUpload,
    removeFile,
    clearFiles,
    resetUpload,
    
    // Utilities
    validateFile,
    validateFiles,
    
    // Computed values
    canUpload: uploadedFiles.length > 0 && !isUploading,
    hasErrors: !!error || Object.keys(validationErrors).length > 0,
    fileCount: uploadedFiles.length,
    totalSize: uploadedFiles.reduce((sum, f) => sum + f.size, 0)
  };
};

export default useUpload;