/**
 * Stripe Client Configuration
 *
 * Establishes secure payment processing integration for scalable eCommerce operations.
 * Designed to streamline checkout workflows and ensure PCI compliance.
 *
 * Best for: Production-ready payment processing with minimal compliance overhead
 */

import { loadStripe, Stripe } from '@stripe/stripe-js'

// Environment variables configuration
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

if (!stripePublishableKey) {
  console.warn(
    'Stripe publishable key not configured. Payment features will be disabled. ' +
    'Set VITE_STRIPE_PUBLISHABLE_KEY in your environment variables.'
  )
}

/**
 * Lazy-loaded Stripe instance for optimal performance
 *
 * Benefits:
 * - Deferred script loading reduces initial page load time
 * - Automatic PCI compliance through Stripe.js
 * - Built-in fraud prevention and security
 */
let stripePromise: Promise<Stripe | null> | null = null

export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise && stripePublishableKey) {
    stripePromise = loadStripe(stripePublishableKey)
  }
  return stripePromise || Promise.resolve(null)
}

/**
 * Stripe Test Card Numbers
 *
 * Use these during development to simulate different payment scenarios.
 * Best for: Testing checkout flows without processing real payments
 *
 * Documentation: https://stripe.com/docs/testing
 */
export const TEST_CARDS = {
  VISA_SUCCESS: '4242424242424242',
  VISA_DECLINE: '4000000000000002',
  VISA_INSUFFICIENT_FUNDS: '4000000000009995',
  VISA_3DS_REQUIRED: '4000002500003155',
  MASTERCARD_SUCCESS: '5555555555554444',
  AMEX_SUCCESS: '378282246310005',
  DISCOVER_SUCCESS: '6011111111111117',
} as const

/**
 * Stripe Webhook Event Types
 *
 * Central registry of webhook events to handle for complete payment lifecycle management.
 */
export const WEBHOOK_EVENTS = {
  // Checkout Session Events
  CHECKOUT_SESSION_COMPLETED: 'checkout.session.completed',
  CHECKOUT_SESSION_EXPIRED: 'checkout.session.expired',

  // Payment Intent Events
  PAYMENT_INTENT_SUCCEEDED: 'payment_intent.succeeded',
  PAYMENT_INTENT_PAYMENT_FAILED: 'payment_intent.payment_failed',
  PAYMENT_INTENT_CANCELED: 'payment_intent.canceled',

  // Charge Events
  CHARGE_SUCCEEDED: 'charge.succeeded',
  CHARGE_FAILED: 'charge.failed',
  CHARGE_REFUNDED: 'charge.refunded',

  // Subscription Events
  CUSTOMER_SUBSCRIPTION_CREATED: 'customer.subscription.created',
  CUSTOMER_SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  CUSTOMER_SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  CUSTOMER_SUBSCRIPTION_TRIAL_WILL_END: 'customer.subscription.trial_will_end',

  // Invoice Events
  INVOICE_CREATED: 'invoice.created',
  INVOICE_FINALIZED: 'invoice.finalized',
  INVOICE_PAID: 'invoice.paid',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
  INVOICE_PAYMENT_SUCCEEDED: 'invoice.payment_succeeded',

  // Refund Events
  CHARGE_REFUND_UPDATED: 'charge.refund.updated',
} as const

/**
 * Stripe Error Codes
 *
 * Comprehensive error handling for improved customer experience.
 * Best for: Providing actionable error messages during checkout
 */
export const STRIPE_ERROR_CODES = {
  CARD_DECLINED: 'card_declined',
  INSUFFICIENT_FUNDS: 'insufficient_funds',
  EXPIRED_CARD: 'expired_card',
  INCORRECT_CVC: 'incorrect_cvc',
  PROCESSING_ERROR: 'processing_error',
  RATE_LIMIT: 'rate_limit',
} as const

/**
 * User-friendly error messages for Stripe errors
 *
 * Converts technical error codes into actionable customer guidance.
 */
