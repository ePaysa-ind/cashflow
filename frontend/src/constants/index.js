/**
 * Application Constants
 * 
 * Purpose: Centralized configuration and constants for the entire application
 * Benefits: Single source of truth, easy updates, no magic numbers in code
 * 
 * @module constants
 * @version 1.0.0
 */

/**
 * API Configuration
 */
export const API_CONFIG = {
  // Base API URL - uses environment variable or localhost
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  
  // Request timeout in milliseconds
  TIMEOUT: 30000, // 30 seconds
  
  // Retry configuration
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

/**
 * File Upload Constraints
 */
export const UPLOAD_LIMITS = {
  // Maximum number of files per upload
  MAX_FILES: 2,
  
  // Maximum file size per file (in bytes)
  MAX_FILE_SIZE: 20 * 1024 * 1024, // 20MB
  
  // Maximum total upload size (in bytes)
  MAX_TOTAL_SIZE: 20 * 1024 * 1024, // 20MB
  
  // Allowed file types with descriptions
  ALLOWED_TYPES: {
    // Documents
    'application/pdf': 'PDF Document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document (DOCX)',
    'application/msword': 'Word Document (DOC)',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet (XLSX)',
    'application/vnd.ms-excel': 'Excel Spreadsheet (XLS)',
    'text/csv': 'CSV File',
    'text/plain': 'Text File',
    
    // Images (for OCR)
    'image/jpeg': 'JPEG Image',
    'image/jpg': 'JPG Image',
    'image/png': 'PNG Image',
    'image/gif': 'GIF Image',
    'image/bmp': 'BMP Image',
    'image/tiff': 'TIFF Image',
    'image/webp': 'WebP Image'
  },
  
  // File extensions (for validation)
  ALLOWED_EXTENSIONS: [
    '.pdf', '.docx', '.doc', '.xlsx', '.xls', '.csv', '.txt',
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'
  ]
};

/**
 * User Tier Configuration
 */
export const USER_TIERS = {
  FREE: {
    name: 'free',
    displayName: 'Free',
    uploadsPerMonth: 4,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    features: ['basic_analysis', 'chat', 'export_text']
  },
  PREMIUM: {
    name: 'premium',
    displayName: 'Premium',
    uploadsPerMonth: -1, // Unlimited
    maxFileSize: 20 * 1024 * 1024, // 20MB
    features: ['advanced_analysis', 'chat', 'export_all', 'priority_support', 'api_access']
  }
};

/**
 * Authentication Configuration
 */
export const AUTH_CONFIG = {
  // Session timeout in milliseconds
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  
  // Idle timeout in milliseconds
  IDLE_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  
  // Idle warning time (show warning before timeout)
  IDLE_WARNING_TIME: 5 * 60 * 1000, // 5 minutes before timeout
  
  // Password requirements
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIRE_UPPERCASE: true,
  PASSWORD_REQUIRE_LOWERCASE: true,
  PASSWORD_REQUIRE_NUMBER: true,
  PASSWORD_REQUIRE_SPECIAL: false
};

/**
 * UI Configuration
 */
export const UI_CONFIG = {
  // Animation durations (milliseconds)
  ANIMATION_DURATION: 300,
  
  // Toast/notification duration
  TOAST_DURATION: 5000,
  
  // Auto-save interval
  AUTO_SAVE_INTERVAL: 60000, // 1 minute
  
  // Debounce delays
  SEARCH_DEBOUNCE: 300,
  INPUT_DEBOUNCE: 500,
  
  // Pagination
  ITEMS_PER_PAGE: 10,
  
  // Chat
  CHAT_MESSAGE_MAX_LENGTH: 500,
  CHAT_HISTORY_LIMIT: 50
};

/**
 * Local Storage Keys
 * Prefixed with 'qash_' to avoid conflicts
 */
export const STORAGE_KEYS = {
  // User data
  USER_PROFILE: 'qash_user_profile',
  USER_PREFERENCES: 'qash_user_preferences',
  
  // Session data
  SESSION_DATA: 'qash_session',
  LAST_ACTIVITY: 'qash_last_activity',
  
  // Document data
  SAVED_DOCUMENTS: 'qash_documents',
  DRAFT_ANALYSIS: 'qash_draft_analysis',
  
  // UI state
  THEME: 'qash_theme',
  SIDEBAR_COLLAPSED: 'qash_sidebar_collapsed',
  TOUR_COMPLETED: 'qash_tour_completed'
};

/**
 * Error Messages
 * Standardized user-friendly error messages
 */
export const ERROR_MESSAGES = {
  // Authentication errors
  AUTH_REQUIRED: 'Please sign in to continue',
  AUTH_EXPIRED: 'Your session has expired. Please sign in again',
  AUTH_INVALID: 'Invalid email or password',
  
  // Upload errors
  UPLOAD_TOO_MANY_FILES: `Maximum ${UPLOAD_LIMITS.MAX_FILES} files allowed`,
  UPLOAD_FILE_TOO_LARGE: `File size must be less than ${UPLOAD_LIMITS.MAX_FILE_SIZE / (1024 * 1024)}MB`,
  UPLOAD_INVALID_TYPE: 'File type not supported. Please upload PDF, Word, Excel, CSV, or image files',
  UPLOAD_FAILED: 'Failed to upload files. Please try again',
  
  // Network errors
  NETWORK_ERROR: 'Network error. Please check your connection',
  SERVER_ERROR: 'Server error. Please try again later',
  TIMEOUT_ERROR: 'Request timed out. Please try again',
  
  // Validation errors
  FIELD_REQUIRED: 'This field is required',
  EMAIL_INVALID: 'Please enter a valid email address',
  PASSWORD_TOO_SHORT: `Password must be at least ${AUTH_CONFIG.PASSWORD_MIN_LENGTH} characters`,
  
  // Generic errors
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again',
  TRY_AGAIN_LATER: 'Please try again later'
};

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  UPLOAD_SUCCESS: 'Documents uploaded successfully',
  ANALYSIS_COMPLETE: 'Analysis completed',
  PROFILE_UPDATED: 'Profile updated successfully',
  REPORT_SENT: 'Report sent successfully',
  DOCUMENT_SAVED: 'Document saved'
};

