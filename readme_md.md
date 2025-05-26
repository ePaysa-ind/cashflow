# Cash Flow Analyzer

A React-based web application that uses AI to analyze financial documents in multiple formats and provide cash flow predictions for small businesses.

## ✨ Latest Features (v2.0)

- **Multiple File Upload**: Upload multiple files at once up to 10MB total
- **OCR Support**: Full OCR processing for scanned documents and images  
- **Smart Document Detection**: Automatically detects non-financial documents with helpful warnings
- **Interactive Chat**: Ask Claude AI questions about your uploaded documents
- **AI-Generated Questions**: Smart nudge cards with priority-based suggestions
- **Two-Column Layout**: Modern, professional interface design
- **Real-Time Progress**: Visual upload queue with status tracking
- **Drag & Drop Multiple Files**: Select or drag multiple files simultaneously

## Core Features

- **Multi-Format Document Upload**: Upload PDF, Word, CSV, Text, and Image files for analysis
- **AI-Powered Analysis**: Uses Claude AI to extract key information from documents
- **Payment Predictions**: Predicts when clients will likely pay based on document data
- **Cash Flow Insights**: Provides urgency levels and recommended actions
- **Drag & Drop Interface**: Intuitive file upload with drag and drop support
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Security-First**: Built with security best practices to protect user data

## What the App Analyzes

- Client/company names and contact information
- Invoice/document numbers and amounts
- Issue dates, due dates, and payment terms
- Predicted payment timeline and probability
- Urgency level classification (High/Medium/Low)
- Cash flow impact assessment
- Confidence scoring for analysis accuracy
- Document type detection (invoice, receipt, statement, etc.)
- Actionable recommendations for collection

## Supported File Formats

### ✅ Fully Supported
- **PDF** (.pdf) - Best format for invoices and receipts
- **Microsoft Word** (.docx, .doc) - Typed invoices and documents
- **CSV** (.csv) - Tabular financial data and invoice lists
- **Text Files** (.txt) - Plain text invoices and data
- **Images** (.jpg, .jpeg, .png) - Scanned documents with full OCR support

### ❌ Currently Disabled
- **Excel Files** (.xlsx, .xls) - Temporarily disabled due to security vulnerabilities

### Excel Alternatives
If you have Excel files, you can:
1. **Export to CSV** - Save Excel file as CSV format
2. **Copy to Text** - Copy Excel data and save as .txt file  
3. **Print to PDF** - Convert Excel sheet to PDF format

## Tech Stack

**Frontend:**
- React 18 with modern hooks
- Axios for API communication
- Custom responsive CSS (no external UI frameworks)
- Drag & drop file handling
- Real-time error handling and validation

**Backend:**
- Node.js with Express framework
- Multer for secure file upload handling
- PDF-Parse for PDF text extraction
- Mammoth for Word document processing
- Tesseract.js for OCR image processing
- Claude AI API integration for document analysis and chat
- CORS enabled for cross-origin requests
- Input sanitization and security measures

**Security Features:**
- File type validation and filtering
- File size limits (10MB max)
- Input sanitization to prevent injection attacks
- Memory-only processing (files not saved to disk)
- Vulnerable dependency removal (XLSX library excluded)

## Prerequisites

- Node.js v16 or higher
- npm v8 or higher
- Claude AI API key from Anthropic Console

## Installation & Setup

### 1. Project Setup
```bash
mkdir cash-flow-analyzer
cd cash-flow-analyzer
```

### 2. Backend Setup
```bash
mkdir backend
cd backend
npm init -y
npm install express multer cors pdf-parse axios dotenv mammoth
```

Create the following files in the backend folder:
- `server.js` - Main server file (use provided code)
- `.env` - Environment variables file

### 3. Frontend Setup
```bash
cd ..
npx create-react-app frontend
cd frontend
npm install axios
```

**Note for Windows PowerShell users:**
If you get execution policy errors, either:
- Use Command Prompt (cmd) instead of PowerShell
- Or run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

Update package.json scripts for Node.js compatibility:
```json
"scripts": {
  "start": "set NODE_OPTIONS=--openssl-legacy-provider && react-scripts start",
  "build": "set NODE_OPTIONS=--openssl-legacy-provider && react-scripts build",
  "test": "react-scripts test",
  "eject": "react-scripts eject"
}
```

Replace the default React files:
- `src/App.js` - Main React component (use provided code)
- `src/App.css` - Custom styles (use provided code)

### 4. Environment Configuration
Create a `.env` file in the backend folder:
```
CLAUDE_API_KEY=your_claude_api_key_here
```

**Get your API key:**
1. Visit https://console.anthropic.com/
2. Create an account and verify email
3. Navigate to API Keys section
4. Generate a new API key
5. Copy key to your .env file

## Running the Application

### Start Backend Server
```bash
cd backend
node server.js
```
✅ Server runs on: http://localhost:5000
✅ You should see: "Server running on port 5000"

### Start Frontend Development Server
```bash
cd frontend
npm start
```
✅ Frontend runs on: http://localhost:3000
✅ Browser should automatically open the application

**Both servers must be running simultaneously for the app to work.**

## Usage Guide

### 1. Upload Document
- **Click Upload Area**: Click the dotted area to browse files
- **Drag & Drop**: Drag files directly onto the upload area
- **Supported Types**: The app shows all supported file formats

### 2. File Validation
- **Format Check**: App validates file type before upload
- **Size Check**: Maximum 10MB file size limit
- **Preview**: Shows selected file name, size, and type

