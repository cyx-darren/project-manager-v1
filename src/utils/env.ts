/**
 * Environment Variables Utility
 * 
 * This module provides utilities for validating and accessing environment variables
 * in a type-safe manner. It includes runtime validation for production deployments.
 */

// =============================================================================
// Types
// =============================================================================

export interface EnvConfig {
  // Required Supabase configuration
  supabaseUrl: string;
  supabaseAnonKey: string;
  
  // Application configuration
  nodeEnv: 'development' | 'staging' | 'production';
  baseUrl: string;
  
  // Optional configuration
  appName?: string;
  appVersion?: string;
  enableAnalytics?: boolean;
  enableRealTime?: boolean;
}

export interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config?: EnvConfig;
}

// =============================================================================
// Environment Variable Names
// =============================================================================

export const ENV_VARS = {
  // Required variables
  SUPABASE_URL: 'VITE_SUPABASE_URL',
  SUPABASE_ANON_KEY: 'VITE_SUPABASE_ANON_KEY',
  NODE_ENV: 'NODE_ENV',
  BASE_URL: 'VITE_BASE_URL',
  
  // Optional variables
  APP_NAME: 'VITE_APP_NAME',
  APP_VERSION: 'VITE_APP_VERSION',
  ENABLE_ANALYTICS: 'VITE_ENABLE_ANALYTICS',
  ENABLE_REAL_TIME: 'VITE_ENABLE_REAL_TIME',
} as const;

// =============================================================================
// Validation Functions
// =============================================================================

/**
 * Validates that a URL is a valid Supabase URL format
 */
function validateSupabaseUrl(url: string): boolean {
  return /^https:\/\/.*\.supabase\.co$/.test(url);
}

/**
 * Validates that a string looks like a valid Supabase anon key
 */
function validateSupabaseAnonKey(key: string): boolean {
  return key.length >= 100; // Supabase anon keys are typically very long
}

/**
 * Validates that a URL is properly formatted
 */
function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if a value contains development-like patterns
 */
function containsDevPatterns(value: string): boolean {
  const devPatterns = [
    'localhost',
    '127.0.0.1',
    'test',
    'example',
    'your_',
    'your-',
    'demo',
    'staging'
  ];
  
  return devPatterns.some(pattern => 
    value.toLowerCase().includes(pattern.toLowerCase())
  );
}

// =============================================================================
// Main Validation Function
// =============================================================================

/**
 * Validates all environment variables and returns a detailed result
 */
