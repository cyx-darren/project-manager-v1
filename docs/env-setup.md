# Environment Setup

This project requires environment variables to connect to Supabase and other services.

## Required Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Task Master AI (optional - only needed for task management features)
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

## Getting Supabase Credentials

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings → API
4. Copy the Project URL and anon/public key

## Verifying Setup

The application will automatically test the Supabase connection when running in development mode. Check the browser console for connection status messages.

## Security Notes

- Never commit `.env` files to version control
- The `.env` file is already included in `.gitignore`
- Use different keys for development and production environments 