### 3. AI Analysis
- **Click Analyze**: Press "Analyze Document" button
- **Processing**: AI extracts and analyzes document content
- **Results**: View structured analysis with confidence scores

### 4. Review Results
- **Document Info**: Client name, amounts, dates
- **Predictions**: When payment will likely arrive
- **Urgency**: Priority level for follow-up
- **Actions**: Specific recommendations for cash flow management

## API Endpoints

### Backend API Reference

**Health Check**
```
GET /api/health
Response: { "status": "Server is running", "timestamp": "ISO-date" }
```

**Get Supported Formats**
```
GET /api/supported-formats
Response: {
  "supportedFormats": [array of format objects],
  "maxFileSize": "10MB",
  "notes": [array of usage notes],
  "securityInfo": { security messages }
}
```

**Analyze Document**
```
POST /api/analyze
Content-Type: multipart/form-data
Body: { document: [file] }
Response: {
  "success": true,
  "fileName": "document.pdf",
  "fileType": "application/pdf", 
  "analysis": { extracted data },
  "extractedTextLength": 1234
}
```

## Security Implementation

### File Upload Security
- **Type Validation**: Only approved MIME types accepted
- **Size Limits**: 10MB maximum file size
- **Memory Processing**: Files processed in RAM, never saved to disk
- **Input Sanitization**: Text content cleaned before AI processing

### Vulnerability Management
- **XLSX Library Removed**: Eliminated high-severity security vulnerabilities
- **Dependency Monitoring**: Regular security audits of npm packages
- **Error Handling**: Secure error messages without information leakage
- **CORS Configuration**: Proper cross-origin request handling

## Troubleshooting

### Common Installation Issues

**PowerShell Execution Policy Error:**
```bash
# Solution 1: Use Command Prompt instead
# Solution 2: Run as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Node.js OpenSSL Error:**
```bash
# Add to frontend/package.json scripts:
"start": "set NODE_OPTIONS=--openssl-legacy-provider && react-scripts start"
```

**NPX Command Not Found:**
- Ensure Node.js is properly installed
- Restart command prompt after Node.js installation
- Check PATH environment variables

### Runtime Issues

**Blank Page in Browser:**
- Check browser console (F12 → Console) for JavaScript errors
- Ensure both backend and frontend servers are running
- Verify React component imports are correct

**File Upload Failures:**
- Check file size (must be under 10MB)
- Verify file format is supported
- Ensure backend server is accessible on port 5000

**AI Analysis Errors:**
- Verify Claude API key is set in .env file
- Check backend terminal for API error messages
- Ensure file contains readable text content

### Performance Optimization

**Large File Processing:**
- PDF files process fastest
- Word documents may take longer for complex formatting
- Image files require more processing time

**Network Considerations:**
- Backend and frontend run on different ports
- CORS is configured for localhost development
- Production deployment requires additional configuration

## Development Tips

### Best Practices
- Keep both servers running during development
- Use browser DevTools for frontend debugging
- Monitor backend terminal for server errors
- Test with various document formats and sizes

### Code Structure
- Backend: Single server.js file with modular functions
- Frontend: React component with hooks for state management
- Styling: Custom CSS without external dependencies
- Error Handling: Comprehensive try-catch blocks throughout

## Future Enhancements

### Planned Features
- **OCR Integration**: Full image and scanned document support
- **Excel Security**: Safe Excel processing when vulnerabilities are patched
- **User Authentication**: Login system and user accounts
- **Document History**: Store and track analysis history
- **Batch Processing**: Upload and analyze multiple files simultaneously
- **Advanced Analytics**: Dashboard with charts and trends
- **API Integrations**: Connect with QuickBooks, Xero, FreshBooks
- **Mobile Apps**: React Native iOS and Android versions

### Potential Integrations
- **Accounting Software**: Direct integration with popular accounting tools
- **Banking APIs**: Real-time cash flow monitoring
- **Calendar Systems**: Schedule follow-up reminders
- **Email Automation**: Automated payment reminder sequences
- **Reporting Tools**: Advanced business intelligence features

## Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes with proper testing
4. Ensure security best practices are followed
5. Submit a pull request with detailed description

### Code Standards
- Follow existing code structure and naming conventions
- Add comments for complex logic
- Test all file format combinations
- Validate security implications of changes

## Deployment Considerations

### Production Requirements
- **Environment Variables**: Secure API key management
- **HTTPS**: SSL certificate for secure communication
- **File Limits**: Consider server storage and bandwidth
- **Error Logging**: Comprehensive logging system
- **Monitoring**: Health checks and performance monitoring

### Hosting Options
- **Frontend**: Vercel, Netlify, AWS S3 + CloudFront
- **Backend**: AWS EC2, Google Cloud Run, Heroku
- **Full Stack**: AWS Amplify, Google App Engine

## License & Support

### License
This project is developed for educational and business purposes.

### Getting Help
1. **Documentation**: Review this README and PROJECT_STRUCTURE.md
2. **Issues**: Check browser console and server logs
3. **Dependencies**: Ensure all npm packages are properly installed
4. **API Keys**: Verify Claude API key configuration

### Version History
- **v1.0**: Basic PDF invoice analysis
- **v1.1**: Multi-format support with drag & drop
- **v1.2**: Security hardening and XLSX vulnerability removal

For additional support and updates, monitor the project repository and documentation.