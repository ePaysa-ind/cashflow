# Cash Flow Analyzer - Project Structure

```
cash-flow-analyzer/
│
├── README.md                          # Complete project documentation
├── PROJECT_STRUCTURE.md               # This file - detailed project structure
│
├── backend/                           # Node.js Backend Server
│   ├── server.js                      # Main server file with multi-format support
│   ├── package.json                   # Backend dependencies and scripts
│   ├── package-lock.json              # Locked dependency versions
│   ├── .env                          # Environment variables (API keys) - DO NOT COMMIT
│   ├── .gitignore                     # Git ignore file (excludes node_modules, .env)
│   └── node_modules/                  # Backend dependencies (auto-generated)
│       ├── express/                   # Web framework for REST API
│       ├── multer/                    # Secure file upload handling
│       ├── cors/                      # Cross-origin resource sharing
│       ├── pdf-parse/                 # PDF text extraction library
│       ├── mammoth/                   # Word document (.docx/.doc) processing
│       ├── axios/                     # HTTP client for Claude AI API calls
│       ├── dotenv/                    # Environment variable loader
│       └── [other dependencies...]    # Additional npm packages
│
├── frontend/                          # React Frontend Application
│   ├── public/                        # Static public files served by React
│   │   ├── index.html                 # Main HTML template with React root
│   │   ├── favicon.ico                # Website icon
│   │   ├── logo192.png                # React logo (192x192)
│   │   ├── logo512.png                # React logo (512x512)
│   │   ├── manifest.json              # Progressive Web App manifest
│   │   └── robots.txt                 # Search engine crawler instructions
│   │
│   ├── src/                           # React source code
│   │   ├── App.js                     # Main React component (CUSTOM - multi-format upload UI)
│   │   ├── App.css                    # Main stylesheet (CUSTOM - responsive design)
│   │   ├── index.js                   # React app entry point (renders App to DOM)
│   │   ├── index.css                  # Base styles for the application
│   │   ├── App.test.js                # Unit tests for App component
│   │   ├── reportWebVitals.js         # Performance monitoring and analytics
│   │   └── setupTests.js              # Jest testing framework configuration
│   │
│   ├── package.json                   # Frontend dependencies and build scripts
│   ├── package-lock.json              # Locked dependency versions
│   ├── .gitignore                     # Git ignore file (excludes node_modules, build)
│   └── node_modules/                  # Frontend dependencies (auto-generated)
│       ├── react/                     # React library v18+
│       ├── react-dom/                 # React DOM rendering
│       ├── react-scripts/             # Create React App build tools
│       ├── axios/                     # HTTP client for backend API calls
│       └── [other dependencies...]    # Additional React ecosystem packages
│
├── .gitignore                         # Root level git ignore file
└── [future files...]                 # Deployment configs, Docker, CI/CD

```

## Detailed File Analysis

### Backend Core Files

| File | Size Est. | Purpose | Key Contents |
|------|-----------|---------|--------------|
| `server.js` | ~8KB | Main backend application | Express routes, Claude AI integration, multi-format file processing |
| `package.json` | ~1KB | Node.js project configuration | Dependencies: express, multer, cors, pdf-parse, mammoth, axios, dotenv |
| `.env` | <1KB | Sensitive environment variables | `CLAUDE_API_KEY=sk-ant-...` (NEVER commit this file) |

### Frontend Core Files

| File | Size Est. | Purpose | Key Contents |
|------|-----------|---------|--------------|
| `App.js` | ~12KB | Main React component | Multi-format upload UI, drag & drop, API calls, results display |
| `App.css` | ~6KB | Component styling | Responsive CSS, upload area, results grid, animations |
| `index.js` | ~1KB | React entry point | Renders App component, React.StrictMode wrapper |

### Key Dependencies Breakdown

**Backend Dependencies (package.json):**
```json
{
  "dependencies": {
    "express": "^4.18.0",      // Web server framework
    "multer": "^1.4.5",        // File upload middleware
    "cors": "^2.8.5",          // Cross-origin resource sharing
    "pdf-parse": "^1.1.1",     // PDF text extraction
    "mammoth": "^1.6.0",       // Word document processing
    "axios": "^1.6.0",         // HTTP client for Claude API
    "dotenv": "^16.3.0"        // Environment variable loader
  }
}
```