export function validateEnv(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Get environment variables
  const supabaseUrl = import.meta.env[ENV_VARS.SUPABASE_URL];
  const supabaseAnonKey = import.meta.env[ENV_VARS.SUPABASE_ANON_KEY];
  const nodeEnv = import.meta.env[ENV_VARS.NODE_ENV] || 'development';
  const baseUrl = import.meta.env[ENV_VARS.BASE_URL];
  
  // Optional variables
  const appName = import.meta.env[ENV_VARS.APP_NAME];
  const appVersion = import.meta.env[ENV_VARS.APP_VERSION];
  const enableAnalytics = import.meta.env[ENV_VARS.ENABLE_ANALYTICS] === 'true';
  const enableRealTime = import.meta.env[ENV_VARS.ENABLE_REAL_TIME] !== 'false'; // Default to true
  
  // Validate required variables
  if (!supabaseUrl) {
    errors.push(`Missing required environment variable: ${ENV_VARS.SUPABASE_URL}`);
  } else if (!validateSupabaseUrl(supabaseUrl)) {
    errors.push(`Invalid Supabase URL format. Expected: https://your-project.supabase.co`);
  }
  
  if (!supabaseAnonKey) {
    errors.push(`Missing required environment variable: ${ENV_VARS.SUPABASE_ANON_KEY}`);
  } else if (!validateSupabaseAnonKey(supabaseAnonKey)) {
    errors.push(`Invalid Supabase anon key format. Key appears to be too short.`);
  }
  
  if (!baseUrl) {
    errors.push(`Missing required environment variable: ${ENV_VARS.BASE_URL}`);
  } else if (!validateUrl(baseUrl)) {
    errors.push(`Invalid base URL format. Expected: https://your-domain.com`);
  }
  
  if (!['development', 'staging', 'production'].includes(nodeEnv)) {
    errors.push(`Invalid NODE_ENV value: ${nodeEnv}. Expected: development, staging, or production`);
  }
  
  // Production-specific checks
  if (nodeEnv === 'production') {
    // Check for development patterns in production
    const prodVars = [
      { name: 'SUPABASE_URL', value: supabaseUrl },
      { name: 'BASE_URL', value: baseUrl },
      { name: 'APP_NAME', value: appName }
    ];
    
    prodVars.forEach(({ name, value }) => {
      if (value && containsDevPatterns(value)) {
        warnings.push(`${name} contains development-like patterns in production: ${value}`);
      }
    });
    
    // Check for missing recommended production variables
    if (!appName) {
      warnings.push(`Missing recommended production variable: ${ENV_VARS.APP_NAME}`);
    }
    
    if (!appVersion) {
      warnings.push(`Missing recommended production variable: ${ENV_VARS.APP_VERSION}`);
    }
  }
  
  // Create config object if validation passes
  let config: EnvConfig | undefined;
  
  if (errors.length === 0) {
    config = {
      supabaseUrl,
      supabaseAnonKey,
      nodeEnv: nodeEnv as 'development' | 'staging' | 'production',
      baseUrl,
      appName,
      appVersion,
      enableAnalytics,
      enableRealTime,
    };
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config,
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Gets the current environment configuration
 * Throws an error if environment is invalid
 */
export function getEnvConfig(): EnvConfig {
  const result = validateEnv();
  
  if (!result.isValid) {
    throw new Error(
      `Invalid environment configuration:\n${result.errors.join('\n')}`
    );
  }
  
  return result.config!;
}

/**
 * Checks if the current environment is production
 */
export function isProduction(): boolean {
  return import.meta.env.NODE_ENV === 'production';
}

/**
 * Checks if the current environment is development
 */
export function isDevelopment(): boolean {
  return import.meta.env.NODE_ENV === 'development';
}

/**
 * Gets a safe environment value with a fallback
 */
export function getEnvVar(name: string, fallback?: string): string {
  const value = import.meta.env[name];
  if (value !== undefined) {
    return value;
  }
  
  if (fallback !== undefined) {
    return fallback;
  }
  
  throw new Error(`Missing required environment variable: ${name}`);
}

/**
 * Gets an optional environment value as boolean
 */
export function getEnvBoolean(name: string, defaultValue = false): boolean {
  const value = import.meta.env[name];
  if (value === undefined) {
    return defaultValue;
  }
  
  return value === 'true' || value === '1';
}

// =============================================================================
// Development Helper
// =============================================================================

/**
 * Logs environment validation results to console (development only)
 */
export function logEnvValidation(): void {
  if (!isDevelopment()) {
    return;
  }
  
  const result = validateEnv();
  
  console.group('🔍 Environment Configuration');
  
  if (result.isValid) {
    console.log('✅ Environment validation passed');
    
    if (result.warnings.length > 0) {
      console.warn('⚠️ Warnings:');
      result.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
    
    console.log('📊 Configuration:', result.config);
  } else {
    console.error('❌ Environment validation failed');
    console.error('🔥 Errors:');
    result.errors.forEach(error => console.error(`  - ${error}`));
    
    if (result.warnings.length > 0) {
      console.warn('⚠️ Warnings:');
      result.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
  }
  
  console.groupEnd();
}

// =============================================================================
// Auto-validation (Development Only)
// =============================================================================

// Automatically validate environment in development
if (isDevelopment()) {
  logEnvValidation();
} 