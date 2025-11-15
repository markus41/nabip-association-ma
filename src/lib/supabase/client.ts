/**
 * Supabase Client Configuration (Demo Mode)
 *
 * This is a stub implementation for the demo. In production, this would establish
 * secure connection to Supabase backend for scalable data operations.
 *
 * Best for: Production deployments requiring multi-tenant security and real-time data sync
 */

import type { Database } from './database.types'

export const supabase = null as any

export type { Database } from './database.types'

export const isAuthenticated = async (): Promise<boolean> => {
  console.warn('Supabase is not configured in demo mode')
  return false
}

export const getCurrentUserId = async (): Promise<string | null> => {
  console.warn('Supabase is not configured in demo mode')
  return null
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
