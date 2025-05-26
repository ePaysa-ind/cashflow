const express = require('express');
const multer = require('multer');
const cors = require('cors');
const pdf = require('pdf-parse');
const axios = require('axios');
const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');
const XLSX = require('xlsx');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const helmet = require('helmet');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy - required for Railway and other cloud platforms
// Use specific number instead of true to avoid rate limiter warning
app.set('trust proxy', 1); // Trust first proxy only

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // We'll set custom CSP for API
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' }
});

// Separate rate limiter for health checks (more lenient)
const healthLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per minute (1 per second)
  message: { error: 'Too many health check requests' }
});

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    // Allow localhost for development
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://localhost:3000',
      'https://localhost:3001',
      // Vercel deployments
      'https://cashflow-6l1dmbv8g-cvrs-projects-18b0a489.vercel.app',
      'https://cashflow-f9okksuog-cvrs-projects-18b0a489.vercel.app'
    ];
    
    // Allow all Vercel preview deployments
    if (origin && origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    
    // In production, add your actual domain
    if (process.env.NODE_ENV === 'production' && process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' })); // Increased limit for structured content
app.use('/api/', limiter);

// Configure multer for file uploads (memory storage - no files saved to disk)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit per file
    files: 2, // Maximum 2 files
  },
  fileFilter: (req, file, cb) => {
    // Check for empty files
    if (file.size === 0) {
      cb(new Error('Empty file uploaded'), false);
      return;
    }

    // Security: Block dangerous extensions
    const blockedExtensions = [
      '.exe', '.com', '.bat', '.cmd', '.msi', '.app', '.deb', '.rpm',
      '.sh', '.ps1', '.vbs', '.js', '.jar', '.py', '.rb', '.php',
      '.dll', '.so', '.dylib', '.sys', '.scr', '.pif', '.gadget',
      '.wsf', '.hta', '.apk', '.ipa', '.bin', '.run', '.out'
    ];
    
    const fileName = file.originalname.toLowerCase();
    const hasBlockedExtension = blockedExtensions.some(ext => fileName.endsWith(ext));
    
    if (hasBlockedExtension) {
      cb(new Error('File type not allowed for security reasons'), false);
      return;
    }

    // Accept multiple file types
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      'application/msword', // DOC
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
      'application/vnd.ms-excel', // XLS
      'text/csv',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'image/webp'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Please upload PDF, Word, Excel, CSV, TXT, or image files.'), false);
    }
  }
});

