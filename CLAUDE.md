# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Qash** - 100% SaaS Financial Analysis Platform powered by Claude AI
Live at: https://qash.solutions

A comprehensive cash flow analysis tool that helps businesses understand their financial health through AI-powered document analysis with interactive chat capabilities.

## Architecture

### 100% Cloud-Based SaaS Model
- **Frontend**: React 18 hosted on Vercel (qash.solutions)
- **Backend**: Express.js API hosted on Railway (qash-production.up.railway.app)
- **Database**: PostgreSQL on Railway
- **Authentication**: Firebase Auth (Google & Email/Password)
- **Payments**: Stripe integration for subscriptions (ready for production keys)
- **AI Engine**: Claude 3.5 Sonnet for financial analysis
- **File Processing**: Memory-only processing (no disk storage)
- **Email**: Resend API with custom domain (hello@qash.solutions)

### Frontend Architecture (v3.1 - Modular Refactoring)
```
frontend/src/
├── App.js                  # Main application (3400+ lines - working version)
├── App_modular.js         # Refactored modular version (in progress)
├── App_original.js        # Backup of working version
├── context/
│   └── AuthContext.js     # Centralized authentication state management
├── services/
│   └── api.js            # Centralized API layer with auto-auth
├── hooks/
│   └── useUpload.js      # Reusable file upload logic
├── constants/
│   └── index.js          # All app constants and configuration
├── utils/
│   └── icons.js          # All SVG icons from original App.js
├── components/
│   ├── Header/
│   │   ├── Header.js     # Main navigation header (needs hamburger menu)
│   │   └── Header.css    # Header styles
│   ├── Profile.js        # User profile management
│   ├── Documents.js      # Document history viewer
│   ├── UploadLimitModal.js # Upload limit notification
│   ├── Landing.js        # Login/signup page
│   └── ProtectedRoute.js # Route protection wrapper
└── firebase.js           # Firebase configuration
```

**Note:** For detailed modular refactoring implementation guide, see [MODULAR_REFACTORING.md](./MODULAR_REFACTORING.md)

### Key Features
1. **Multi-Document Upload** (2 files max, 20MB each)
2. **OCR Processing** for images (Tesseract.js)
3. **Financial Analysis** with executive summaries
4. **Interactive Chat** with document context
5. **Document Management** with auto-save
6. **Email Forwarding** for reports
7. **Password Strength Indicator**
8. **Rate Limiting** for API protection
9. **Responsive Layout with Four Main Sections**

### UI Layout Structure
The application features a sophisticated layout with:

**Header Section (Fixed)**
- Logo and branding
- Hamburger menu with user profile, trial status, and upload limits
- Auto-save indicator

**Main Content (Two-Column Layout)**
- **Left Column (40%)**:
  - Document Upload Section
  - Chat Section with collapsible messages
  
- **Right Column (60%)**:
  - Analysis Results with three subsections:
    - Executive Summary (graphical overview)
    - Detailed Financial Analysis
    - Action Items and Recommendations

**Visual Design**
- Clean grey borders for section separation
- SVG-only icons for consistency
- Active menu state highlighting
- Vertical scrolling with fixed header
- Responsive design for different screen sizes

## Development Setup

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Firebase account
- Claude API key
- Stripe account (for payments)

### Environment Variables

Backend `/backend/.env`:
```env
CLAUDE_API_KEY=your_claude_api_key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
RESEND_API_KEY=re_...
DATABASE_URL=postgresql://...
PORT=5000
NODE_ENV=development
FRONTEND_URL=https://your-frontend.vercel.app
```

Frontend `/frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### Running Locally

Backend:
```bash
cd backend
npm install
npm start
```

Frontend:
```bash
cd frontend
npm install
npm start
```

## API Endpoints

### Public Endpoints
- `GET /api/health` - Health check
- `GET /api/supported-formats` - Get supported file types

### Protected Endpoints (require authentication)
- `POST /api/analyze` - Analyze documents (multipart/form-data)
- `POST /api/analyze-metrics` - Analyze aggregated metrics
- `POST /api/chat` - Chat with document context
- `POST /api/send-report` - Email report forwarding
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/documents` - Get saved documents

