# NABIP AMS eCommerce - Quick Start Guide

**Get your eCommerce platform running in under 30 minutes**

This guide provides streamlined setup instructions for the NABIP AMS eCommerce platform. For detailed information, refer to `ECOMMERCE_IMPLEMENTATION_GUIDE.md`.

---

## Prerequisites

- [x] Supabase account with active project
- [x] Stripe account (test mode)
- [x] Node.js 18+ installed
- [x] Git repository cloned

---

## 5-Minute Setup

### Step 1: Environment Variables (2 minutes)

```bash
# Copy template
cp .env.example .env.local
```

Fill in these required values:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51...
```

**Where to find these:**
- Supabase: https://supabase.com/dashboard/project/_/settings/api
- Stripe: https://dashboard.stripe.com/test/apikeys

### Step 2: Database Setup (3 minutes)

```bash
# Run migrations
supabase db push

# Verify tables created
supabase db list
```

Expected output: 13 new tables including `products`, `carts`, `orders`, etc.

### Step 3: Install Dependencies (1 minute)

```bash
npm install stripe @supabase/supabase-js
```

### Step 4: Deploy Edge Functions (3 minutes)

```bash
# Deploy checkout function
supabase functions deploy create-checkout-session

# Deploy webhook handler
supabase functions deploy stripe-webhook

# Set Stripe secret
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
```

### Step 5: Configure Stripe Webhook (2 minutes)

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. URL: `https://xxxxx.supabase.co/functions/v1/stripe-webhook`
4. Events: Select all `checkout.*` and `payment_intent.*` events
5. Copy webhook signing secret
6. Set secret:

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Test Your Setup (5 minutes)

### Create Test Product

```sql
-- Run in Supabase SQL Editor
INSERT INTO products (name, description, active, is_digital)
VALUES (
  'Test Membership',
  'Annual membership with full benefits',
  true,
  true
) RETURNING id;

-- Note the returned ID, then create price:
INSERT INTO prices (product_id, unit_amount, currency, type, active)
VALUES (
  'PASTE_PRODUCT_ID_HERE',
  9900, -- $99.00
  'usd',
  'one_time',
  true
);
```

### Test Shopping Cart

```typescript
import { useCart } from '@/lib/hooks/useCart'

function TestCart() {
  const { cart, addItem, loading } = useCart()

  const handleAddToCart = async () => {
    await addItem('product-id', 'price-id', 1)
  }

  return (
    <button onClick={handleAddToCart} disabled={loading}>
      Add to Cart
    </button>
  )
}
```

### Test Checkout

1. Add item to cart
2. Click checkout
3. Use test card: `4242 4242 4242 4242`
4. Expiry: Any future date
5. CVC: Any 3 digits
6. Complete checkout
7. Verify order created in `orders` table

---

## Common Test Scenarios

### Successful Payment

```
Card: 4242 4242 4242 4242
Expected: Order created with status "processing"
```

### Declined Card

```
Card: 4000 0000 0000 0002
Expected: Payment fails with error message
```

### 3D Secure Authentication

```
Card: 4000 0025 0000 3155
Expected: Stripe prompts for authentication
```

---

## Verify Installation

Run these queries to confirm setup:

```sql
-- Check products table
SELECT COUNT(*) FROM products;

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'products';

-- Check webhook events
SELECT * FROM webhook_events
ORDER BY created_at DESC
LIMIT 5;
```

---

## Troubleshooting

### Issue: "Stripe not initialized"

**Solution:**
```typescript
// Verify publishable key is set
console.log(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
```

### Issue: "Webhook signature verification failed"

**Solution:**
```bash
# Verify webhook secret matches Stripe dashboard
supabase secrets list

# Update if needed
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

### Issue: "Cart not found"

**Solution:**
```typescript
// Ensure user is authenticated or session ID exists
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)
```

---

## Next Steps

1. **Build UI Components** (Phase 2)
   - Shopping cart view
   - Product catalog
   - Checkout flow

2. **Add Sample Products**
   - Create product catalog
   - Set up pricing tiers
   - Configure member discounts

3. **Test End-to-End**
   - Complete full purchase flow
   - Verify webhook processing
   - Check order fulfillment

4. **Go Live**
   - Switch to Stripe live mode
   - Update webhook endpoint
   - Monitor production metrics

---

## Quick Reference

### File Locations

```
supabase/migrations/
  └─ 035_ecommerce_schema.sql       # Database schema
  └─ 036_ecommerce_rls_policies.sql # Security policies

supabase/functions/
  └─ create-checkout-session/       # Checkout handler
  └─ stripe-webhook/                # Webhook processor

src/lib/
  └─ types.ts                        # TypeScript types
  └─ supabase/client.ts             # Supabase client
  └─ stripe/client.ts               # Stripe client
  └─ hooks/useCart.ts               # Shopping cart hook
  └─ hooks/useCheckout.ts           # Checkout hook

docs/
  └─ ECOMMERCE_IMPLEMENTATION_GUIDE.md  # Full documentation
  └─ ECOMMERCE_IMPLEMENTATION_SUMMARY.md # Overview
```

### Key Commands

```bash
# Database
supabase db push                    # Apply migrations
supabase db reset                   # Reset database (dev only)

# Edge Functions
supabase functions deploy <name>    # Deploy function
supabase functions invoke <name>    # Test function
supabase secrets set KEY=value      # Set secret

# Development
npm run dev                         # Start dev server
npm run build                       # Build for production

# Stripe CLI (optional)
stripe listen --forward-to ...      # Test webhooks locally
stripe trigger checkout.session.completed  # Trigger test event
```

---

## Support

**Need Help?**
- Email: Consultations@BrooksideBI.com
- Phone: +1 209 487 2047
- Docs: Review `ECOMMERCE_IMPLEMENTATION_GUIDE.md`

**Resources:**
- Stripe Testing: https://stripe.com/docs/testing
- Supabase Functions: https://supabase.com/docs/guides/functions
- React Hooks: https://react.dev/reference/react

---

**Last Updated:** 2025-01-15
**Version:** 1.0.0
