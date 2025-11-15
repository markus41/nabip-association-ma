# NABIP AMS eCommerce Implementation Guide

**Comprehensive eCommerce Platform with Stripe Integration**

This guide establishes a complete, production-ready eCommerce infrastructure designed to streamline product sales, subscriptions, and payment processing across the NABIP organization.

**Best for:** Organizations scaling eCommerce operations with Stripe and requiring multi-tenant security.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup Instructions](#setup-instructions)
4. [Database Schema](#database-schema)
5. [API Integration](#api-integration)
6. [Stripe Integration](#stripe-integration)
7. [Testing Guide](#testing-guide)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## Overview

### Key Features Implemented

1. **Product Catalog Management**
   - Multi-tier pricing (one-time and recurring)
   - Member-specific pricing
   - Inventory tracking for physical products
   - Digital product delivery with access controls

2. **Shopping Cart**
   - Persistent cart state across sessions
   - Guest and authenticated checkout
   - Coupon code support
   - Automatic cart expiration (7 days)

3. **Stripe Checkout Integration**
   - Hosted checkout for PCI compliance
   - Support for cards, ACH, and alternative payment methods
   - Automatic tax calculation
   - Shipping address collection

4. **Order Management**
   - Auto-generated order numbers (ORD-YYYY-######)
   - Order fulfillment tracking
   - Digital product access grants
   - Comprehensive order history

5. **Payment Processing**
   - Stripe Payment Intents
   - Automatic payment confirmation
   - Refund processing
   - Payment method storage

6. **Subscription Billing**
   - Recurring subscriptions (daily, weekly, monthly, yearly)
   - Trial periods
   - Prorated billing
   - Automatic renewal and cancellation

7. **Webhook Processing**
   - Idempotent event handling
   - Comprehensive event logging
   - Automatic order creation from successful checkouts
   - Subscription lifecycle management

---

## Architecture

### Technology Stack

- **Frontend:** React 19 + TypeScript
- **Database:** Supabase PostgreSQL
- **Payments:** Stripe Checkout + Payment Intents
- **Serverless Functions:** Supabase Edge Functions (Deno)
- **Authentication:** Supabase Auth with RLS
- **State Management:** React Hooks

### Data Flow

```
User → Shopping Cart (Supabase) → Stripe Checkout → Webhook → Order Creation
  ↓                                       ↓                      ↓
Member Auth                         Payment Intent         Order Fulfillment
  ↓                                       ↓                      ↓
RLS Policies                      Payment Record          Email Confirmation
```

### Security Model

- **Row Level Security (RLS):** All tables enforce multi-tenant data isolation
- **Stripe Webhook Verification:** HMAC-SHA256 signature validation
- **PCI Compliance:** Stripe handles all payment data
- **Idempotent Processing:** Duplicate webhook events are automatically detected

---

## Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your credentials:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 2. Database Migration

Run Supabase migrations:

```bash
# Navigate to project directory
cd supabase

# Run migrations
supabase db push

# Verify tables created
supabase db list
```

Expected tables:
- `products`
- `prices`
- `carts`
- `cart_items`
- `orders`
- `order_items`
- `payments`
- `refunds`
- `subscriptions`
- `coupons`
- `coupon_redemptions`
- `webhook_events`
- `stripe_customers`

### 3. Deploy Edge Functions

Deploy Stripe integration functions:

```bash
# Deploy checkout session creator
supabase functions deploy create-checkout-session

# Deploy webhook handler
supabase functions deploy stripe-webhook

# Set secrets
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4. Configure Stripe Webhooks

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Set endpoint URL:
   ```
   https://your-project.supabase.co/functions/v1/stripe-webhook
   ```
4. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `charge.refunded`

5. Copy the webhook signing secret to your environment variables

### 5. Install Dependencies

```bash
npm install stripe @supabase/supabase-js
```

---

## Database Schema

### Products Table

Stores product catalog with pricing and inventory information.

**Key Features:**
- Multi-tier pricing (one-time vs. recurring)
- Member-specific pricing
- Digital product support
- Inventory tracking

**Example Query:**

```sql
-- Get all active products with prices
SELECT
  p.*,
  json_agg(pr.*) as prices
FROM products p
LEFT JOIN prices pr ON pr.product_id = p.id
WHERE p.active = true
GROUP BY p.id;
```

### Orders Table

Central table for order management and fulfillment tracking.

**Auto-Generated Fields:**
- `order_number`: ORD-YYYY-###### format
- `created_at`, `updated_at`: Automatic timestamps

**Order Statuses:**
- `pending`: Order created, awaiting payment
- `processing`: Payment received, fulfillment in progress
- `completed`: Order fulfilled
- `cancelled`: Order cancelled
- `refunded`: Order refunded
- `partially_refunded`: Partial refund issued

**Example Query:**

```sql
-- Get member's order history with items
SELECT
  o.*,
  json_agg(oi.*) as items
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
WHERE o.member_id = 'member-uuid'
GROUP BY o.id
ORDER BY o.created_at DESC;
```

---

## API Integration

### Shopping Cart Operations

**Add Item to Cart:**

```typescript
import { useCart } from '@/lib/hooks/useCart'

const { addItem } = useCart()

await addItem(productId, priceId, quantity)
```

**Remove Item from Cart:**

```typescript
const { removeItem } = useCart()

await removeItem(cartItemId)
```

**Apply Coupon Code:**

```typescript
const { applyCoupon } = useCart()

await applyCoupon('SUMMER2025')
```

### Checkout Flow

**Initiate Checkout:**

```typescript
import { useCheckout } from '@/lib/hooks/useCheckout'

const { initiateCheckout } = useCheckout()

await initiateCheckout(
  cart,
  `${window.location.origin}/checkout/success`,
  `${window.location.origin}/checkout/cancel`
)
```

**Handle Checkout Success:**

```typescript
import { useCheckoutSuccess } from '@/lib/hooks/useCheckout'

const { processCheckoutSuccess, order } = useCheckoutSuccess()

// Extract session ID from URL
const urlParams = new URLSearchParams(window.location.search)
const sessionId = urlParams.get('session_id')

if (sessionId) {
  await processCheckoutSuccess(sessionId)
}
```

### Product Catalog

**Fetch Products:**

```typescript
import { supabase } from '@/lib/supabase/client'

const { data: products, error } = await supabase
  .from('products')
  .select(`
    *,
    prices(*)
  `)
  .eq('active', true)
  .order('created_at', { ascending: false })
```

**Create Product (Admin):**

```typescript
const { data: product, error } = await supabase
  .from('products')
  .insert({
    name: 'Professional Membership',
    description: 'Annual NABIP membership with full benefits',
    category: 'membership',
    active: true,
    is_digital: true,
  })
  .select()
  .single()

// Create associated price
const { data: price } = await supabase
  .from('prices')
  .insert({
    product_id: product.id,
    unit_amount: 9900, // $99.00 in cents
    currency: 'usd',
    type: 'recurring',
    billing_interval: 'year',
    active: true,
  })
```

---

## Stripe Integration

### Test Cards

Use these test cards during development:

| Card Number          | Scenario                    |
|----------------------|-----------------------------|
| 4242 4242 4242 4242 | Successful payment          |
| 4000 0000 0000 0002 | Card declined               |
| 4000 0000 0000 9995 | Insufficient funds          |
| 4000 0025 0000 3155 | 3D Secure authentication    |

**Expiry Date:** Any future date
**CVC:** Any 3 digits
**ZIP:** Any 5 digits

### Creating Products in Stripe

Sync products to Stripe for hosted checkout:

```typescript
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Create Stripe product
const stripeProduct = await stripe.products.create({
  name: 'Professional Membership',
  description: 'Annual NABIP membership',
  metadata: {
    product_id: 'supabase-product-uuid',
  },
})

// Create Stripe price
const stripePrice = await stripe.prices.create({
  product: stripeProduct.id,
  unit_amount: 9900,
  currency: 'usd',
  recurring: {
    interval: 'year',
  },
})

// Store Stripe IDs in Supabase
await supabase
  .from('products')
  .update({ stripe_product_id: stripeProduct.id })
  .eq('id', 'product-uuid')

await supabase
  .from('prices')
  .update({ stripe_price_id: stripePrice.id })
  .eq('id', 'price-uuid')
```

### Webhook Testing

Test webhooks locally using Stripe CLI:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local endpoint
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger payment_intent.succeeded
```

---

## Testing Guide

### 1. Product Catalog Testing

**Test Case: Create Product**

```sql
INSERT INTO products (name, description, category, active, is_digital)
VALUES (
  'Test Product',
  'Test product description',
  'course',
  true,
  true
);

INSERT INTO prices (product_id, unit_amount, currency, type, active)
VALUES (
  'product-uuid',
  4999, -- $49.99
  'usd',
  'one_time',
  true
);
```

**Expected Result:** Product appears in catalog with pricing

### 2. Shopping Cart Testing

**Test Case: Add to Cart**

```typescript
// Test adding item
await addItem(productId, priceId, 1)

// Verify cart contains item
const { data: cart } = await supabase
  .from('carts')
  .select('*, items:cart_items(*)')
  .eq('member_id', userId)
  .single()

expect(cart.items.length).toBe(1)
```

### 3. Checkout Testing

**Test Case: Successful Checkout**

1. Add items to cart
2. Navigate to checkout
3. Use test card: `4242 4242 4242 4242`
4. Complete checkout
5. Verify order created in database
6. Verify payment status is `succeeded`
7. Verify cart status is `converted`

**Expected Webhook Events:**
- `checkout.session.completed`
- `payment_intent.succeeded`

### 4. Subscription Testing

**Test Case: Create Subscription**

```typescript
// Create recurring price
const { data: price } = await supabase
  .from('prices')
  .insert({
    product_id: productId,
    unit_amount: 2999, // $29.99/month
    currency: 'usd',
    type: 'recurring',
    billing_interval: 'month',
    active: true,
  })

// Complete checkout with recurring price
// Verify subscription created in database
```

### 5. Refund Testing

**Test Case: Process Refund**

```typescript
// In Stripe Dashboard or via API
const refund = await stripe.refunds.create({
  payment_intent: 'pi_...',
  amount: 4999, // Full refund
})

// Verify webhook processes refund
// Verify refund record created
// Verify order status updated to 'refunded'
```

---

## Deployment

### Production Checklist

- [ ] Switch to Stripe live keys
- [ ] Update webhook endpoint to production URL
- [ ] Configure production Supabase project
- [ ] Enable Stripe webhook signature verification
- [ ] Set up monitoring and alerts
- [ ] Configure email notifications
- [ ] Test all payment flows in production
- [ ] Enable SSL/TLS for all endpoints
- [ ] Set up backup and disaster recovery
- [ ] Document runbooks for common issues

### Environment Variables (Production)

```env
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=prod_anon_key
SUPABASE_SERVICE_ROLE_KEY=prod_service_role_key

VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_prod_...

VITE_APP_URL=https://your-production-domain.com
NODE_ENV=production
```

---

## Troubleshooting

### Common Issues

**Issue: "Cart not initialized"**

**Solution:** Ensure user is authenticated or session ID is generated
```typescript
const sessionId = getOrCreateSessionId()
```

**Issue: "Stripe webhook signature verification failed"**

**Solution:** Verify webhook secret matches Stripe dashboard
```bash
# Check webhook secret
supabase secrets list

# Update if needed
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

**Issue: "Order not created after successful checkout"**

**Solution:** Check webhook event processing
```sql
-- Query webhook events
SELECT * FROM webhook_events
WHERE event_type = 'checkout.session.completed'
ORDER BY created_at DESC
LIMIT 10;

-- Check for failed events
SELECT * FROM webhook_events
WHERE processing_status = 'failed';
```

**Issue: "Duplicate order created"**

**Solution:** Idempotency check should prevent this. Verify:
```sql
-- Check for duplicate events
SELECT stripe_event_id, COUNT(*)
FROM webhook_events
GROUP BY stripe_event_id
HAVING COUNT(*) > 1;
```

**Issue: "Payment succeeded but order shows 'pending'"**

**Solution:** Process missing webhook event manually:
```typescript
// Fetch payment intent from Stripe
const paymentIntent = await stripe.paymentIntents.retrieve('pi_...')

// Update order status
await supabase
  .from('orders')
  .update({
    payment_status: 'paid',
    status: 'processing',
  })
  .eq('stripe_payment_intent_id', paymentIntent.id)
```

### Monitoring

**Key Metrics to Track:**

1. **Checkout Conversion Rate**
   ```sql
   SELECT
     COUNT(CASE WHEN status = 'converted' THEN 1 END)::FLOAT /
     COUNT(*) * 100 AS conversion_rate
   FROM carts
   WHERE created_at >= NOW() - INTERVAL '30 days';
   ```

2. **Average Order Value**
   ```sql
   SELECT AVG(total_amount / 100.0) AS avg_order_value
   FROM orders
   WHERE status = 'completed'
   AND created_at >= NOW() - INTERVAL '30 days';
   ```

3. **Failed Payment Rate**
   ```sql
   SELECT
     COUNT(CASE WHEN payment_status = 'failed' THEN 1 END)::FLOAT /
     COUNT(*) * 100 AS failed_payment_rate
   FROM orders
   WHERE created_at >= NOW() - INTERVAL '30 days';
   ```

4. **Webhook Processing Failures**
   ```sql
   SELECT
     event_type,
     COUNT(*) as failure_count
   FROM webhook_events
   WHERE processing_status = 'failed'
   GROUP BY event_type
   ORDER BY failure_count DESC;
   ```

---

## Support

For questions or issues:

- **Technical Support:** Consultations@BrooksideBI.com
- **Phone:** +1 209 487 2047
- **Documentation:** Review this guide and Stripe/Supabase docs
- **GitHub Issues:** Open an issue with detailed error logs

---

**Last Updated:** 2025-01-15
**Version:** 1.0.0
**Maintained by:** Brookside BI
