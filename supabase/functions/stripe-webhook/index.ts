/**
 * Stripe Webhook Handler Edge Function
 *
 * Processes Stripe webhook events for complete payment lifecycle management.
 * Designed to ensure reliable order fulfillment and subscription updates.
 *
 * Best for: Production eCommerce with idempotent event processing
 *
 * Environment Variables Required:
 * - STRIPE_SECRET_KEY: Your Stripe secret API key
 * - STRIPE_WEBHOOK_SECRET: Your Stripe webhook signing secret
 *
 * Webhook Events Handled:
 * - checkout.session.completed: Create order from successful checkout
 * - payment_intent.succeeded: Mark payment as successful
 * - payment_intent.payment_failed: Handle failed payments
 * - customer.subscription.*: Manage subscription lifecycle
 * - invoice.*: Handle subscription billing
 * - charge.refunded: Process refunds
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
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify webhook signature
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    console.log(`Processing webhook event: ${event.type}`)

    // Check for duplicate events (idempotency)
    const { data: existingEvent } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('stripe_event_id', event.id)
      .single()

    if (existingEvent) {
      console.log(`Event ${event.id} already processed, skipping`)
      return new Response(JSON.stringify({ received: true, skipped: true }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Store webhook event for audit trail
    const { data: webhookEvent, error: webhookError } = await supabase
      .from('webhook_events')
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        event_data: event.data.object,
        processing_status: 'processing',
      })
      .select()
      .single()

    if (webhookError) throw webhookError

    // Process event based on type
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutSessionCompleted(supabase, event.data.object as Stripe.Checkout.Session)
          break

        case 'payment_intent.succeeded':
          await handlePaymentIntentSucceeded(supabase, event.data.object as Stripe.PaymentIntent)
          break

        case 'payment_intent.payment_failed':
          await handlePaymentIntentFailed(supabase, event.data.object as Stripe.PaymentIntent)
          break

        case 'charge.refunded':
          await handleChargeRefunded(supabase, event.data.object as Stripe.Charge)
          break

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await handleSubscriptionChanged(supabase, event.data.object as Stripe.Subscription)
          break

        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(supabase, event.data.object as Stripe.Subscription)
          break

        case 'invoice.paid':
          await handleInvoicePaid(supabase, event.data.object as Stripe.Invoice)
          break

        case 'invoice.payment_failed':
          await handleInvoicePaymentFailed(supabase, event.data.object as Stripe.Invoice)
          break

        default:
          console.log(`Unhandled event type: ${event.type}`)
      }

      // Mark event as processed
      await supabase
        .from('webhook_events')
        .update({
          processing_status: 'processed',
          processed_at: new Date().toISOString(),
        })
        .eq('id', webhookEvent.id)
    } catch (processingError) {
      // Mark event as failed
      await supabase
        .from('webhook_events')
        .update({
          processing_status: 'failed',
          error_message: processingError instanceof Error ? processingError.message : 'Unknown error',
          retry_count: webhookEvent.retry_count + 1,
        })
        .eq('id', webhookEvent.id)

      throw processingError
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Webhook processing error:', error)

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Webhook processing failed',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

/**
 * Handle successful checkout session
 *
 * Creates order and order items from completed checkout session.
 */