## Security Features

- Rate limiting (100 req/15min, 60 req/min for health)
- Helmet.js security headers
- CORS with whitelist
- File type validation
- Input sanitization
- Memory-only file processing
- Blocked executable extensions

## Deployment

### Current Production Stack
1. **Frontend**: Vercel at qash.solutions
2. **Backend**: Railway at qash-production.up.railway.app
3. **Database**: PostgreSQL on Railway
4. **Email**: Resend with qash.solutions domain
5. **DNS**: Vercel DNS (ns1.vercel-dns.com)

### Production Checklist
- [x] Set all environment variables
- [x] Configure production CORS origins
- [x] Set up SSL certificates (automatic via Vercel/Railway)
- [ ] Configure Stripe webhooks (pending production keys)
- [x] Set up email service (Resend)
- [x] Add database for persistent storage (PostgreSQL)
- [ ] Configure monitoring (Sentry, LogRocket)
- [ ] Set up backup strategy
- [x] Custom domain configuration

## Current Status (v3.0 - Production)

✅ **Completed Features**:
- Firebase authentication with secure login/signup
- Multiple file upload (2 files, 20MB each)
- OCR image processing with Tesseract.js
- Financial document analysis with Claude 3.5 Sonnet
- Interactive chat with document context
- PostgreSQL database for persistent storage
- Document auto-saving to database
- Email forwarding with Resend API
- Password strength validation
- Rate limiting and security headers
- Custom domain (qash.solutions)
- Professional email domain (hello@qash.solutions)

🔧 **Known Issues** (Being Resolved with v3.1 Refactoring):
- Frontend build error: 'user is not defined' on lines that don't contain user
  - Root cause: 3400+ line App.js with scattered user state references
  - Solution: Modular architecture with centralized AuthContext
- Authentication tokens not being sent to backend (causing "Anonymous" user)
  - Root cause: Missing Authorization headers in API calls
  - Solution: Centralized API service with automatic token injection
- Database not receiving user data due to missing auth headers
  - Root cause: Frontend not sending Firebase ID tokens
  - Solution: api.js service layer handles all auth automatically

🚧 **Pending Features**:
- Stripe payment processing (awaiting production keys)
- PDF generation (currently text export)
- User subscription management
- Admin dashboard
- Analytics tracking
- File storage (S3/Cloudinary)

## Code Style Guidelines

### General Principles
- Use ES6+ features (arrow functions, destructuring, template literals)
- Async/await for all asynchronous operations
- Proper error handling with try/catch blocks
- Input validation on all endpoints
- Meaningful, descriptive variable names
- Component-based React structure
- Mobile-first responsive design

### File Header Standards
Every JavaScript file should start with a comprehensive header:
```javascript
/**
 * [Component/Module Name]
 * 
 * Purpose: [Clear description of what this file does]
 * Features: [Key features or functionality]
 * 
 * @component (for React components)
 * @module (for utility modules)
 * @version [Version number]
 * @author [Team/Developer name]
 */
```

### Inline Documentation Standards
```javascript
/**
 * Function description explaining what it does
 * @param {Type} paramName - Description of parameter
 * @returns {Type} Description of return value
 * @throws {ErrorType} When this error occurs
 * @example
 * const result = functionName(param1, param2);
 */
```

### Error Handling Pattern
```javascript
try {
  // Debug logging for development
  debugLog('Context', 'Action being performed', { relevantData });
  
  // Main logic here
  const result = await someOperation();
  
  // Success logging
  debugLog('Context', 'Operation successful', { result });
  
  return result;
} catch (error) {
  // Log full error details
  console.error('[ComponentName] Specific error context:', error);
  
  // User-friendly error handling
  setError(getUserFriendlyMessage(error));
  
  // Re-throw or return error state
  throw error;
}
```

### Debug Logging Pattern
```javascript
const DEBUG = process.env.NODE_ENV === 'development';

const debugLog = (context, message, data = null) => {
  if (DEBUG) {
    console.log(`[ComponentName ${context}] ${message}`, data || '');
  }
};
```

