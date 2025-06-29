#!/bin/bash

# =============================================================================
# Environment Variables Validation Script
# =============================================================================
# This script validates that all required environment variables are set
# and properly formatted for production deployment.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
  echo -e "${2}${1}${NC}"
}

print_status "🔍 Validating Environment Variables for Production Deployment..." "$BLUE"
echo ""

# =============================================================================
# Check for .env file
# =============================================================================
if [ ! -f ".env" ]; then
  print_status "❌ No .env file found!" "$RED"
  print_status "   Please copy env.example to .env and fill in your values." "$YELLOW"
  exit 1
fi

print_status "✅ .env file found" "$GREEN"

# =============================================================================
# Load environment variables
# =============================================================================
if [ -f ".env" ]; then
  set -a
  source .env
  set +a
fi

# =============================================================================
# Required Variables
# =============================================================================
required_vars=(
  "VITE_SUPABASE_URL"
  "VITE_SUPABASE_ANON_KEY"
  "NODE_ENV"
  "VITE_BASE_URL"
)

missing_vars=()
invalid_vars=()

print_status "🔍 Checking Required Variables..." "$BLUE"

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    missing_vars+=("$var")
  else
    print_status "   ✅ $var: Set" "$GREEN"
    
    # Validate specific formats
    case $var in
      "VITE_SUPABASE_URL")
        if [[ ! "${!var}" =~ ^https://.*\.supabase\.co$ ]]; then
          invalid_vars+=("$var: Should be in format https://your-project.supabase.co")
        fi
        ;;
             "VITE_SUPABASE_ANON_KEY")
         var_value="${!var}"
         if [[ ${#var_value} -lt 100 ]]; then
           invalid_vars+=("$var: Appears to be too short for a valid Supabase anon key")
         fi
         ;;
      "NODE_ENV")
        if [[ ! "${!var}" =~ ^(development|staging|production)$ ]]; then
          invalid_vars+=("$var: Should be 'development', 'staging', or 'production'")
        fi
        ;;
      "VITE_BASE_URL")
        if [[ ! "${!var}" =~ ^https?:// ]]; then
          invalid_vars+=("$var: Should start with http:// or https://")
        fi
        ;;
    esac
  fi
done

echo ""

# =============================================================================
# Report Missing Variables
# =============================================================================
if [ ${#missing_vars[@]} -gt 0 ]; then
  print_status "❌ Missing Required Variables:" "$RED"
  for var in "${missing_vars[@]}"; do
    print_status "   - $var" "$RED"
  done
  echo ""
fi

# =============================================================================
# Report Invalid Variables
# =============================================================================
if [ ${#invalid_vars[@]} -gt 0 ]; then
  print_status "⚠️  Invalid Variable Formats:" "$YELLOW"
  for var in "${invalid_vars[@]}"; do
    print_status "   - $var" "$YELLOW"
  done
  echo ""
fi

# =============================================================================
# Check Optional but Recommended Variables
# =============================================================================
recommended_vars=(
  "VITE_APP_NAME"
  "VITE_APP_VERSION"
  "VITE_ENABLE_ANALYTICS"
  "VITE_ENABLE_REAL_TIME"
)

missing_recommended=()

for var in "${recommended_vars[@]}"; do
  if [ -z "${!var}" ]; then
    missing_recommended+=("$var")
  fi
done

if [ ${#missing_recommended[@]} -gt 0 ]; then
  print_status "ℹ️  Optional Recommended Variables (not set):" "$BLUE"
  for var in "${missing_recommended[@]}"; do
    print_status "   - $var" "$BLUE"
  done
  echo ""
fi

# =============================================================================
# Check for Development Values in Production
# =============================================================================
if [ "$NODE_ENV" = "production" ]; then
  print_status "🔍 Checking for Development Values in Production..." "$BLUE"
  
  dev_patterns=(
    "localhost"
    "127.0.0.1"
    "test"
    "example"
    "your_"
    "your-"
  )
  
  dev_issues=()
  
  for var in "${required_vars[@]}" "${recommended_vars[@]}"; do
    if [ ! -z "${!var}" ]; then
      for pattern in "${dev_patterns[@]}"; do
        if [[ "${!var}" == *"$pattern"* ]]; then
          dev_issues+=("$var contains '$pattern' - this may be a development value")
        fi
      done
    fi
  done
  
  if [ ${#dev_issues[@]} -gt 0 ]; then
    print_status "⚠️  Potential Development Values in Production:" "$YELLOW"
    for issue in "${dev_issues[@]}"; do
      print_status "   - $issue" "$YELLOW"
    done
    echo ""
  fi
fi

# =============================================================================
# Test Supabase Connection (if curl is available)
# =============================================================================
if command -v curl &> /dev/null; then
  print_status "🔍 Testing Supabase Connection..." "$BLUE"
  
  if [ ! -z "$VITE_SUPABASE_URL" ] && [ ! -z "$VITE_SUPABASE_ANON_KEY" ]; then
    # Test basic connectivity to Supabase
    response=$(curl -s -o /dev/null -w "%{http_code}" \
      -H "apikey: $VITE_SUPABASE_ANON_KEY" \
      -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" \
      "$VITE_SUPABASE_URL/rest/v1/" 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ]; then
      print_status "   ✅ Supabase connection successful" "$GREEN"
    else
      print_status "   ⚠️  Supabase connection test failed (HTTP $response)" "$YELLOW"
      print_status "   This may be due to CORS settings or invalid credentials" "$YELLOW"
    fi
  else
    print_status "   ⚠️  Cannot test Supabase connection - missing URL or key" "$YELLOW"
  fi
else
  print_status "   ℹ️  Skipping Supabase connection test (curl not available)" "$BLUE"
fi

echo ""

# =============================================================================
# Final Result
# =============================================================================
if [ ${#missing_vars[@]} -eq 0 ] && [ ${#invalid_vars[@]} -eq 0 ]; then
  print_status "🎉 Environment Validation Successful!" "$GREEN"
  print_status "   All required variables are set and properly formatted." "$GREEN"
  
  if [ ${#missing_recommended[@]} -gt 0 ] || [ ${#dev_issues[@]} -gt 0 ]; then
    print_status "   Note: There are some optional recommendations above." "$YELLOW"
  fi
  
  echo ""
  print_status "✅ Ready for deployment!" "$GREEN"
  exit 0
else
  print_status "❌ Environment Validation Failed!" "$RED"
  print_status "   Please fix the issues above before deploying." "$RED"
  echo ""
  print_status "📚 For help, see: docs/production-env-setup.md" "$BLUE"
  exit 1
fi 