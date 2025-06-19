import { testSupabaseConnection } from '../config/supabase';

interface HealthCheckResult {
  component: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  timestamp: Date;
}

export const runAppHealthCheck = async (): Promise<HealthCheckResult[]> => {
  const results: HealthCheckResult[] = [];

  // Check environment variables
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      results.push({
        component: 'Environment Variables',
        status: 'error',
        message: 'Missing required Supabase environment variables',
        timestamp: new Date()
      });
    } else {
      results.push({
        component: 'Environment Variables',
        status: 'healthy',
        message: 'All required environment variables are present',
        timestamp: new Date()
      });
    }
  } catch (error) {
    results.push({
      component: 'Environment Variables',
      status: 'error',
      message: `Environment check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date()
    });
  }

  // Check Supabase connection
  try {
    const supabaseResult = await testSupabaseConnection();
    results.push({
      component: 'Supabase Connection',
      status: supabaseResult.success ? 'healthy' : 'warning',
      message: supabaseResult.message,
      timestamp: new Date()
    });
  } catch (error) {
    results.push({
      component: 'Supabase Connection',
      status: 'error',
      message: `Supabase connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date()
    });
  }

  // Check local storage availability
  try {
    const testKey = 'health-check-test';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    results.push({
      component: 'Local Storage',
      status: 'healthy',
      message: 'Local storage is available and working',
      timestamp: new Date()
    });
  } catch (error) {
    results.push({
      component: 'Local Storage',
      status: 'warning',
      message: 'Local storage is not available (private browsing mode?)',
      timestamp: new Date()
    });
  }

  // Check if running in development mode
  results.push({
    component: 'Environment Mode',
    status: 'healthy',
    message: `Running in ${import.meta.env.DEV ? 'development' : 'production'} mode`,
    timestamp: new Date()
  });

  return results;
};

export const logHealthCheck = async (): Promise<void> => {
  console.log('🔍 Running application health check...');
  const results = await runAppHealthCheck();
  
  results.forEach(result => {
    const emoji = result.status === 'healthy' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
    console.log(`${emoji} ${result.component}: ${result.message}`);
  });
  
  const hasErrors = results.some(r => r.status === 'error');
  const hasWarnings = results.some(r => r.status === 'warning');
  
  if (hasErrors) {
    console.error('❌ Health check completed with errors. Some features may not work properly.');
  } else if (hasWarnings) {
    console.warn('⚠️ Health check completed with warnings. Most features should work normally.');
  } else {
    console.log('✅ Health check passed! All systems are operational.');
  }
}; 