# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Qash** - 100% SaaS Financial Analysis Platform powered by Claude AI

A comprehensive cash flow analysis tool that helps businesses understand their financial health through AI-powered document analysis with interactive chat capabilities.

## Architecture

### 100% Cloud-Based SaaS Model
- **Frontend**: React 18 with Firebase Authentication
- **Backend**: Express.js API with Claude AI integration
- **Authentication**: Firebase Auth (Google & Email/Password)
- **Payments**: Stripe integration for subscriptions
- **AI Engine**: Claude 3.5 Sonnet for financial analysis
- **File Processing**: Memory-only processing (no disk storage)
- **Email**: Nodemailer for report forwarding

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
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
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

- `GET /api/health` - Health check
- `GET /api/supported-formats` - Get supported file types
- `POST /api/analyze` - Analyze documents (multipart/form-data)
- `POST /api/analyze-metrics` - Analyze aggregated metrics
- `POST /api/chat` - Chat with document context
- `POST /api/send-report` - Email report forwarding

## Security Features

- Rate limiting (100 req/15min, 60 req/min for health)
- Helmet.js security headers
- CORS with whitelist
- File type validation
- Input sanitization
- Memory-only file processing
- Blocked executable extensions

## Deployment

### Recommended Stack
1. **Frontend**: Vercel (automatic deploys from GitHub)
2. **Backend**: Railway or Render
3. **Database**: PostgreSQL (Railway/Supabase)
4. **File Storage**: AWS S3 or Cloudinary
5. **Email**: SendGrid or AWS SES

### Production Checklist
- [ ] Set all environment variables
- [ ] Configure production CORS origins
- [ ] Set up SSL certificates
- [ ] Configure Stripe webhooks
- [ ] Set up email service
- [ ] Add database for persistent storage
- [ ] Configure monitoring (Sentry, LogRocket)
- [ ] Set up backup strategy

## Current Status (v2.0)

✅ **Completed Features**:
- Firebase authentication
- Multiple file upload
- OCR image processing
- Financial document analysis
- Interactive chat
- Document saving
- Email forwarding
- Password validation
- Rate limiting

🚧 **Pending Features**:
- Real database integration (currently localStorage)
- Stripe payment processing
- PDF generation (currently text export)
- User subscription management
- Admin dashboard
- Analytics tracking

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

## Troubleshooting

### Common Issues
1. **500 Error on Upload**: Check Claude API key
2. **CORS Errors**: Update allowed origins
3. **Email Not Sending**: Configure SMTP settings
4. **File Size Error**: Check multer limits

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