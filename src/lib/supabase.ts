/**
 * Supabase Client Re-export for Microservices
 *
 * Provides a consistent import path for all OSA services to access the Supabase client.
 * Re-exports the existing supabase client and admin utilities.
 */

// Re-export the existing Supabase client and utilities
export {
  supabase,
  createSupabaseAdmin,
  handleDatabaseError,
  checkDatabaseConnection
} from '@/lib/database/supabase-client';

// Additional exports for microservices architecture
export { createClient } from '@supabase/supabase-js';
export type { Database } from '@/lib/types/database';