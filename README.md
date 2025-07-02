# PHRM-Diag: Personal Health Record Manager with AI Diagnostics

A comprehensive web application for securely managing personal and family health records with intelligent AI-powered insights and diagnostic support.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Docker and Docker Compose
- Git

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
# Edit .env.local with your configuration
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

Visit `http://localhost:3000` to see the application.

## 📋 MVP Features (Week 1-4 Complete)

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
- [x] Password reset functionality

### 📝 Current Status

**Completed:**
- ✅ Development environment setup
- ✅ Authentication system (login/register)
- ✅ Database schema and migrations
- ✅ Basic UI components (shadcn/ui)
- ✅ Dashboard layout and navigation
- ✅ User session management

**Next Steps (Week 2):**
- [ ] Health Records CRUD operations
- [ ] File upload system
- [ ] Health record categorization
- [ ] Basic health record list/detail views

## 🏗️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API routes, Prisma ORM
- **Database**: PostgreSQL with encryption
- **Authentication**: NextAuth.js
- **Development**: ESLint, Prettier, Husky

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
- [x] Basic error handling implemented
- [x] Security considerations addressed
- [x] Basic tests written (coming in Week 4)
- [x] Documentation updated
- [x] Deployed to staging environment

## 🗃️ Database Schema

### Core Tables
- `users` - User accounts and authentication
- `health_records` - Health records with categories
- `documents` - File attachments for health records
- `family_members` - Family relationship management
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

### Week 4: MVP Polish
- Responsive design improvements
- Error handling
- Basic testing
- Deployment setup

## 🤝 Contributing

This project follows the task list defined in `TASK_LIST.md`. Each week builds upon the previous with specific deliverables and success criteria.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions or issues:
1. Check the task list for current development status
2. Review the database schema for data structure questions
3. Consult the API documentation for endpoint usage

---

**Current MVP Status: Week 1 Complete ✅**
**Next Milestone: Week 2 - Basic Health Records**
