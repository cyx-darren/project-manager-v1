# Production Environment Variables Setup

This document provides a comprehensive guide for setting up environment variables for production deployment.

## 🚀 Quick Setup

1. Copy the environment template to create your production `.env` file
2. Fill in all required values
3. Verify configuration before deployment
4. Never commit `.env` files to version control

## 📋 Required Environment Variables

### 🔑 Supabase Configuration (REQUIRED)

```bash
# Your Supabase project URL
# Format: https://your-project-id.supabase.co
VITE_SUPABASE_URL=your_supabase_project_url_here

# Your Supabase anon/public key
# Get this from: Supabase Dashboard → Settings → API → Project API keys
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**How to get Supabase credentials:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your production project
3. Navigate to Settings → API
4. Copy the Project URL and anon/public key

### 🤖 Task Master AI Integration (OPTIONAL)

```bash
# Anthropic API key for AI-powered task management features
# Get this from: https://console.anthropic.com/
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 🌍 Application Configuration

```bash
# Application environment
NODE_ENV=production

# Application base URL (your production domain)
VITE_BASE_URL=https://your-domain.com

# Application branding
VITE_APP_NAME=Asana Clone
VITE_APP_VERSION=1.0.0

# CORS origins (comma-separated)
VITE_CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

### 🎯 Feature Flags

```bash
# Enable/disable features for production
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_TASK_AI=true
VITE_ENABLE_REAL_TIME=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_DARK_MODE=true
VITE_ENABLE_TEAM_FEATURES=true
```

## 📊 Optional Environment Variables

### 📈 Analytics & Monitoring

```bash
# Google Analytics tracking ID
VITE_GA_TRACKING_ID=your_google_analytics_id_here

# Sentry DSN for error tracking
VITE_SENTRY_DSN=your_sentry_dsn_here

# Mixpanel token for user analytics
VITE_MIXPANEL_TOKEN=your_mixpanel_token_here
```

### 📧 Email Configuration (if using custom email service)

```bash
# SMTP configuration
SMTP_HOST=your_smtp_host_here
SMTP_PORT=587
SMTP_USER=your_smtp_user_here
SMTP_PASS=your_smtp_password_here
SMTP_FROM=noreply@your-domain.com
```

### 🗄️ File Storage (if using external storage)

```bash
# AWS S3 configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name

# Cloudinary configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### ⚡ Performance & Caching

```bash
# Redis URL for caching
REDIS_URL=redis://localhost:6379

# Rate limiting configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🔒 Security Best Practices

### 1. Environment Variable Security
- Never commit `.env` files to version control
- Use different keys for development and production
- Rotate API keys regularly
- Use environment variable management services for production

### 2. Supabase Security
- Use Row Level Security (RLS) policies
- Restrict anon key permissions
- Enable email confirmation for production
- Set up proper CORS origins

### 3. API Key Management
- Store sensitive keys in secure environment variable services
- Use least-privilege principle for service accounts
- Monitor API key usage and set up alerts
- Implement key rotation procedures

## 🚀 Deployment Platform Configuration

### Vercel Environment Variables
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable with appropriate environment scope:
   - Production
   - Preview (optional)
   - Development (optional)

### Netlify Environment Variables
1. Go to your Netlify site dashboard
2. Navigate to Site settings → Environment variables
3. Add each variable for production deployment

### Docker Environment Variables
```dockerfile
# Use build args for non-sensitive variables
ARG VITE_SUPABASE_URL
ARG VITE_APP_NAME

# Use runtime environment for sensitive variables
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
ENV ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
```

## ✅ Environment Validation

Create this validation script to verify your environment setup:

```bash
#!/bin/bash
# validate-env.sh

echo "🔍 Validating environment variables..."

# Check required variables
required_vars=(
  "VITE_SUPABASE_URL"
  "VITE_SUPABASE_ANON_KEY"
  "NODE_ENV"
  "VITE_BASE_URL"
)

missing_vars=()

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    missing_vars+=("$var")
  fi
done

if [ ${#missing_vars[@]} -eq 0 ]; then
  echo "✅ All required environment variables are set!"
else
  echo "❌ Missing required environment variables:"
  printf '   - %s\n' "${missing_vars[@]}"
  exit 1
fi

echo "🔍 Checking Supabase connection..."
# Add Supabase connection test here if needed

echo "✅ Environment validation complete!"
```

## 🔄 Environment Templates

Copy these templates for different environments:

### Production (.env.production)
```bash
NODE_ENV=production
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
VITE_BASE_URL=https://your-domain.com
VITE_ENABLE_ANALYTICS=true
```

### Staging (.env.staging)
```bash
NODE_ENV=staging
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_staging_anon_key
VITE_BASE_URL=https://staging.your-domain.com
VITE_ENABLE_ANALYTICS=false
```

### Development (.env.development)
```bash
NODE_ENV=development
VITE_SUPABASE_URL=https://your-dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_development_anon_key
VITE_BASE_URL=http://localhost:5173
VITE_ENABLE_ANALYTICS=false
```

## 🛠️ Troubleshooting

### Common Issues

1. **Environment variables not loading**
   - Ensure variables start with `VITE_` for client-side access
   - Restart development server after adding variables
   - Check file permissions on `.env` file

2. **Supabase connection fails**
   - Verify URL format includes `https://`
   - Check anon key is for the correct project
   - Ensure CORS origins are configured in Supabase

3. **Build failures**
   - Verify all required variables are available at build time
   - Check for typos in variable names
   - Ensure proper escaping of special characters

### Debug Commands

```bash
# Check if environment variables are loaded
npm run dev -- --debug

# Validate environment in build
npm run build -- --mode production

# Test Supabase connection
npm run test:connection
```

## 📚 Related Documentation

- [Supabase Environment Setup](database-setup-instructions.md)
- [Deployment Guide](../README.md#deployment)
- [Security Audit Documentation](security-audit.md) 