// Helper function to parse CSV safely
function parseCSV(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length === 0) return '';
  
  let result = 'CSV Data:\n';
  lines.forEach((line, index) => {
    // Simple CSV parsing - escape any potentially dangerous content
    const cleanLine = line.replace(/[<>\"']/g, ''); // Remove potentially harmful characters
    result += `Row ${index + 1}: ${cleanLine}\n`;
  });
  
  return result;
}

// Helper function to extract text from different file types
async function extractTextFromFile(file) {
  const { buffer, mimetype, originalname } = file;
  
  try {
    switch (mimetype) {
      case 'application/pdf':
        const pdfData = await pdf(buffer);
        return pdfData.text;
        
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        const docxResult = await mammoth.extractRawText({ buffer });
        return docxResult.value;
        
      case 'application/msword':
        // For older DOC files, we'll try mammoth (limited support)
        try {
          const docResult = await mammoth.extractRawText({ buffer });
          return docResult.value;
        } catch (docError) {
          throw new Error('DOC file format not fully supported. Please convert to DOCX or PDF.');
        }
        
      case 'text/csv':
        const csvText = buffer.toString('utf8');
        return parseCSV(csvText);
        
      case 'text/plain':
        return buffer.toString('utf8');
        
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      case 'application/vnd.ms-excel':
        // Process Excel files
        try {
          const workbook = XLSX.read(buffer, { type: 'buffer' });
          let excelText = 'Excel Data:\n\n';
          
          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const csvData = XLSX.utils.sheet_to_csv(worksheet);
            excelText += `Sheet: ${sheetName}\n`;
            excelText += csvData + '\n\n';
          });
          
          return excelText;
        } catch (excelError) {
          throw new Error('Failed to process Excel file: ' + excelError.message);
        }
        
      case 'image/jpeg':
      case 'image/jpg':
      case 'image/png':
      case 'image/gif':
      case 'image/bmp':
      case 'image/tiff':
      case 'image/webp':
        // Process images with OCR using Tesseract
        console.log('Processing image with OCR:', originalname, 'Size:', buffer.length, 'bytes');
        try {
          const ocrResult = await Tesseract.recognize(buffer, 'eng', {
            logger: m => {
              if (m.status === 'recognizing text') {
                console.log('OCR Progress:', Math.round(m.progress * 100) + '%');
              }
            }
          });
          
          console.log('OCR Result:', {
            confidence: ocrResult.data.confidence,
            textLength: ocrResult.data.text.length,
            preview: ocrResult.data.text.substring(0, 100) + '...'
          });
          
          if (!ocrResult.data.text.trim()) {
            throw new Error('No readable text found in the image. Please ensure the image contains clear, readable text.');
          }
          
          console.log('OCR extraction completed successfully');
          return ocrResult.data.text;
        } catch (ocrError) {
          console.error('OCR processing failed:', ocrError);
          throw new Error(`OCR processing failed: ${ocrError.message}`);
        }
        
      default:
        throw new Error(`Unsupported file type: ${mimetype}`);
    }
  } catch (error) {
    console.error('Text extraction error:', error);
    throw new Error(`Failed to extract text from ${originalname}: ${error.message}`);
  }
}

// Helper function to call Claude API with input sanitization
async function analyzeWithClaude(text, fileName, fileType, documentType = 'financial') {
  try {
    // Sanitize input text to prevent injection attacks
    const sanitizedText = text.replace(/[<>]/g, '').substring(0, 50000); // Increased limit for better analysis
    
    const systemPrompt = documentType === 'financial' ? 
      `You are an expert financial analyst specializing in cash flow analysis, financial forecasting, and business intelligence. Analyze the provided document and extract comprehensive financial insights.` :
      `You are a document analysis expert. Analyze the provided document and extract key information, summarizing the main points and identifying important data.`;
    
    const analysisPrompt = documentType === 'financial' ?
      `Analyze this financial document (${fileName}, type: ${fileType}) and provide a comprehensive financial analysis.

Return the analysis in this exact JSON format:
{
  "executiveSummary": {
    "businessName": "Company or business name from document",
    "period": "Time period covered",
    "totalRevenue": "Total revenue amount with currency",
    "totalExpenses": "Total expenses with currency",
    "netIncome": "Net income/profit with currency",
    "revenueGrowth": "Year-over-year or period growth percentage"
  },
  "cashFlowAnalysis": {
    "operatingCashFlow": "Operating cash flow details",
    "investingCashFlow": "Investing activities cash flow",
    "financingCashFlow": "Financing activities cash flow",
    "netCashFlow": "Net cash flow change",
    "cashFlowTrend": "Positive/Negative/Stable trend analysis"
  },
  "financialHealth": "Detailed assessment of financial health, liquidity, and solvency. Include specific ratios if available.",
  "keyRisks": "Identify top 3-5 financial risks based on the data",
  "opportunities": "Identify growth opportunities and positive indicators",
  "cashFlowProjection": "Project cash flow for next 3-6 months based on current trends",
  "recommendations": "Specific actionable recommendations for improving cash flow and financial performance",
  "dataQuality": "HIGH/MEDIUM/LOW - Assessment of data completeness and reliability",
  "documentType": "Type of financial document (income statement, balance sheet, cash flow statement, etc.)"
}` :
      `Analyze this document (${fileName}, type: ${fileType}) and extract key information.

Return the analysis in this JSON format:
{
  "documentType": "Type of document detected",
  "summary": "Brief summary of document contents",
  "keyPoints": ["Main point 1", "Main point 2", "Main point 3"],
  "extractedData": {
    "dates": ["Important dates found"],
    "amounts": ["Key amounts or numbers"],
    "names": ["Important names or entities mentioned"]
  },
  "isFinancial": false,
  "suggestedAction": "What the user might want to do with this document"
}`;

    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-5-sonnet-20241022', // Using Claude 3.5 Sonnet
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `${systemPrompt}\n\n${analysisPrompt}\n\nDocument content:\n${sanitizedText}`
      }],
      temperature: 0.3
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      }
    });

    return response.data.content[0].text;
  } catch (error) {
    console.error('Claude API Error:', error.response?.data || error.message);
    throw new Error('Failed to analyze document with AI');
  }
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Qash API is running',
    version: '2.0.0',
    endpoints: {
      health: '/api/health',
      analyze: 'POST /api/analyze',
      chat: 'POST /api/chat',
      sendReport: 'POST /api/send-report',
      supportedFormats: '/api/supported-formats'
    }
  });
});

