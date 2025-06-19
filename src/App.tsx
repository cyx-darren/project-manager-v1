// Import Supabase connection test (runs automatically in development)
import './utils/supabaseTest.js';
// Import comprehensive health check
import { logHealthCheck } from './utils/appHealthCheck';

// Run health check in development mode
if (import.meta.env.DEV) {
  logHealthCheck();
}