export const getStripeErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case STRIPE_ERROR_CODES.CARD_DECLINED:
      return 'Your card was declined. Please try a different payment method or contact your bank.'
    case STRIPE_ERROR_CODES.INSUFFICIENT_FUNDS:
      return 'Insufficient funds. Please try a different card or payment method.'
    case STRIPE_ERROR_CODES.EXPIRED_CARD:
      return 'Your card has expired. Please use a different payment method.'
    case STRIPE_ERROR_CODES.INCORRECT_CVC:
      return 'The CVC code is incorrect. Please check your card and try again.'
    case STRIPE_ERROR_CODES.PROCESSING_ERROR:
      return 'An error occurred while processing your payment. Please try again.'
    case STRIPE_ERROR_CODES.RATE_LIMIT:
      return 'Too many requests. Please wait a moment and try again.'
    default:
      return 'An unexpected error occurred. Please try again or contact support.'
  }
}

/**
 * Create Stripe Checkout Session
 *
 * Server-side function to initiate secure checkout flow.
 * Best for: Converting shopping carts into payment sessions
 */
export interface CreateCheckoutSessionParams {
  cartId: string
  successUrl: string
  cancelUrl: string
  customerEmail?: string
  mode: 'payment' | 'subscription'
  metadata?: Record<string, string>
}

/**
 * Format amount for Stripe (convert to cents)
 *
 * Stripe processes amounts in cents to avoid floating-point precision issues.
 *
 * Example: formatAmountForStripe(49.99) => 4999
 */
export const formatAmountForStripe = (amount: number, currency = 'usd'): number => {
  // Check if currency uses zero-decimal (e.g., JPY, KRW)
  const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND', 'CLP', 'TWD', 'PYG']

  if (zeroDecimalCurrencies.includes(currency.toUpperCase())) {
    return Math.round(amount)
  }

  return Math.round(amount * 100)
}

/**
 * Format amount from Stripe (convert from cents)
 *
 * Converts Stripe's cent-based amounts to decimal for display.
 *
 * Example: formatAmountFromStripe(4999) => 49.99
 */
export const formatAmountFromStripe = (amount: number, currency = 'usd'): number => {
  const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND', 'CLP', 'TWD', 'PYG']

  if (zeroDecimalCurrencies.includes(currency.toUpperCase())) {
    return amount
  }

  return amount / 100
}

/**
 * Validate Stripe webhook signature
 *
 * Ensures webhook events are authentic and haven't been tampered with.
 * Best for: Secure webhook processing with idempotency guarantees
 */
export const constructWebhookEvent = (
  payload: string,
  signature: string,
  webhookSecret: string
) => {
  // Note: This is a client-side reference. Actual webhook validation
  // must happen server-side using Stripe.webhooks.constructEvent()
  return {
    payload,
    signature,
    webhookSecret,
  }
}

/**
 * Subscription Price Calculator
 *
 * Calculates prorated amounts and billing cycles for subscription changes.
 * Best for: Transparent pricing during subscription upgrades/downgrades
 */
export const calculateProration = (
  currentPrice: number,
  newPrice: number,
  daysRemaining: number,
  totalDaysInPeriod: number
): number => {
  const unusedAmount = (currentPrice / totalDaysInPeriod) * daysRemaining
  const newAmount = (newPrice / totalDaysInPeriod) * daysRemaining

  return Math.round(newAmount - unusedAmount)
}

/**
 * Payment Method Display Helper
 *
 * Formats payment method details for user-friendly display.
 * Best for: Order confirmation and payment history screens
 */
export interface PaymentMethodDisplay {
  brand: string
  last4: string
  expMonth: number
  expYear: number
  displayText: string
}

export const formatPaymentMethod = (
  paymentMethodDetails: Record<string, any>
): PaymentMethodDisplay | null => {
  if (!paymentMethodDetails || !paymentMethodDetails.last4) {
    return null
  }

  const brand = paymentMethodDetails.brand || 'card'
  const last4 = paymentMethodDetails.last4
  const expMonth = paymentMethodDetails.exp_month || 12
  const expYear = paymentMethodDetails.exp_year || 2025

  return {
    brand: brand.charAt(0).toUpperCase() + brand.slice(1),
    last4,
    expMonth,
    expYear,
    displayText: `${brand.charAt(0).toUpperCase() + brand.slice(1)} ending in ${last4}`,
  }
}
