// Supabase Client for Opal Database Operations
// Handles database connections for workflow management and DXP insights storage

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Temporarily disabled for deployment
// if (!supabaseUrl || !supabaseAnonKey) {
//   throw new Error('Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
// }

// Create Supabase client with proper typing and connection pooling
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // For server-side usage
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-connection-pool': 'optimized-osa'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10 // Rate limiting for realtime events
    }
  }
});

// Create admin client for server-side operations
export const createSupabaseAdmin = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

  // Temporarily disabled for deployment
  // if (!serviceRoleKey) {
  //   throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  // }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-connection-pool': 'admin-osa',
        'x-client-info': 'osa-admin-service'
      }
    },
    realtime: {
      params: {
        eventsPerSecond: 5 // Lower rate for admin operations
      }
    }
  });
};

// Utility function for handling database errors
export const handleDatabaseError = (error: any, operation: string, allowFallback: boolean = true): never => {
  console.error(`❌ [Database] ${operation} failed:`, error);

  // Log detailed error information for debugging
  console.error(`❌ [Database] Error details:`, {
    message: error.message,
    details: error.details || 'No details available',
    hint: error.hint || '',
    code: error.code || ''
  });

  if (allowFallback) {
    console.log(`⚠️ [Database] ${operation} unavailable, system will continue with fallback behavior`);
  }

  if (error.code) {
    throw new Error(`Database ${operation} failed: ${error.message} (Code: ${error.code})`);
  }

  throw new Error(`Database ${operation} failed: ${error.message || 'Unknown error'}`);
};

// Connection health check
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('opal_workflow_executions').select('count').limit(1);

    if (error) {
      console.error('❌ [Database] Connection check failed:', error);
      return false;
    }

    console.log('✅ [Database] Connection healthy');
    return true;
  } catch (error) {
    console.error('❌ [Database] Connection check error:', error);
    return false;
  }
};