/**
 * Stripe Checkout Hook
 *
 * Streamlines payment processing with Stripe Checkout Sessions.
 * Designed to minimize cart abandonment through seamless checkout UX.
 *
 * Best for: Production-ready checkout with PCI compliance and fraud protection
 */

import { useState, useCallback } from 'react'
import { getStripe } from '@/lib/stripe/client'
import { supabase, getCurrentUserId } from '@/lib/supabase/client'
import type { CartWithDetails } from '@/lib/types'
import { toast } from 'sonner'

export interface UseCheckoutReturn {
  loading: boolean
  error: Error | null
  initiateCheckout: (cart: CartWithDetails, successUrl: string, cancelUrl: string) => Promise<void>
}

/**
 * Checkout session management hook
 *
 * Features:
 * - Stripe Checkout Session creation
 * - Automatic cart-to-order conversion
 * - Success/cancel URL routing
 * - Error handling with user feedback
 *
 * Example:
 * ```tsx
 * const { initiateCheckout, loading } = useCheckout()
 *
 * const handleCheckout = async () => {
 *   await initiateCheckout(
 *     cart,
 *     `${window.location.origin}/checkout/success`,
 *     `${window.location.origin}/checkout/cancel`
 *   )
 * }
 * ```
 */
export const useCheckout = (): UseCheckoutReturn => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Initiate Stripe Checkout flow
   *
   * Establishes secure payment session and redirects to Stripe-hosted checkout.
   */
  const initiateCheckout = useCallback(async (
    cart: CartWithDetails,
    successUrl: string,
    cancelUrl: string
  ) => {
    try {
      setLoading(true)
      setError(null)

      if (!cart || !cart.items || cart.items.length === 0) {
        toast.error('Your cart is empty')
        return
      }

      // Get Stripe instance
      const stripe = await getStripe()
      if (!stripe) {
        throw new Error('Stripe not initialized')
      }

      // Get current user email
      const userId = await getCurrentUserId()
      const { data: member } = userId
        ? await supabase
            .from('members')
            .select('email')
            .eq('id', userId)
            .single()
        : { data: null }

      // Create checkout session via Edge Function
      const { data: session, error: sessionError } = await supabase.functions.invoke(
        'create-checkout-session',
        {
          body: {
            cartId: cart.id,
            successUrl,
            cancelUrl,
            customerEmail: member?.email,
            metadata: {
              cartId: cart.id,
              memberId: userId || '',
            },
          },
        }
      )

      if (sessionError) throw sessionError

      if (!session || !session.sessionId) {
        throw new Error('Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      const { error: redirectError } = await stripe.redirectToCheckout({
        sessionId: session.sessionId,
      })

      if (redirectError) throw redirectError
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Checkout failed'
      setError(err instanceof Error ? err : new Error(errorMessage))
      console.error('Checkout error:', err)
      toast.error('Checkout failed', {
        description: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    initiateCheckout,
  }
}

/**
 * Handle successful checkout
 *
 * Processes post-checkout actions after Stripe redirects back to success URL.
 * Best for: Order confirmation pages
 */
export const useCheckoutSuccess = () => {
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const processCheckoutSuccess = useCallback(async (sessionId: string) => {
    try {
      setLoading(true)

      // Retrieve session details from Stripe
      const { data, error } = await supabase.functions.invoke('verify-checkout-session', {
        body: { sessionId },
      })

      if (error) throw error

      // Fetch order details
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(
            *,
            product:products(*)
          )
        `)
        .eq('stripe_checkout_session_id', sessionId)
        .single()

      if (orderError) throw orderError

      setOrder(orderData)
      toast.success('Order confirmed!', {
        description: `Order #${orderData.order_number} has been placed successfully.`,
      })
    } catch (err) {
      console.error('Checkout success processing error:', err)
      toast.error('Failed to retrieve order details')
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    order,
    loading,
    processCheckoutSuccess,
  }
}
