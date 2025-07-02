# Vercel Deployment Guide for PHRM-Diag

## Prerequisites
1. Create a Vercel account at https://vercel.com
2. Install Vercel CLI: `npm install -g vercel`
3. Have your environment variables ready

## Environment Variables Setup

### Required Environment Variables for Production:

1. **NEXTAUTH_URL**
   - Value: Your production domain (e.g., `https://your-app.vercel.app`)
   - Used by NextAuth.js for redirects and callbacks

2. **NEXTAUTH_SECRET**
   - Value: A random secret string (generate with `openssl rand -base64 32`)
   - Used by NextAuth.js for JWT encryption

3. **DATABASE_URL**
   - Value: Your production PostgreSQL connection string
   - Format: `postgresql://username:password@host:port/database`
   - Recommend using PlanetScale, Supabase, or Railway for database hosting

4. **OPENAI_API_KEY**
   - Value: Your OpenAI API key (optional for MVP)
   - Get from https://platform.openai.com/api-keys

## Database Setup for Production

### Option 1: PlanetScale (Recommended)
1. Create account at https://planetscale.com
2. Create a new database
3. Get connection string from dashboard
4. Add to Vercel environment variables

### Option 2: Supabase
1. Create account at https://supabase.com
2. Create new project
3. Get PostgreSQL connection string
4. Add to Vercel environment variables

### Option 3: Railway
1. Create account at https://railway.app
2. Create PostgreSQL database
3. Get connection string
4. Add to Vercel environment variables

## Deployment Steps

### 1. Connect to Vercel
```bash
vercel login
```

### 2. Deploy from CLI
```bash
# In project root
vercel

# Follow prompts:
# - Link to existing project or create new
# - Select project settings
# - Confirm deployment
```

### 3. Add Environment Variables
```bash
# Add each environment variable
vercel env add NEXTAUTH_URL
vercel env add NEXTAUTH_SECRET  
vercel env add DATABASE_URL
vercel env add OPENAI_API_KEY
```

Or add via Vercel Dashboard:
1. Go to your project dashboard
2. Click "Settings" tab
3. Click "Environment Variables"
4. Add each required variable

### 4. Run Database Migration
After deployment, run Prisma migration:
```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Run migration on production database
vercel env pull .env.production
npx prisma migrate deploy
```

### 5. Verify Deployment
1. Check deployment URL
2. Test authentication
3. Test health record creation
4. Test AI chat functionality

## Deployment Configuration

The `vercel.json` file is already configured with:
- Build settings
- API function timeout (30s for AI responses)
- Environment variable references

## Post-Deployment Checklist

- [ ] Verify all pages load correctly
- [ ] Test user registration and login
- [ ] Test health record CRUD operations
- [ ] Test AI chat functionality
- [ ] Test file upload functionality
- [ ] Check mobile responsiveness
- [ ] Verify error handling
- [ ] Test database connectivity
- [ ] Check API endpoints

## Monitoring and Maintenance

### Vercel Analytics
- Enable Vercel Analytics in dashboard
- Monitor page performance
- Track user interactions

### Error Monitoring
- Consider adding Sentry for error tracking
- Monitor API response times
- Check database connection health

### Database Monitoring
- Monitor database usage and performance
- Set up connection pooling if needed
- Regular backups (handled by most cloud providers)

## Troubleshooting

### Common Issues:

1. **Build Fails**
   - Check TypeScript errors: `npm run type-check`
   - Check ESLint errors: `npm run lint`
   - Verify all dependencies are installed

2. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check database server is accessible
   - Ensure connection pooling is configured

3. **Authentication Issues**
   - Verify NEXTAUTH_URL matches your domain
   - Check NEXTAUTH_SECRET is set
   - Ensure callback URLs are configured

4. **API Timeouts**
   - AI chat responses may be slow
   - Function timeout is set to 30s in vercel.json
   - Consider implementing streaming responses

## Domain Setup (Optional)

### Custom Domain:
1. Go to project dashboard
2. Click "Domains" tab
3. Add your custom domain
4. Update DNS records as instructed
5. Update NEXTAUTH_URL environment variable

## Security Considerations

- [ ] HTTPS is enforced (automatic with Vercel)
- [ ] Environment variables are secure
- [ ] Database connection is encrypted
- [ ] API keys are not exposed in client code
- [ ] CORS is properly configured
- [ ] Rate limiting is implemented (TODO for future)

## Cost Monitoring

### Vercel Costs:
- Hobby plan: Free for personal projects
- Pro plan: $20/month for team features
- Function execution time and bandwidth usage

### Database Costs:
- PlanetScale: Free tier available
- Supabase: Free tier available  
- Railway: Usage-based pricing

### OpenAI Costs:
- GPT-3.5-turbo: ~$0.002 per 1K tokens
- Monitor usage in OpenAI dashboard
- Implement cost controls and limits

## Next Steps After Deployment

1. Set up monitoring and alerting
2. Implement automated backups
3. Add comprehensive error logging
4. Set up CI/CD pipeline
5. Add automated testing
6. Implement security headers
7. Add rate limiting
8. Set up uptime monitoring