**Frontend Dependencies (package.json):**
```json
{
  "dependencies": {
    "react": "^18.2.0",        // React library
    "react-dom": "^18.2.0",    // React DOM rendering
    "react-scripts": "5.0.1",  // Create React App tools
    "axios": "^1.6.0"          // HTTP client for backend API
  }
}
```

## Application Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERACTION LAYER                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Browser Interface (React Frontend - localhost:3000)                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │ File Upload UI  │  │ Drag & Drop     │  │ Results Display │                │
│  │ - Multi-format  │  │ - File validation│  │ - Structured    │                │
│  │ - Size limits   │  │ - Error handling │  │ - Confidence    │                │
│  │ - Type filtering│  │ - Progress state │  │ - Recommendations│               │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                               HTTP/API Requests
                              (multipart/form-data)
                                      │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              API SERVER LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Node.js Backend Server (Express - localhost:5000)                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │ File Processing │  │ Text Extraction │  │ Security Layer  │                │
│  │ - Multer upload │  │ - PDF parsing   │  │ - Type validation│               │
│  │ - Memory storage│  │ - Word processing│  │ - Size limits   │                │
│  │ - Type detection│  │ - CSV parsing   │  │ - Input sanitization│            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                               HTTPS/API Requests
                              (JSON with extracted text)
                                      │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              AI PROCESSING LAYER                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Claude AI API (api.anthropic.com)                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │ Natural Language│  │ Document Analysis│  │ Structured Output│               │
│  │ Processing      │  │ - Invoice data  │  │ - JSON format   │                │
│  │ - Text understanding│ - Payment terms │  │ - Confidence    │                │
│  │ - Context analysis│  │ - Predictions  │  │ - Recommendations│               │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
[USER] → [FILE UPLOAD] → [VALIDATION] → [TEXT EXTRACTION] → [AI ANALYSIS] → [RESULTS]
   │           │              │               │                │              │
   │           │              │               │                │              │
   ▼           ▼              ▼               ▼                ▼              ▼
Select      Drag & Drop   Type & Size    PDF/Word/CSV    Claude API      Structured
File        Interface     Checking       Processing      Processing      JSON Response
```

### Step-by-Step Data Processing

1. **File Selection (Frontend)**
   - User selects or drops file
   - JavaScript validates file type and size
   - UI shows file preview and details

2. **Upload & Validation (Backend)**
   - Multer receives multipart form data
   - Server validates file type against whitelist
   - File processed in memory (never saved to disk)

3. **Text Extraction (Backend)**
   - PDF: pdf-parse library extracts text content
   - Word: mammoth library processes .docx/.doc files
   - CSV: Custom parser handles tabular data safely
   - Text: Direct UTF-8 string conversion

4. **AI Analysis (External API)**
   - Sanitized text sent to Claude AI API
   - AI analyzes document for financial information
   - Structured JSON response with confidence scores

5. **Results Display (Frontend)**
   - Backend returns analysis to React frontend
   - UI renders structured results with styling
   - User sees actionable cash flow insights

## Security Architecture

### File Upload Security
```
File Input → Type Validation → Size Check → Memory Processing → Text Extraction
     │              │              │              │              │
     ▼              ▼              ▼              ▼              ▼
