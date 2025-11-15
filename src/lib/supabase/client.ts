/**
 * Supabase Client Configuration
 *
 * Establishes secure connection to Supabase backend for scalable data operations.
 * Designed for organizations transitioning from client-side (useKV) to database-backed architecture.
 *
 * Best for: Production deployments requiring multi-tenant security and real-time data sync
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Environment variables configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment variables.'
  )
}

/**
 * Supabase client instance with automatic session management
 *
 * Features:
 * - Automatic JWT refresh for persistent authentication
 * - Row Level Security (RLS) enforcement for multi-tenant data isolation
 * - Real-time subscriptions for collaborative workflows
 * - Optimistic caching for improved performance
 * - Type-safe database operations with generated TypeScript types
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-client-info': 'nabip-ams-alpha@1.0.0',
    },
  },
})

// Re-export Database type for convenience
export type { Database } from './database.types'

/**
 * Helper function to check if user is authenticated
 *
 * Best for: Conditional rendering of authenticated features
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession()
  return !!session
}

/**
 * Helper function to get current user ID
 *
 * Best for: Associating data with current user in database operations
 */
export const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user?.id || null
}

/**
 * Helper function to format currency amounts
 *
 * Converts cents to dollar display format for consistent UX.
 *
 * Example: formatCurrency(4999) => "$49.99"
 */
export const formatCurrency = (amountInCents: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amountInCents / 100)
}

/**
 * Helper function to calculate cart totals
 *
 * Streamlines checkout calculations for accurate pricing display.
 */
export const calculateCartTotals = (items: { quantity: number; unitPrice: number }[]) => {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  return {
    subtotal,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  }
}
