/**
 * Stripe Checkout Session Creation Edge Function
 *
 * Establishes secure payment sessions for streamlined checkout workflows.
 * Designed to convert shopping carts into Stripe-hosted checkout experiences.
 *
 * Best for: Production eCommerce with PCI compliance and fraud protection
 *
 * Environment Variables Required:
 * - STRIPE_SECRET_KEY: Your Stripe secret API key
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.10.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    const {
      cartId,
      successUrl,
      cancelUrl,
      customerEmail,
      metadata = {},
    } = await req.json()

    if (!cartId || !successUrl || !cancelUrl) {
      throw new Error('Missing required parameters')
    }

    // Fetch cart with items
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select(`
        *,
        items:cart_items(
          *,
          product:products(*),
          price:prices(*)
        )
      `)
      .eq('id', cartId)
      .single()

    if (cartError || !cart) {
      throw new Error('Cart not found')
    }

    if (!cart.items || cart.items.length === 0) {
      throw new Error('Cart is empty')
    }

    // Build line items for Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = cart.items.map(
      (item: any) => ({
        price_data: {
          currency: item.price.currency || 'usd',
          product_data: {
            name: item.product.name,
            description: item.product.description || undefined,
            images: item.product.image_url ? [item.product.image_url] : undefined,
            metadata: {
              product_id: item.product.id,
            },
          },
          unit_amount: item.unit_price,
        },
        quantity: item.quantity,
      })
    )

    // Apply discounts if coupon is present
    const discounts: Stripe.Checkout.SessionCreateParams.Discount[] = []
    if (cart.coupon_code) {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('stripe_coupon_id')
        .eq('code', cart.coupon_code)
        .single()

      if (coupon && coupon.stripe_coupon_id) {
        discounts.push({
          coupon: coupon.stripe_coupon_id,
        })
      }
    }

    // Create Stripe customer if member exists
    let customerId: string | undefined
    if (cart.member_id) {
      const { data: stripeCustomer } = await supabase
        .from('stripe_customers')
        .select('stripe_customer_id')
        .eq('member_id', cart.member_id)
        .single()

      if (stripeCustomer) {
        customerId = stripeCustomer.stripe_customer_id
      } else {
        // Create new Stripe customer
        const customer = await stripe.customers.create({
          email: customerEmail,
          metadata: {
            member_id: cart.member_id,
          },
        })

        customerId = customer.id

        // Store customer mapping
        await supabase.from('stripe_customers').insert({
          member_id: cart.member_id,
          stripe_customer_id: customerId,
        })
      }
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      discounts: discounts.length > 0 ? discounts : undefined,
      customer: customerId,
      customer_email: !customerId && customerEmail ? customerEmail : undefined,
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        cart_id: cartId,
        member_id: cart.member_id || '',
        ...metadata,
      },
      payment_intent_data: {
        metadata: {
          cart_id: cartId,
          member_id: cart.member_id || '',
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      shipping_address_collection: cart.items.some((item: any) => !item.product.is_digital)
        ? {
            allowed_countries: ['US', 'CA'],
          }
        : undefined,
      phone_number_collection: {
        enabled: true,
      },
    })

    // Update cart with session ID
    await supabase
      .from('carts')
      .update({
        metadata: {
          ...cart.metadata,
          stripe_session_id: session.id,
        },
      })
      .eq('id', cartId)

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Checkout session creation error:', error)

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