Whitelist      10MB Limit    RAM Only      No Disk I/O    Sanitization
Filtering      Enforcement   Processing     File Storage   Before AI
```

### Security Measures Implemented

| Layer | Security Control | Implementation |
|-------|-----------------|----------------|
| **File Upload** | Type Validation | MIME type and extension whitelist |
| **File Upload** | Size Limits | 10MB maximum file size |
| **File Storage** | Memory Only | Files processed in RAM, never saved |
| **Input Processing** | Sanitization | Remove potentially harmful characters |
| **Dependencies** | Vulnerability Management | XLSX library removed due to security issues |
| **API Communication** | CORS | Proper cross-origin request handling |
| **Error Handling** | Information Disclosure | Secure error messages without sensitive data |

## Supported File Format Processing

### File Type Support Matrix

| Format | Extension | MIME Type | Processing Library | Security Status | Use Case |
|--------|-----------|-----------|-------------------|----------------|----------|
| **PDF** | .pdf | application/pdf | pdf-parse | ✅ Secure | Invoices, receipts |
| **Word** | .docx | application/vnd.openxml... | mammoth | ✅ Secure | Typed invoices |
| **Word Legacy** | .doc | application/msword | mammoth | ⚠️ Limited | Legacy documents |
| **CSV** | .csv | text/csv | Custom parser | ✅ Secure | Tabular data |
| **Text** | .txt | text/plain | Native | ✅ Secure | Plain text data |
| **JPEG** | .jpg/.jpeg | image/jpeg | Placeholder | 🚧 OCR Needed | Scanned documents |
| **PNG** | .png | image/png | Placeholder | 🚧 OCR Needed | Scanned documents |
| **Excel** | .xlsx/.xls | application/vnd.ms-excel | ❌ Disabled | 🚨 Vulnerable | Use CSV instead |

### File Processing Logic

```javascript
// Simplified processing flow
async function extractTextFromFile(file) {
  switch (file.mimetype) {
    case 'application/pdf':
      return await pdf(buffer).text;
    
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return await mammoth.extractRawText({ buffer }).value;
    
    case 'text/csv':
      return parseCSV(buffer.toString('utf8'));
    
    case 'text/plain':
      return buffer.toString('utf8');
    
    case 'image/jpeg':
    case 'image/png':
      return '[IMAGE FILE] - OCR processing required';
    
    default:
      throw new Error('Unsupported file type');
  }
}
```

## Development Environment Setup

### Directory Structure Creation
```bash
# Initial setup commands
mkdir cash-flow-analyzer
cd cash-flow-analyzer

# Backend setup
mkdir backend
cd backend
npm init -y
npm install express multer cors pdf-parse axios dotenv mammoth

# Frontend setup  
cd ..
npx create-react-app frontend
cd frontend
npm install axios
```

### Environment Configuration

**Backend .env file:**
```bash
# backend/.env
CLAUDE_API_KEY=sk-ant-api03-your-actual-key-here
NODE_ENV=development
PORT=5000
```

**Frontend package.json scripts (for Node.js v22+ compatibility):**
```json
{
  "scripts": {
    "start": "set NODE_OPTIONS=--openssl-legacy-provider && react-scripts start",
    "build": "set NODE_OPTIONS=--openssl-legacy-provider && react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}
```

## Performance Considerations

### File Processing Performance

| File Type | Processing Speed | Memory Usage | Notes |
|-----------|-----------------|--------------|-------|
| PDF | Fast | Low-Medium | Depends on text complexity |
| Word (.docx) | Medium | Medium | XML parsing overhead |
| Word (.doc) | Slow | High | Legacy format limitations |
| CSV | Very Fast | Low | Simple text processing |
| Text | Very Fast | Very Low | Direct string handling |
| Images | N/A | Low | Placeholder only (OCR needed) |

### Optimization Strategies
- **Memory Management**: Files processed in memory streams
- **Error Handling**: Graceful degradation for unsupported content
- **API Efficiency**: Text length limits for Claude API calls
- **Caching**: No caching implemented (stateless processing)

## Testing Strategy

### Manual Testing Checklist
- [ ] Upload each supported file type
- [ ] Test file size limits (try 11MB file)
- [ ] Test unsupported file types
- [ ] Test drag and drop functionality
- [ ] Verify error handling for corrupted files
- [ ] Test with various invoice formats
- [ ] Validate AI analysis accuracy
- [ ] Check responsive design on mobile

### Automated Testing Opportunities
- Unit tests for file processing functions
- Integration tests for API endpoints
- Frontend component testing with Jest
- Security testing for file upload validation

## Deployment Architecture

### Development vs Production

| Aspect | Development | Production |
|--------|-------------|------------|
| **Frontend** | localhost:3000 | CDN/Static hosting |
| **Backend** | localhost:5000 | Load-balanced servers |
| **Database** | None (stateless) | Optional analytics DB |
| **File Storage** | Memory only | Memory only (no change) |
| **SSL** | HTTP | HTTPS required |
| **Environment** | .env file | Secure secret management |

### Recommended Production Stack
- **Frontend**: Vercel, Netlify, or AWS CloudFront
- **Backend**: AWS Lambda, Google Cloud Run, or containerized
- **Monitoring**: Error tracking and performance monitoring
- **Security**: WAF, rate limiting, API key rotation

This structure provides a comprehensive understanding of the entire application architecture, from file system organization to data processing flows and security implementations.