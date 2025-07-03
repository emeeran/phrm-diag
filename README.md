# PHRM-Diag: Personal Health Record Manager with AI Diagnostics

A comprehensive web application for securely managing personal and family health records with intelligent AI-powered insights and diagnostic support.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Docker and Docker Com### 🚀 Deployment

For detailed deployment instructions, see `DEPLOYMENT.md`, which includes:
- Vercel configuration
- Environment variables setup
- Database migration process
- Post-deployment checks

## 🔒 Security Features

The PHRM-Diag application includes the following security features:

- **Authentication**
  - Password hashing with bcrypt
  - Multi-factor authentication (TOTP)
  - Session management and login monitoring
  - Account lockout after failed login attempts
  - Secure session expiration

- **Data Protection**
  - AES-256 encryption for sensitive data
  - Client-side encryption for file storage
  - S3 secure file storage with encryption
  - Audit logging for all critical actions
  - Data backup and recovery procedures

- **API Security**
  - Rate limiting to prevent abuse
  - Input sanitization to prevent XSS
  - CSRF protection
  - Secure headers

## 🤝 Contributing

This project follows the task list defined in `TASK_LIST.md`. Each module builds upon the previous with specific deliverables and success criteria.- OpenAI API Key (for AI features)

### Setup Instructions

1. **Clone and Install Dependencies**
```bash
git clone <repository-url>
cd phrm-diag
npm install
```

2. **Start Database**
```bash
docker-compose up -d
```

3. **Configure Environment**
```bash
cp .env.local.example .env.local
# Edit .env.local with your configuration:
# - DATABASE_URL for PostgreSQL
# - NEXTAUTH_SECRET for authentication
# - OPENAI_API_KEY for AI features
```

4. **Setup Database**
```bash
npx prisma generate
npx prisma db push
```

5. **Start Development Server**
```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📋 Completed Features (MVP Weeks 1-4)

### ✅ Week 1: Foundation Setup
- [x] Next.js 14+ project with TypeScript
- [x] Tailwind CSS + shadcn/ui components
- [x] ESLint, Prettier, and Husky configuration
- [x] PostgreSQL database with Docker
- [x] Prisma ORM with basic schema
- [x] NextAuth.js authentication system
- [x] User registration/login pages
- [x] JWT token handling
- [x] Basic user profile management

### ✅ Week 2: Health Records System
- [x] Health Records CRUD operations
- [x] File upload system for medical documents
- [x] Health record categorization (symptoms, medications, appointments, lab results)
- [x] Health record list/detail views
- [x] Edit and delete functionality
- [x] Responsive UI design

### ✅ Week 3: AI Integration
- [x] OpenAI GPT integration
- [x] AI health chat interface
- [x] Context-aware responses using user health records
- [x] General health information and education
- [x] Medical disclaimers and safety warnings
- [x] AI interaction tracking

### ✅ Week 4: MVP Polish
- [x] Improved mobile responsiveness
- [x] Enhanced loading states and error handling
- [x] Error boundary system
- [x] Dashboard with health overview and stats
- [x] Enhanced navigation with mobile menu
- [x] Basic testing procedures
- [x] Vercel deployment configuration
- [x] Environment variables documentation
- [x] User-friendly error messages
- [x] Form validation improvements

### 📝 Current Status

**Completed MVP Features:**
- ✅ Full authentication system
- ✅ Complete health records CRUD with file uploads
- ✅ AI health assistant with OpenAI integration

### ✅ Module 1: Enhanced AI System (Weeks 5-6)
- [x] Hybrid AI routing based on complexity assessment (GPT-3.5/GPT-4)
- [x] AI usage statistics and cost tracking
- [x] Health trend analysis with AI-powered insights
- [x] Medication interaction checking
- [x] Enhanced loading states for better UX

### ✅ Module 2: Family Management (Weeks 7-8) COMPLETED
- [x] Family member invitation system
- [x] Permission-based access control (view, edit, admin)
- [x] Email notifications for invitations
- [x] Family profile management UI
- [x] Shared health records with permissions
- [x] Family health timeline
- [x] Emergency contact system
- [x] Family-based notifications system
- ✅ Comprehensive error handling and loading states
- ✅ Fully responsive design for mobile devices
- ✅ Enhanced dashboard with health stats and data visualization
- ✅ Improved navigation with mobile support
- ✅ Database schema and migrations
- ✅ Production-ready Docker setup
- ✅ Vercel deployment configuration

**Ready for Production:**
- User registration and login system
- Creating and managing health records
- Uploading and viewing medical documents
- Health record categorization and filtering
- AI health chat with personalized context
- Error handling and loading states
- Mobile-responsive design
- Dashboard with health insights

## 🏗️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API routes, Prisma ORM
- **Database**: PostgreSQL with Docker
- **Authentication**: NextAuth.js with JWT
- **AI**: OpenAI GPT-3.5-turbo
- **File Storage**: Local file system (MVP)
- **Development**: ESLint, Prettier, Husky

## 🎯 Next Development Phase

### ✅ Module 1: Enhanced AI System (Weeks 5-6) COMPLETED
- ✅ Hybrid AI architecture with complexity-based routing
- ✅ Cost tracking and usage statistics
- ✅ Advanced medical prompt templates
- ✅ AI settings and preferences
- ✅ Health trend analysis with pattern recognition
- ✅ Medication interaction checking
- ✅ Enhanced loading indicators and UI improvements

### Module 3: Mobile & PWA (Weeks 9-10)
- Mobile-first UI optimization
- Progressive Web App implementation
- Offline data access
- Camera integration for document capture
- Push notifications

## 📖 Development Guidelines

### Vibe Coding Principles
1. **Ship Early, Ship Often**: Deploy working features quickly
2. **User Feedback Driven**: Prioritize based on user needs
3. **Iterative Improvement**: Constantly refine and enhance
4. **Technical Debt Management**: Balance speed with quality
5. **Security First**: Never compromise on health data security

### Definition of Done
- [x] Feature works end-to-end
- [x] Responsive design (mobile + desktop)
- [x] Comprehensive error handling implemented
- [x] Security considerations addressed
- [x] Basic tests procedures documented
- [x] Documentation updated
- [x] Ready for Vercel deployment

## 🗃️ Database Schema

### Core Tables
- `users` - User accounts and authentication
- `health_records` - Health records with categories
- `documents` - File attachments for health records
- `family_members` - Family relationship management
- `family_invitations` - Family member invitations
- `emergency_contacts` - Emergency contact information
- `notifications` - User notifications system
- `ai_interactions` - AI chat history and costs

## 🔐 Environment Variables

Create `.env.local` with:

```env
DATABASE_URL="postgresql://phrm_user:phrm_password@localhost:5432/phrm_db?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

