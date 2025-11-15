/**
 * Supabase Client Configuration
 *
 * Establishes secure connection to Supabase backend for scalable data operations.
 * Designed for organizations transitioning from client-side (useKV) to database-backed architecture.
 *
 * Best for: Production deployments requiring multi-tenant security and real-time data sync
 */

import { createClient } from '@supabase/supabase-js'

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
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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

/**
 * Database Tables Type Reference
 *
 * Provides type-safe access to Supabase tables for streamlined development.
 * Auto-generated from database schema for consistency across teams.
 */
export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string | null
          tags: string[] | null
          stripe_product_id: string | null
          active: boolean
          featured: boolean
          track_inventory: boolean
          inventory_quantity: number
          low_stock_threshold: number | null
          allow_backorder: boolean
          is_digital: boolean
          download_url: string | null
          access_duration_days: number | null
          image_url: string | null
          thumbnail_url: string | null
          gallery_urls: string[] | null
          slug: string | null
          meta_title: string | null
          meta_description: string | null
          metadata: Record<string, any> | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      prices: {
        Row: {
          id: string
          product_id: string
          stripe_price_id: string | null
          unit_amount: number
          currency: string
          type: 'one_time' | 'recurring'
          billing_interval: 'day' | 'week' | 'month' | 'year' | null
          billing_interval_count: number | null
          trial_period_days: number | null
          member_tier: string | null
          is_member_only: boolean
          active: boolean
          nickname: string | null
          description: string | null
          compare_at_price: number | null
          metadata: Record<string, any> | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['prices']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['prices']['Insert']>
      }
      carts: {
        Row: {
          id: string
          member_id: string | null
          session_id: string | null
          status: 'active' | 'abandoned' | 'converted' | 'expired'
          coupon_code: string | null
          discount_amount: number
          expires_at: string
          converted_to_order_id: string | null
          metadata: Record<string, any> | null
          created_at: string
          updated_at: string
          last_activity_at: string
        }
        Insert: Omit<Database['public']['Tables']['carts']['Row'], 'id' | 'created_at' | 'updated_at' | 'last_activity_at'>
        Update: Partial<Database['public']['Tables']['carts']['Insert']>
      }
      cart_items: {
        Row: {
          id: string
          cart_id: string
          product_id: string
          price_id: string
          quantity: number
          unit_price: number
          custom_options: Record<string, any> | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['cart_items']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['cart_items']['Insert']>
      }
      orders: {
        Row: {
          id: string
          order_number: string
          member_id: string | null
          email: string
          subtotal: number
          discount_amount: number
          tax_amount: number
          shipping_amount: number
          total_amount: number
          currency: string
          status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded' | 'partially_refunded'
          payment_status: 'unpaid' | 'authorized' | 'paid' | 'partially_refunded' | 'refunded' | 'failed'
          payment_method: string | null
          stripe_payment_intent_id: string | null
          stripe_checkout_session_id: string | null
          shipping_address: Record<string, any> | null
          billing_address: Record<string, any> | null
          shipping_method: string | null
          tracking_number: string | null
          shipped_at: string | null
          delivered_at: string | null
          coupon_code: string | null
          confirmation_sent_at: string | null
          fulfillment_email_sent_at: string | null
          refunded_amount: number
          refunded_at: string | null
          refund_reason: string | null
          customer_notes: string | null
          internal_notes: string | null
          metadata: Record<string, any> | null
          created_at: string
          updated_at: string
          completed_at: string | null
          cancelled_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'order_number' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
      }
      subscriptions: {
        Row: {
          id: string
          member_id: string
          product_id: string
          price_id: string
          status: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'unpaid' | 'incomplete' | 'incomplete_expired'
          stripe_subscription_id: string | null
          stripe_customer_id: string | null
          current_period_start: string | null
          current_period_end: string | null
          trial_start: string | null
          trial_end: string | null
          cancel_at: string | null
          cancel_at_period_end: boolean
          cancelled_at: string | null
          cancellation_reason: string | null
          billing_interval: 'day' | 'week' | 'month' | 'year'
          billing_interval_count: number
          unit_amount: number
          currency: string
          latest_invoice_id: string | null
          metadata: Record<string, any> | null
          created_at: string
          updated_at: string
          started_at: string
        }
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>
      }
    }
  }
}

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
