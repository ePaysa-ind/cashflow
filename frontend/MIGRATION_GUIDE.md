# Migration Guide: Refactoring App.js

## Overview

This guide documents the refactoring of the 3400+ line App.js into a modular architecture for better maintainability and debugging.

## New File Structure

```
frontend/src/
├── App_new.js              # New simplified App (from 3400 → ~600 lines)
├── context/
│   └── AuthContext.js      # Centralized auth management
├── services/
│   └── api.js             # All API calls with auth handling
├── hooks/
│   └── useUpload.js       # File upload logic
├── constants/
│   └── index.js           # All app constants
└── components/
    └── Header/
        ├── Header.js      # Header component
        └── Header.css     # Header styles
```

## Key Changes

### 1. Authentication Management

**Before**: User state scattered throughout App.js
```javascript
// Multiple references to user throughout the file
const [user, setUser] = useState(null);
// ... 500 lines later
const sessionKey = `qash_session_${user.uid}`;
```

**After**: Centralized in AuthContext
```javascript
// In any component
import { useAuth } from './context/AuthContext';
const { user, loading, error } = useAuth();
```

### 2. API Calls

**Before**: Direct axios calls with manual auth
```javascript
const response = await axios.post(`${API_URL}/api/analyze`, formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
    'Authorization': `Bearer ${token}`
  }
});
```

**After**: Centralized API service
```javascript
import api from './services/api';
const response = await api.uploadDocuments(files);
// Auth token added automatically!
```

### 3. File Upload Logic

**Before**: Mixed with UI logic in App.js
**After**: Extracted to useUpload hook
```javascript
const { 
  uploadedFiles, 
  handleUpload, 
  error,
  isUploading 
} = useUpload();
```

### 4. Constants

**Before**: Magic numbers and strings throughout
```javascript
const maxFiles = 2;
const maxSize = 20 * 1024 * 1024;
```

**After**: Centralized configuration
```javascript
import { UPLOAD_LIMITS } from './constants';
// UPLOAD_LIMITS.MAX_FILES, UPLOAD_LIMITS.MAX_FILE_SIZE
```

## Migration Steps

### Step 1: Test New Structure
1. The new files are created alongside the old ones
2. Test with `App_new.js` and `index_new.js`
3. Verify all functionality works

### Step 2: Gradual Migration
1. Start using AuthContext in existing components
2. Replace API calls with the api service
3. Move constants to the constants file

### Step 3: Switch Over
1. Backup current App.js: `cp App.js App_backup.js`
2. Replace App.js with App_new.js
3. Replace index.js with index_new.js

## Benefits

1. **Easier Debugging**: Each module has comprehensive logging
2. **Better Error Handling**: Centralized error management
3. **Reusability**: Hooks and services can be used anywhere
4. **Testing**: Each module can be tested independently
5. **Maintainability**: 600 lines vs 3400 lines in main component

## Debugging the "user is not defined" Error

With this structure, we can now:

1. **Check AuthContext**: All user state is in one place
2. **Trace API Calls**: All requests logged in api.js
3. **Isolate Issues**: Each module can be tested separately

The error likely occurs because:
- User state is not properly initialized
- Dependencies are circular
- Build process is transforming code incorrectly

## Testing

To test the new structure:

```bash
# 1. Temporarily use the new App
cp src/App.js src/App_old.js
cp src/App_new.js src/App.js

# 2. Run the development server
npm start

# 3. Check console for detailed logs
# Each module logs its actions in development

# 4. If issues occur, revert
cp src/App_old.js src/App.js
```

## Next Steps

1. Complete remaining component extractions:
   - Upload section → UploadSection component
   - Chat interface → ChatSection component
   - Analysis results → AnalysisResults component

2. Add TypeScript for better type safety

3. Add unit tests for each module

4. Set up error monitoring (Sentry)

## Notes

- All new code includes detailed inline documentation
- Error handling is comprehensive with user-friendly messages
- Debug logging is controlled by NODE_ENV
- The modular structure makes it easy to add new features