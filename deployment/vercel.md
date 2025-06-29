# Vercel Deployment Guide

This guide covers deploying the Asana Clone application to Vercel with proper environment variable configuration.

## 🚀 Quick Deployment

### 1. Prerequisites
- Vercel account ([Sign up](https://vercel.com/signup))
- GitHub repository with your code
- Production Supabase project

### 2. Connect Repository
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project settings

### 3. Environment Variables Setup

Go to your Vercel project → Settings → Environment Variables

#### Required Variables (Production)
```bash
NODE_ENV=production
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
VITE_BASE_URL=https://your-project.vercel.app
```

#### Recommended Variables
```bash
VITE_APP_NAME=Asana Clone
VITE_APP_VERSION=1.0.0
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_REAL_TIME=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_DARK_MODE=true
VITE_ENABLE_TEAM_FEATURES=true
```

#### Optional Analytics (if using)
```bash
VITE_GA_TRACKING_ID=your_google_analytics_id
VITE_SENTRY_DSN=your_sentry_dsn
VITE_MIXPANEL_TOKEN=your_mixpanel_token
```

### 4. Build Configuration

Create/update `vercel.json` in your project root:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite",
  "functions": {
    "app/api/**/*.ts": {
      "runtime": "nodejs18.x"
    }
  },
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ]
}
```

## 🔒 Security Configuration

### 1. Domain Configuration
After deployment, update your Supabase project:

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel domain to "Site URL": `https://your-project.vercel.app`
3. Add to "Redirect URLs": `https://your-project.vercel.app/**`

### 2. CORS Configuration
In Supabase Dashboard → Settings → API:
- Add your Vercel domain to allowed origins
- Enable credentials if needed

## 🌐 Custom Domain Setup

### 1. Add Custom Domain
1. In Vercel project → Settings → Domains
2. Add your custom domain (e.g., `yourapp.com`)
3. Configure DNS records as instructed

### 2. Update Environment Variables
After domain setup, update:
```bash
VITE_BASE_URL=https://yourapp.com
VITE_CORS_ORIGINS=https://yourapp.com,https://www.yourapp.com
```

### 3. Update Supabase URLs
Update Supabase authentication URLs to use your custom domain.

## 🔄 CI/CD Configuration

### 1. Automatic Deployments
Vercel automatically deploys on:
- Push to main branch (production)
- Pull requests (preview deployments)

### 2. Preview Deployments
For preview deployments, you can use different environment variables:
```bash
# Preview-specific (optional)
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_staging_anon_key
VITE_ENABLE_ANALYTICS=false
```

### 3. Build Hooks
Set up build hooks for:
- Manual deployments
- Integration with external services
- Scheduled rebuilds

## 📊 Environment Variables Management

### 1. Environment Scopes
Configure variables for different scopes:
- **Production**: Used for production deployments
- **Preview**: Used for PR previews
- **Development**: Used for Vercel dev command

### 2. Bulk Environment Variable Import
Use Vercel CLI to import from `.env` file:
```bash
npx vercel env pull .env.vercel
npx vercel env add < .env.production
```

### 3. Environment Variable Templates
Create templates for different environments:

#### `.env.vercel.production`
```bash
NODE_ENV=production
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=prod_anon_key_here
VITE_BASE_URL=https://yourapp.com
VITE_ENABLE_ANALYTICS=true
```

#### `.env.vercel.preview`
```bash
NODE_ENV=staging
VITE_SUPABASE_URL=https://staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=staging_anon_key_here
VITE_BASE_URL=https://preview-branch.vercel.app
VITE_ENABLE_ANALYTICS=false
```

## 🛠️ Deployment Commands

### Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Deploy preview
vercel

# Check deployment status
vercel ls
```

### Using GitHub Actions
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 🔍 Monitoring & Analytics

### 1. Vercel Analytics
Enable Vercel Analytics in your project settings for:
- Page views
- Performance metrics
- User insights

### 2. Function Logs
Monitor serverless function logs in Vercel Dashboard:
- Runtime logs
- Error tracking
- Performance metrics

### 3. Build Logs
Check build logs for:
- Build failures
- Performance issues
- Environment variable problems

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check build logs in Vercel Dashboard
   # Verify all environment variables are set
   # Check for missing dependencies
   ```

2. **Environment Variables Not Loading**
   ```bash
   # Ensure variables are prefixed with VITE_ for client-side
   # Check variable scope (Production/Preview/Development)
   # Redeploy after adding variables
   ```

3. **Supabase Connection Issues**
   ```bash
   # Verify Supabase URL format
   # Check CORS settings in Supabase
   # Validate anon key permissions
   ```

4. **404 Errors on Direct URLs**
   ```bash
   # Ensure vercel.json has proper rewrites
   # Check SPA routing configuration
   ```

### Debug Commands
```bash
# Check environment locally
npx vercel dev

# Pull production environment
npx vercel env pull

# Check build output
npx vercel build

# Validate deployment
curl -I https://your-project.vercel.app
```

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Supabase with Vercel](https://supabase.com/docs/guides/getting-started/tutorials/with-vercel)
- [Environment Variables Best Practices](../docs/production-env-setup.md) 