async function handleCheckoutSessionCompleted(
  supabase: any,
  session: Stripe.Checkout.Session
) {
  const cartId = session.metadata?.cart_id
  const memberId = session.metadata?.member_id || null

  if (!cartId) {
    throw new Error('Cart ID not found in session metadata')
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

  // Calculate totals
  const subtotal = cart.items.reduce(
    (sum: number, item: any) => sum + item.quantity * item.unit_price,
    0
  )
  const discountAmount = cart.discount_amount || 0
  const totalAmount = session.amount_total || subtotal - discountAmount

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      member_id: memberId,
      email: session.customer_email,
      subtotal,
      discount_amount: discountAmount,
      tax_amount: 0,
      shipping_amount: 0,
      total_amount: totalAmount,
      currency: session.currency || 'usd',
      status: 'processing',
      payment_status: 'paid',
      payment_method: session.payment_method_types?.[0] || 'card',
      stripe_payment_intent_id: session.payment_intent as string,
      stripe_checkout_session_id: session.id,
      shipping_address: session.shipping_details?.address,
      billing_address: session.customer_details?.address,
      coupon_code: cart.coupon_code,
      metadata: session.metadata,
    })
    .select()
    .single()

  if (orderError) throw orderError

  // Create order items
  const orderItems = cart.items.map((item: any) => ({
    order_id: order.id,
    product_id: item.product_id,
    price_id: item.price_id,
    product_name: item.product.name,
    product_description: item.product.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.quantity * item.unit_price,
    discount_amount: 0,
    tax_amount: 0,
    is_digital: item.product.is_digital,
    download_url: item.product.download_url,
    fulfillment_status: item.product.is_digital ? 'fulfilled' : 'pending',
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)

  if (itemsError) throw itemsError

  // Create payment record
  const { error: paymentError } = await supabase.from('payments').insert({
    order_id: order.id,
    amount: totalAmount,
    currency: session.currency || 'usd',
    status: 'succeeded',
    payment_method: session.payment_method_types?.[0] || 'card',
    stripe_payment_intent_id: session.payment_intent as string,
    succeeded_at: new Date().toISOString(),
  })

  if (paymentError) throw paymentError

  // Mark cart as converted
  await supabase
    .from('carts')
    .update({
      status: 'converted',
      converted_to_order_id: order.id,
    })
    .eq('id', cartId)

  // Record coupon redemption if applicable
  if (cart.coupon_code) {
    const { data: coupon } = await supabase
      .from('coupons')
      .select('id')
      .eq('code', cart.coupon_code)
      .single()

    if (coupon) {
      await supabase.from('coupon_redemptions').insert({
        coupon_id: coupon.id,
        member_id: memberId,
        order_id: order.id,
        discount_amount: discountAmount,
      })

      // Update coupon redemption count
      await supabase.rpc('increment_coupon_redemptions', { coupon_id: coupon.id })
    }
  }

  console.log(`Order ${order.order_number} created successfully`)
}

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(
  supabase: any,
  paymentIntent: Stripe.PaymentIntent
) {
  await supabase
    .from('payments')
    .update({
      status: 'succeeded',
      succeeded_at: new Date().toISOString(),
      processor_response: paymentIntent,
    })
    .eq('stripe_payment_intent_id', paymentIntent.id)

  await supabase
    .from('orders')
    .update({
      payment_status: 'paid',
      status: 'processing',
    })
    .eq('stripe_payment_intent_id', paymentIntent.id)
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(
  supabase: any,
  paymentIntent: Stripe.PaymentIntent
) {
  await supabase
    .from('payments')
    .update({
      status: 'failed',
      failed_at: new Date().toISOString(),
      failure_reason: paymentIntent.last_payment_error?.message,
      failure_code: paymentIntent.last_payment_error?.code,
    })
    .eq('stripe_payment_intent_id', paymentIntent.id)

  await supabase
    .from('orders')
    .update({
      payment_status: 'failed',
    })
    .eq('stripe_payment_intent_id', paymentIntent.id)
}

/**
 * Handle refunded charge
 */
async function handleChargeRefunded(supabase: any, charge: Stripe.Charge) {
  const refundAmount = charge.amount_refunded

  // Find payment by charge ID
  const { data: payment } = await supabase
    .from('payments')
    .select('*')
    .eq('stripe_charge_id', charge.id)
    .single()

  if (!payment) return

  // Create refund record
  await supabase.from('refunds').insert({
    payment_id: payment.id,
    order_id: payment.order_id,
    amount: refundAmount,
    currency: charge.currency,
    status: 'succeeded',
    stripe_refund_id: charge.refunds?.data[0]?.id,
    succeeded_at: new Date().toISOString(),
  })

  // Update payment
  await supabase
    .from('payments')
    .update({
      refunded_amount: refundAmount,
      status: refundAmount === payment.amount ? 'refunded' : 'partially_refunded',
    })
    .eq('id', payment.id)

  // Update order
  await supabase
    .from('orders')
    .update({
      refunded_amount: refundAmount,
      payment_status: refundAmount === payment.amount ? 'refunded' : 'partially_refunded',
      status: refundAmount === payment.amount ? 'refunded' : 'partially_refunded',
      refunded_at: new Date().toISOString(),
    })
    .eq('id', payment.order_id)
}

/**
 * Handle subscription created/updated
 */
async function handleSubscriptionChanged(
  supabase: any,
  subscription: Stripe.Subscription
) {
  const { data: stripeCustomer } = await supabase
    .from('stripe_customers')
    .select('member_id')
    .eq('stripe_customer_id', subscription.customer)
    .single()

  if (!stripeCustomer) return

  const subscriptionData = {
    member_id: stripeCustomer.member_id,
    product_id: subscription.metadata?.product_id,
    price_id: subscription.metadata?.price_id,
    status: subscription.status,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer as string,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    trial_start: subscription.trial_start
      ? new Date(subscription.trial_start * 1000).toISOString()
      : null,
    trial_end: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
    cancel_at: subscription.cancel_at
      ? new Date(subscription.cancel_at * 1000).toISOString()
      : null,
    cancel_at_period_end: subscription.cancel_at_period_end,
    billing_interval: subscription.items.data[0]?.price.recurring?.interval || 'month',
    billing_interval_count: subscription.items.data[0]?.price.recurring?.interval_count || 1,
    unit_amount: subscription.items.data[0]?.price.unit_amount || 0,
    currency: subscription.currency,
  }

  await supabase
    .from('subscriptions')
    .upsert(subscriptionData, { onConflict: 'stripe_subscription_id' })
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(
  supabase: any,
  subscription: Stripe.Subscription
) {
  await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)
}

/**
 * Handle paid invoice
 */
async function handleInvoicePaid(supabase: any, invoice: Stripe.Invoice) {
  if (invoice.subscription) {
    await supabase
      .from('subscriptions')
      .update({
        latest_invoice_id: invoice.id,
      })
      .eq('stripe_subscription_id', invoice.subscription)
  }
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(supabase: any, invoice: Stripe.Invoice) {
  if (invoice.subscription) {
    await supabase
      .from('subscriptions')
      .update({
        status: 'past_due',
      })
      .eq('stripe_subscription_id', invoice.subscription)
  }
}
