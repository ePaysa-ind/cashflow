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

### Key Features
1. **Multi-Document Upload** (2 files max, 20MB each)
2. **OCR Processing** for images (Tesseract.js)
3. **Financial Analysis** with executive summaries
4. **Interactive Chat** with document context
5. **Document Management** with auto-save
6. **Email Forwarding** for reports
7. **Password Strength Indicator**
8. **Rate Limiting** for API protection
9. **Responsive Two-Column Layout**

## Development Setup

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Firebase account
- Claude API key
- Stripe account (for payments)

### Environment Variables

Create `/backend/.env`:
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

🔧 **Known Issues**:
- Frontend build error: 'user is not defined' on lines that don't contain user
- Authentication tokens not being sent to backend (causing "Anonymous" user)
- Database not receiving user data due to missing auth headers

🚧 **Pending Features**:
- Stripe payment processing (awaiting production keys)
- PDF generation (currently text export)
- User subscription management
- Admin dashboard
- Analytics tracking
- File storage (S3/Cloudinary)

## Code Style Guidelines

- Use ES6+ features
- Async/await for promises
- Proper error handling with try/catch
- Input validation on all endpoints
- Meaningful variable names
- Component-based React structure
- Mobile-first responsive design

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

## Future Enhancements
- Real-time collaboration
- Advanced financial metrics
- Custom report templates
- Webhook integrations
- Mobile app
- Multi-language support
- Batch processing
- API for enterprise