### Component Structure
```javascript
// 1. Imports (grouped by type)
import React, { useState, useEffect } from 'react'; // React
import { useNavigate } from 'react-router-dom'; // Router
import { useAuth } from '../context/AuthContext'; // Contexts
import useUpload from '../hooks/useUpload'; // Hooks
import api from '../services/api'; // Services
import Header from './Header'; // Components
import { CONSTANTS } from '../constants'; // Constants
import './Component.css'; // Styles

// 2. Component definition with clear sections
function Component() {
  // State declarations
  // Hooks
  // Event handlers
  // Effects
  // Render helpers
  // Main render
}
```

### Modular Architecture Benefits
1. **Separation of Concerns**: Each module has a single responsibility
2. **Reusability**: Hooks and services can be used across components
3. **Testability**: Each module can be unit tested independently
4. **Maintainability**: Smaller files are easier to understand and modify
5. **Debugging**: Comprehensive logging makes issues easier to trace

## Important Notes

1. **Model**: Always use Claude 3.5 Sonnet (`claude-3-5-sonnet-20241022`)
2. **File Limits**: 2 files max, 20MB per file
3. **Rate Limits**: Implement on all public endpoints
4. **Security**: Never commit API keys or secrets
5. **CORS**: Update origins for production deployment
6. **Authentication**: 
   - Frontend must send Firebase ID token in Authorization header
   - Backend extracts user from token without Firebase Admin SDK
   - All user references in frontend should use `auth.currentUser`
   - Database operations only occur when user is authenticated

## Troubleshooting

### Common Issues
1. **500 Error on Upload**: Check Claude API key
2. **CORS Errors**: Update allowed origins
3. **Email Not Sending**: Configure SMTP settings
4. **File Size Error**: Check multer limits
5. **'user is not defined' Build Error**: 
   - Vercel may show phantom line numbers (e.g., 583, 715) that don't match actual code
   - Ensure all `user` references use `const user = auth.currentUser`
   - Remove `user` from dependency arrays - use `auth.currentUser` inside functions
   - Check for stale build cache in Vercel

### Debug Mode
Set `NODE_ENV=development` for detailed error messages

## Modular Refactoring (v3.1)

### Migration Guide

The application is being refactored from a monolithic 3400+ line App.js to a modular architecture:

#### New Core Modules

1. **AuthContext.js** - Centralized Authentication
   - Manages user state globally
   - Provides helper methods (getUserDisplayName, getUserInitials)
   - Handles auth state changes
   - Comprehensive error handling

2. **api.js** - API Service Layer
   - Automatic auth token injection
   - Standardized error handling
   - Request/response logging
   - All API methods in one place

3. **constants/index.js** - Configuration
   - API settings
   - Upload limits
   - Error messages
   - Feature flags

4. **useUpload.js** - File Upload Hook
   - File validation
   - Upload progress tracking
   - Error handling
   - Reusable across components

5. **Header Component** - Modular Navigation
   - User menu
   - Navigation items
   - Sign out functionality

#### Migration Steps

1. **Test New Structure**
   ```bash
   # Backup current files
   cp src/App.js src/App_backup.js
   cp src/index.js src/index_backup.js
   
   # Use new files
   cp src/App_new.js src/App.js
   cp src/index_new.js src/index.js
   
   # Test
   npm start
   ```

2. **Revert if Needed**
   ```bash
   cp src/App_backup.js src/App.js
   cp src/index_backup.js src/index.js
   ```

### Benefits of Modular Architecture

1. **Easier Debugging**: Each module logs its own actions
2. **Clear Dependencies**: No circular imports
3. **Reusability**: Hooks and services work everywhere
4. **Maintainability**: 600 lines vs 3400 lines in main component
5. **Testing**: Each module can be unit tested

## Future Enhancements
- Real-time collaboration
- Advanced financial metrics
- Custom report templates
- Webhook integrations
- Mobile app
- Multi-language support
- Batch processing
- API for enterprise
- Component library with Storybook
- TypeScript migration
- Automated testing suite