## 📁 Project Structure

```
phrm-diag/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/            # Reusable components
│   ├── ui/                # shadcn/ui components
│   └── dashboard/         # Dashboard-specific components
├── lib/                   # Utility libraries
│   ├── auth.ts            # Authentication configuration
│   ├── prisma.ts          # Database client
│   └── utils.ts           # Common utilities
├── prisma/                # Database schema and migrations
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript type definitions
```

## 🧪 Testing

```bash
# Run tests (coming in Week 4)
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🚀 Deployment

The application is configured for easy deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/signin` - User login (NextAuth)
- `POST /api/auth/signout` - User logout (NextAuth)

### Health Records (Coming in Week 2)
- `GET /api/health-records` - List user's health records
- `POST /api/health-records` - Create new health record
- `PUT /api/health-records/:id` - Update health record
- `DELETE /api/health-records/:id` - Delete health record

## 🛡️ Security Features

- Password hashing with bcrypt
- JWT-based authentication
- CSRF protection (NextAuth)
- Input validation and sanitization
- SQL injection prevention (Prisma)

## 📈 Roadmap

### Week 2: Basic Health Records
- Health record CRUD operations
- File upload system
- Categorization system

### Week 3: Simple AI Integration
- Ollama local AI setup
- Basic health chat interface
- Simple Q&A functionality

### Week 4: MVP Polish ✅
- Enhanced mobile responsiveness
- Comprehensive error handling system
- Loading states throughout the app
- Basic testing procedures
- Vercel deployment configuration
- Dashboard with health insights

## 📊 What's Next?

Now that we've completed the MVP phase, we're moving on to the modular enhancement phase. See `TASK_LIST.md` for details on upcoming modules:

### Module 1: Enhanced AI System (Weeks 5-6)
- Hybrid AI architecture
- Cost tracking system
- Improved medical prompts
- Health trend analysis

### Module 2: Family Management (Weeks 7-8)
- Family relationships
- Shared health records
- Permission system
- Family health insights

## 🚀 Deployment

For detailed deployment instructions, see `DEPLOYMENT.md`, which includes:
- Vercel configuration
- Environment variables setup
- Database migration process
- Post-deployment checks

## 🤝 Contributing

This project follows the task list defined in `TASK_LIST.md`. Each module builds upon the previous with specific deliverables and success criteria.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions or issues:
1. Check the task list for current development status
2. Review the database schema for data structure questions
3. Review the testing documentation in `/tests/README.md`
4. Consult the API documentation for endpoint usage

---

**Current Status: Module 4 - Security & Compliance (Weeks 11-12) Completed ✅**
**Next Phase: Module 5 - Analytics & Insights (Weeks 13-14)**
