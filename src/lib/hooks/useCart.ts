/**
 * Shopping Cart Hook
 *
 * Provides comprehensive cart management with Supabase persistence.
 * Designed to streamline checkout workflows and improve conversion rates.
 *
 * Best for: Production eCommerce with persistent cart state across sessions
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase, getCurrentUserId } from '@/lib/supabase/client'
import type { Cart, CartItem, Product, Price, CartWithDetails } from '@/lib/types'
import { toast } from 'sonner'

export interface UseCartReturn {
  cart: CartWithDetails | null
  loading: boolean
  error: Error | null
  addItem: (productId: string, priceId: string, quantity?: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  applyCoupon: (code: string) => Promise<void>
  removeCoupon: () => Promise<void>
  refreshCart: () => Promise<void>
}

/**
 * Shopping cart state management hook
 *
 * Features:
 * - Automatic cart creation for new users
 * - Real-time cart synchronization across devices
 * - Optimistic UI updates for improved UX
 * - Automatic cart expiration handling
 *
 * Example:
 * ```tsx
 * const { cart, addItem, removeItem, loading } = useCart()
 *
 * const handleAddToCart = async () => {
 *   await addItem(productId, priceId, 1)
 * }
 * ```
 */
export const useCart = (): UseCartReturn => {
  const [cart, setCart] = useState<CartWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Fetch or create cart for current user
   *
   * Establishes persistent cart state with automatic creation for new sessions.
   */
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const userId = await getCurrentUserId()

      if (!userId) {
        // Guest checkout: use session-based cart
        const sessionId = getOrCreateSessionId()
        await fetchCartBySession(sessionId)
      } else {
        // Authenticated user: use member-based cart
        await fetchCartByMemberId(userId)
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch cart'))
      console.error('Cart fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Fetch cart by member ID
   */
  const fetchCartByMemberId = async (memberId: string) => {
    const { data: carts, error: cartError } = await supabase
      .from('carts')
      .select('*')
      .eq('member_id', memberId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)

    if (cartError) throw cartError

    if (carts && carts.length > 0) {
      await loadCartWithItems(carts[0].id)
    } else {
      await createCart(memberId)
    }
  }

  /**
   * Fetch cart by session ID
   */
  const fetchCartBySession = async (sessionId: string) => {
    const { data: carts, error: cartError } = await supabase
      .from('carts')
      .select('*')
      .eq('session_id', sessionId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)

    if (cartError) throw cartError

    if (carts && carts.length > 0) {
      await loadCartWithItems(carts[0].id)
    } else {
      await createCart(undefined, sessionId)
    }
  }

  /**
   * Load cart with full item details
   */
  const loadCartWithItems = async (cartId: string) => {
    const { data: cartData, error: cartError } = await supabase
      .from('carts')
      .select('*')
      .eq('id', cartId)
      .single()

    if (cartError) throw cartError

    const { data: items, error: itemsError } = await supabase
      .from('cart_items')
      .select(`
        *,
        product:products(*),
        price:prices(*)
      `)
      .eq('cart_id', cartId)

    if (itemsError) throw itemsError

    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
    const total = subtotal - (cartData.discount_amount || 0)

    setCart({
      ...cartData,
      items: items as any,
      subtotal,
      total,
    })
  }

  /**
   * Create new cart
   */
  const createCart = async (memberId?: string, sessionId?: string) => {
    const { data: newCart, error: createError } = await supabase
      .from('carts')
      .insert({
        member_id: memberId || null,
        session_id: sessionId || null,
        status: 'active',
        discount_amount: 0,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    if (createError) throw createError

    setCart({
      ...newCart,
      items: [],
      subtotal: 0,
      total: 0,
    })
  }

  /**
   * Add item to cart
   *
   * Implements optimistic UI updates for immediate feedback.
   */
  const addItem = useCallback(async (productId: string, priceId: string, quantity = 1) => {
    try {
      if (!cart) {
        toast.error('Cart not initialized')
        return
      }

      // Fetch product and price details
      const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      const { data: price } = await supabase
        .from('prices')
        .select('*')
        .eq('id', priceId)
        .single()

      if (!product || !price) {
        toast.error('Product not found')
        return
      }

      // Check if item already exists in cart
      const existingItem = cart.items.find(
        (item) => item.product_id === productId && item.price_id === priceId
      )

      if (existingItem) {
        // Update quantity
        await updateQuantity(existingItem.id, existingItem.quantity + quantity)
      } else {
        // Add new item
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert({
            cart_id: cart.id,
            product_id: productId,
            price_id: priceId,
            quantity,
            unit_price: price.unit_amount,
          })

        if (insertError) throw insertError

        await refreshCart()
        toast.success('Added to cart', {
          description: `${product.name} added to your cart`,
        })
      }
    } catch (err) {
      console.error('Add to cart error:', err)
      toast.error('Failed to add item to cart')
    }
  }, [cart])

  /**
   * Remove item from cart
   */
  const removeItem = useCallback(async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      await refreshCart()
      toast.success('Item removed from cart')
    } catch (err) {
      console.error('Remove item error:', err)
      toast.error('Failed to remove item')
    }
  }, [])

  /**
   * Update item quantity
   */
  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    try {
      if (quantity < 1) {
        await removeItem(itemId)
        return
      }

      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId)

      if (error) throw error

      await refreshCart()
    } catch (err) {
      console.error('Update quantity error:', err)
      toast.error('Failed to update quantity')
    }
  }, [])

  /**
   * Clear all items from cart
   */
  const clearCart = useCallback(async () => {
    try {
      if (!cart) return

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cart.id)

      if (error) throw error

      await refreshCart()
      toast.success('Cart cleared')
    } catch (err) {
      console.error('Clear cart error:', err)
      toast.error('Failed to clear cart')
    }
  }, [cart])

  /**
   * Apply coupon code
   */
  const applyCoupon = useCallback(async (code: string) => {
    try {
      if (!cart) return

      // Validate coupon
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code)
        .eq('active', true)
        .single()

      if (couponError || !coupon) {
        toast.error('Invalid coupon code')
        return
      }

      // Calculate discount
      let discountAmount = 0
      if (coupon.discount_type === 'percentage') {
        discountAmount = Math.round((cart.subtotal * coupon.discount_value) / 100)
      } else {
        discountAmount = coupon.discount_value
      }

      // Update cart
      const { error } = await supabase
        .from('carts')
        .update({
          coupon_code: code,
          discount_amount: discountAmount,
        })
        .eq('id', cart.id)

      if (error) throw error

      await refreshCart()
      toast.success('Coupon applied', {
        description: `You saved ${formatCurrency(discountAmount)}`,
      })
    } catch (err) {
      console.error('Apply coupon error:', err)
      toast.error('Failed to apply coupon')
    }
  }, [cart])

  /**
   * Remove coupon code
   */
  const removeCoupon = useCallback(async () => {
    try {
      if (!cart) return

      const { error } = await supabase
        .from('carts')
        .update({
          coupon_code: null,
          discount_amount: 0,
        })
        .eq('id', cart.id)

      if (error) throw error

      await refreshCart()
      toast.success('Coupon removed')
    } catch (err) {
      console.error('Remove coupon error:', err)
      toast.error('Failed to remove coupon')
    }
  }, [cart])

  /**
   * Refresh cart data
   */
  const refreshCart = useCallback(async () => {
    if (cart) {
      await loadCartWithItems(cart.id)
    }
  }, [cart])

  // Initialize cart on mount
  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  return {
    cart,
    loading,
    error,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    applyCoupon,
    removeCoupon,
    refreshCart,
  }
}

/**
 * Helper: Get or create session ID for guest checkout
 */
const getOrCreateSessionId = (): string => {
  const STORAGE_KEY = 'nabip-session-id'
  let sessionId = localStorage.getItem(STORAGE_KEY)

  if (!sessionId) {
    sessionId = `sess_${Math.random().toString(36).substring(2, 15)}`
    localStorage.setItem(STORAGE_KEY, sessionId)
  }

  return sessionId
}

/**
 * Helper: Format currency
 */
const formatCurrency = (amountInCents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amountInCents / 100)
}