/**
 * Loading Messages
 */
export const LOADING_MESSAGES = {
  UPLOADING: 'Uploading documents...',
  ANALYZING: 'Analyzing documents with AI...',
  PROCESSING: 'Processing your request...',
  SENDING: 'Sending report...',
  LOADING: 'Loading...'
};

/**
 * Feature Flags
 * Enable/disable features for testing
 */
export const FEATURE_FLAGS = {
  ENABLE_OCR: true,
  ENABLE_CHAT: true,
  ENABLE_EXPORT: true,
  ENABLE_EMAIL: true,
  ENABLE_PREMIUM: false, // Set to true when Stripe is ready
  ENABLE_ANALYTICS: true,
  DEBUG_MODE: process.env.NODE_ENV === 'development'
};

/**
 * Regular Expressions for Validation
 */
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s-()]+$/,
  ZIP_CODE: /^\d{5}(-\d{4})?$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/
};

/**
 * Date Formats
 */
export const DATE_FORMATS = {
  DISPLAY: 'MMM DD, YYYY',
  DISPLAY_WITH_TIME: 'MMM DD, YYYY h:mm A',
  API: 'YYYY-MM-DD',
  FILE_NAME: 'YYYY-MM-DD-HHmmss'
};

// Export all constants as default
export default {
  API_CONFIG,
  UPLOAD_LIMITS,
  USER_TIERS,
  AUTH_CONFIG,
  UI_CONFIG,
  STORAGE_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  LOADING_MESSAGES,
  FEATURE_FLAGS,
  REGEX_PATTERNS,
  DATE_FORMATS
};