// Health check endpoint with its own rate limiter
app.get('/api/health', healthLimiter, (req, res) => {
  res.json({ 
    status: 'Server is running', 
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Get supported file types endpoint
app.get('/api/supported-formats', (req, res) => {
  res.json({
    supportedFormats: [
      {
        type: 'PDF',
        extensions: ['.pdf'],
        description: 'PDF documents with text content'
      },
      {
        type: 'Word',
        extensions: ['.docx', '.doc'],
        description: 'Microsoft Word documents'
      },
      {
        type: 'Excel',
        extensions: ['.xlsx', '.xls'],
        description: 'Excel spreadsheets for financial data'
      },
      {
        type: 'CSV',
        extensions: ['.csv'],
        description: 'Comma-separated values files'
      },
      {
        type: 'Text',
        extensions: ['.txt'],
        description: 'Plain text files'
      },
      {
        type: 'Images',
        extensions: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'],
        description: 'Image files with OCR text extraction'
      }
    ],
    maxFileSize: '20MB per file',
    maxFiles: 2,
    notes: [
      'Financial documents work best for cash flow analysis',
      'Images are processed with OCR for text extraction',
      'Non-financial documents will receive general analysis'
    ]
  });
});

// Main upload and analysis endpoint - supports multiple files
app.post('/api/analyze', upload.array('documents', 2), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    console.log('Processing files:', req.files.map(f => f.originalname));
    
    const results = [];
    
    // Process each file
    for (const file of req.files) {
      try {
        console.log('Processing file:', file.originalname, 'Type:', file.mimetype, 'Size:', file.size);
        
        // Extract text from the file
        const extractedText = await extractTextFromFile(file);
        
        if (!extractedText.trim()) {
          results.push({
            fileName: file.originalname,
            error: 'No readable content could be extracted from the file'
          });
          continue;
        }
        
        console.log('Extracted text length for', file.originalname, ':', extractedText.length);
        
        // Detect if document is financial
        const financialKeywords = ['revenue', 'income', 'expense', 'profit', 'loss', 'cash', 'balance', 'asset', 'liability', 'equity', 'invoice', 'payment', 'total', 'amount', 'tax', 'cost'];
        const textLower = extractedText.toLowerCase();
        const isFinancial = financialKeywords.some(keyword => textLower.includes(keyword));
        
        // Analyze with Claude
        const analysis = await analyzeWithClaude(extractedText, file.originalname, file.mimetype, isFinancial ? 'financial' : 'general');
        
        // Parse the analysis
        let parsedAnalysis;
        try {
          let cleanedAnalysis = analysis.trim();
          
          // Remove markdown code blocks if present
          if (cleanedAnalysis.includes('```json')) {
            const jsonStart = cleanedAnalysis.indexOf('```json') + 7;
            const jsonEnd = cleanedAnalysis.lastIndexOf('```');
            if (jsonEnd > jsonStart) {
              cleanedAnalysis = cleanedAnalysis.substring(jsonStart, jsonEnd).trim();
            }
          } else if (cleanedAnalysis.startsWith('```')) {
            cleanedAnalysis = cleanedAnalysis.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }
          
          // Try to find JSON object in the response
          const jsonMatch = cleanedAnalysis.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            cleanedAnalysis = jsonMatch[0];
          }
          
          parsedAnalysis = JSON.parse(cleanedAnalysis);
          console.log('Successfully parsed JSON analysis for', file.originalname);
        } catch (parseError) {
          console.log('Claude returned non-JSON response for', file.originalname, ', using raw text:', parseError.message);
          parsedAnalysis = { rawAnalysis: analysis };
        }
        
        results.push({
          fileName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
          analysis: parsedAnalysis,
          isFinancial: isFinancial,
          extractedTextLength: extractedText.length
        });
        
      } catch (fileError) {
        console.error('Error processing file', file.originalname, ':', fileError.message);
        results.push({
          fileName: file.originalname,
          error: fileError.message
        });
      }
    }
    
    // Return results
    res.json({
      success: true,
      files: results,
      totalFiles: req.files.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze documents',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Analyze financial metrics endpoint
app.post('/api/analyze-metrics', async (req, res) => {
  try {
    const { metrics, files } = req.body;
    
    if (!metrics || !files || files.length === 0) {
      return res.status(400).json({ error: 'No metrics data provided' });
    }
    
    console.log('Processing metrics for files:', files.map(f => f.fileName));
    
    // Build a comprehensive prompt for Claude with structured content
    const metricsAnalysis = await analyzeMetricsWithClaude(metrics, files);
    
    res.json({
      success: true,
      analysis: metricsAnalysis,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Metrics analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze metrics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper function for metrics analysis
async function analyzeMetricsWithClaude(metrics, files) {
  try {
    const filesSummary = files.map(f => `- ${f.fileName}: ${f.analysis?.executiveSummary?.businessName || 'Unknown'}`).join('\n');
    
    const prompt = `As a CFO-level financial analyst, analyze these aggregated financial metrics from multiple documents:

Files analyzed:
${filesSummary}

Aggregated Metrics:
- Total Revenue: ${metrics.totalRevenue || 'N/A'}
- Total Expenses: ${metrics.totalExpenses || 'N/A'}
- Net Cash Flow: ${metrics.netCashFlow || 'N/A'}
- Average Profit Margin: ${metrics.avgProfitMargin || 'N/A'}%

Individual File Analyses:
${JSON.stringify(files.map(f => f.analysis), null, 2)}

Provide a comprehensive CFO-level analysis including:
1. Overall financial health assessment
2. Cash flow trends and projections
3. Key risks across all documents
4. Strategic recommendations
5. Areas requiring immediate attention

Format your response as clear, executive-level insights.`;

    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }],
      temperature: 0.3
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      }
    });

    return response.data.content[0].text;
  } catch (error) {
    console.error('Claude metrics analysis error:', error);
    throw error;
  }
}

// Chat endpoint for document Q&A
app.post('/api/chat', async (req, res) => {
  try {
    const { query, documents } = req.body;
    
    if (!query || !documents || documents.length === 0) {
      return res.status(400).json({ error: 'No query or documents provided' });
    }
    
    console.log('Chat query:', query);
    console.log('Documents context:', documents.length, 'documents');
    
    // Prepare context from documents
    let documentsContext = '';
    documents.forEach((doc, index) => {
      documentsContext += `\nDocument ${index + 1}: ${doc.name}\n`;
      if (doc.analysis) {
        documentsContext += `Analysis: ${JSON.stringify(doc.analysis, null, 2)}\n`;
      }
    });
    
    // Call Claude API for chat response
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `You are a helpful financial analysis assistant. Based on the following document analyses, please answer the user's question. Be specific and reference the data from the documents when possible.

Documents analyzed:
${documentsContext}

User question: ${query}

Provide a helpful, specific answer based on the document data above. If the question cannot be answered from the available data, explain what additional information would be needed.`
      }],
      temperature: 0.3
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      }
    });
    
    const chatResponse = response.data.content[0].text;
    
    res.json({
      success: true,
      query: query,
      response: chatResponse,
      documentCount: documents.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Chat API Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to process chat query',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Email sending endpoint
app.post('/api/send-report', async (req, res) => {
  try {
    const { to, subject, message, document } = req.body;
    
    if (!to || !subject || !document) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create email transporter
    // For production, use proper SMTP settings (Gmail, SendGrid, etc.)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Generate PDF content (text version for now)
    let reportContent = `QASH FINANCIAL ANALYSIS REPORT\n`;
    reportContent += `${'='.repeat(60)}\n\n`;
    reportContent += `Document: ${document.fileName}\n`;
    reportContent += `Analysis Date: ${new Date(document.uploadDate).toLocaleString()}\n`;
    reportContent += `File Count: ${document.fileCount || 1}\n\n`;
    
    if (document.analysis && document.analysis.files) {
      document.analysis.files.forEach((file, index) => {
        reportContent += `\nFILE ${index + 1}: ${file.fileName}\n`;
        reportContent += `${'-'.repeat(40)}\n`;
        
        if (file.analysis) {
          const analysis = file.analysis;
          
          // Executive Summary
          if (analysis.executiveSummary) {
            reportContent += '\nEXECUTIVE SUMMARY\n';
            if (typeof analysis.executiveSummary === 'object') {
              Object.entries(analysis.executiveSummary).forEach(([key, value]) => {
                if (value) {
                  reportContent += `• ${key.replace(/([A-Z])/g, ' $1').trim()}: ${value}\n`;
                }
              });
            }
          }
          
          // Key sections
          ['financialHealth', 'keyRisks', 'cashFlowProjection', 'recommendations'].forEach(section => {
            if (analysis[section]) {
              reportContent += `\n${section.toUpperCase().replace(/([A-Z])/g, ' $1').trim()}\n`;
              reportContent += `${analysis[section]}\n`;
            }
          });
        }
      });
    }
    
    reportContent += `\n${'='.repeat(60)}\n`;
    reportContent += `Generated by Qash - ${new Date().toLocaleString()}\n`;

    // Create attachment
    const attachment = {
      filename: `${document.fileName.replace(/\.[^/.]+$/, '')}_analysis.txt`,
      content: reportContent
    };

    // Send email
    const mailOptions = {
      from: process.env.SMTP_FROM || 'Qash Financial Analysis <noreply@qash.com>',
      to: to,
      subject: subject,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">Qash Financial Analysis Report</h2>
          <pre style="white-space: pre-wrap;">${message}</pre>
          <hr style="border: 1px solid #E5E7EB; margin: 20px 0;">
          <p style="color: #6B7280; font-size: 14px;">
            Please find the detailed financial analysis report attached.
          </p>
        </div>
      `,
      attachments: [attachment]
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', to);
    
    res.json({ success: true, message: 'Report sent successfully' });
    
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ 
      error: 'Failed to send email', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 20MB per file.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum 2 files allowed.' });
    }
  }
  
  // Log the error
  console.error('Server error:', error);
  
  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  res.status(500).json({ 
    error: 'Internal server error',
    ...(isDevelopment && { details: error.message })
  });
});

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`📡 Server running on port ${PORT}`);
  console.log('✅ All features enabled:');
  console.log('  - Multiple file upload (max 2 files, 20MB each)');
  console.log('  - OCR for images');
  console.log('  - Rate limiting');
  console.log('  - Email forwarding');
  console.log('  - Security headers');
  console.log('  - Financial document analysis');
  
  if (!process.env.CLAUDE_API_KEY) {
    console.warn('⚠️  CLAUDE_API_KEY not found in environment variables');
  } else {
    console.log('✅ Claude API key configured');
  }
  
  if (!process.env.SMTP_USER) {
    console.warn('⚠️  Email configuration not found - email forwarding will not work');
  }
});