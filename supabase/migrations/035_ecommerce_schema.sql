-- Migration: 035_ecommerce_schema.sql
-- Description: Establish comprehensive eCommerce infrastructure with Stripe integration
-- Created: 2025-01-15
-- Purpose: Enable product catalog, shopping cart, checkout, and payment processing
--          to support sustainable revenue growth across NABIP member services

-- ============================================================================
-- PRODUCTS TABLE
-- ============================================================================
-- Catalog management for purchasable items (courses, memberships, materials, etc.)
-- Supports both one-time purchases and recurring subscriptions
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Product categorization for streamlined navigation
  category VARCHAR(100), -- 'membership', 'course', 'event_ticket', 'merchandise', 'publication'
  tags TEXT[], -- Flexible categorization: ['continuing-education', 'digital', 'physical']

  -- Stripe integration
  stripe_product_id VARCHAR(255) UNIQUE, -- Stripe product identifier for payment processing

  -- Product status and visibility
  active BOOLEAN NOT NULL DEFAULT true,
  featured BOOLEAN DEFAULT false, -- Highlight in marketing materials

  -- Inventory management (for physical products)
  track_inventory BOOLEAN DEFAULT false,
  inventory_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  allow_backorder BOOLEAN DEFAULT false,

  -- Digital product delivery
  is_digital BOOLEAN DEFAULT false,
  download_url TEXT,
  access_duration_days INTEGER, -- Temporary access period for digital content

  -- Visual presentation
  image_url TEXT,
  thumbnail_url TEXT,
  gallery_urls TEXT[], -- Additional product images

  -- SEO and discoverability
  slug VARCHAR(255) UNIQUE, -- URL-friendly identifier
  meta_title VARCHAR(160),
  meta_description VARCHAR(320),

  -- Business metadata (JSONB for extensibility)
  metadata JSONB DEFAULT '{}'::jsonb, -- {relatedProducts: [], prerequisites: [], learningObjectives: []}

  -- Audit trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),

  -- Indexes for performance
  CONSTRAINT valid_inventory CHECK (
    (track_inventory = false) OR
    (track_inventory = true AND inventory_quantity >= 0)
  )
);

CREATE INDEX idx_products_active ON products(active) WHERE active = true;
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_stripe_product_id ON products(stripe_product_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_metadata ON products USING gin(metadata);

COMMENT ON TABLE products IS 'Product catalog supporting one-time purchases and subscriptions with Stripe integration';

-- ============================================================================
-- PRICES TABLE
-- ============================================================================
-- Multi-tier pricing structure for flexible monetization strategies
-- Supports one-time payments, subscriptions, and member discounts
CREATE TABLE IF NOT EXISTS prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- Stripe integration
  stripe_price_id VARCHAR(255) UNIQUE, -- Stripe price identifier

  -- Pricing configuration
  unit_amount INTEGER NOT NULL, -- Amount in cents (e.g., 4999 = $49.99)
  currency VARCHAR(3) NOT NULL DEFAULT 'usd',

  -- Pricing type
  type VARCHAR(20) NOT NULL CHECK (type IN ('one_time', 'recurring')),

  -- Recurring billing configuration
  billing_interval VARCHAR(20) CHECK (billing_interval IN ('day', 'week', 'month', 'year')),
  billing_interval_count INTEGER DEFAULT 1, -- Bill every N intervals
  trial_period_days INTEGER DEFAULT 0,

  -- Member pricing tiers
  member_tier VARCHAR(50), -- 'individual', 'organizational', 'student', 'lifetime'
  is_member_only BOOLEAN DEFAULT false,

  -- Pricing status
  active BOOLEAN NOT NULL DEFAULT true,

  -- Display configuration
  nickname VARCHAR(100), -- "Professional Plan", "Early Bird", "Member Rate"
  description TEXT,

  -- Promotional pricing
  compare_at_price INTEGER, -- Original price for discount display

  -- Business metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Audit trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_recurring_config CHECK (
    (type = 'one_time') OR
    (type = 'recurring' AND billing_interval IS NOT NULL)
  )
);

CREATE INDEX idx_prices_product_id ON prices(product_id);
CREATE INDEX idx_prices_stripe_price_id ON prices(stripe_price_id);
CREATE INDEX idx_prices_active ON prices(active, product_id);
CREATE INDEX idx_prices_member_tier ON prices(member_tier);

COMMENT ON TABLE prices IS 'Flexible pricing structure supporting one-time and recurring billing with member discounts';

-- ============================================================================
-- CARTS TABLE
-- ============================================================================
-- Persistent shopping cart state for seamless checkout experiences
-- Supports guest and authenticated users with automatic session management
CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User association
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  session_id VARCHAR(255), -- Anonymous cart tracking via browser session

  -- Cart status
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'abandoned', 'converted', 'expired')),

  -- Applied promotions
  coupon_code VARCHAR(50),
  discount_amount INTEGER DEFAULT 0, -- Total discount in cents

  -- Cart expiration (prevent stale inventory locks)
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),

  -- Conversion tracking
  converted_to_order_id UUID, -- Reference to orders table (added later)

  -- Business metadata
  metadata JSONB DEFAULT '{}'::jsonb, -- {referralSource: 'email_campaign', utm: {...}}

  -- Audit trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT cart_user_or_session CHECK (
    (member_id IS NOT NULL) OR (session_id IS NOT NULL)
  )
);

CREATE INDEX idx_carts_member_id ON carts(member_id) WHERE member_id IS NOT NULL;
CREATE INDEX idx_carts_session_id ON carts(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_carts_status ON carts(status);
CREATE INDEX idx_carts_expires_at ON carts(expires_at) WHERE status = 'active';

COMMENT ON TABLE carts IS 'Persistent shopping cart with session management and conversion tracking';

-- ============================================================================
-- CART_ITEMS TABLE
-- ============================================================================
-- Individual line items within shopping carts
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price_id UUID NOT NULL REFERENCES prices(id) ON DELETE RESTRICT,

  -- Quantity and pricing
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price INTEGER NOT NULL, -- Snapshot price at add-to-cart (cents)

  -- Customization options
  custom_options JSONB DEFAULT '{}'::jsonb, -- {size: 'XL', color: 'Navy', engraving: 'John Doe'}

  -- Audit trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_cart_product_price UNIQUE (cart_id, product_id, price_id)
);

CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);

COMMENT ON TABLE cart_items IS 'Line items within shopping carts with quantity and customization tracking';

-- ============================================================================
-- ORDERS TABLE
-- ============================================================================
-- Confirmed purchases with comprehensive order management
-- Central table for order fulfillment, tracking, and customer service
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL, -- Human-readable: ORD-2025-000123

  -- Customer association
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL, -- Snapshot for guest checkout support

  -- Order financial summary
  subtotal INTEGER NOT NULL, -- Sum of line items before discounts/tax (cents)
  discount_amount INTEGER DEFAULT 0,
  tax_amount INTEGER DEFAULT 0,
  shipping_amount INTEGER DEFAULT 0,
  total_amount INTEGER NOT NULL, -- Final amount charged (cents)
  currency VARCHAR(3) NOT NULL DEFAULT 'usd',

  -- Order lifecycle
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'completed', 'cancelled', 'refunded', 'partially_refunded'
  )),

  -- Payment information
  payment_status VARCHAR(30) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN (
    'unpaid', 'authorized', 'paid', 'partially_refunded', 'refunded', 'failed'
  )),
  payment_method VARCHAR(50), -- 'card', 'ach', 'paypal', etc.

  -- Stripe integration
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_checkout_session_id VARCHAR(255) UNIQUE,

  -- Shipping information (for physical products)
  shipping_address JSONB, -- {name, street, city, state, zip, country}
  billing_address JSONB,
  shipping_method VARCHAR(100),
  tracking_number VARCHAR(100),
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  -- Applied promotions
  coupon_code VARCHAR(50),

  -- Customer communication
  confirmation_sent_at TIMESTAMPTZ,
  fulfillment_email_sent_at TIMESTAMPTZ,

  -- Refund tracking
  refunded_amount INTEGER DEFAULT 0,
  refunded_at TIMESTAMPTZ,
  refund_reason TEXT,

  -- Order notes (internal and customer-facing)
  customer_notes TEXT,
  internal_notes TEXT,

  -- Business metadata
  metadata JSONB DEFAULT '{}'::jsonb, -- {source: 'web', campaign: 'spring-sale', agent: 'copilot'}

  -- Audit trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,

  CONSTRAINT valid_amounts CHECK (
    subtotal >= 0 AND
    total_amount >= 0 AND
    discount_amount >= 0 AND
    refunded_amount >= 0 AND
    refunded_amount <= total_amount
  )
);

-- Generate order numbers automatically
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR AS $$
DECLARE
  seq_num INTEGER;
  year_str VARCHAR(4);
BEGIN
  -- Get next sequence number and current year
  seq_num := nextval('order_number_seq');
  year_str := EXTRACT(YEAR FROM now())::VARCHAR;

  -- Format: ORD-YYYY-######
  RETURN 'ORD-' || year_str || '-' || LPAD(seq_num::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Auto-generate order number on insert
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

CREATE INDEX idx_orders_member_id ON orders(member_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_stripe_payment_intent ON orders(stripe_payment_intent_id);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_email ON orders(email);

COMMENT ON TABLE orders IS 'Confirmed purchases with comprehensive order management and fulfillment tracking';

-- ============================================================================
-- ORDER_ITEMS TABLE
-- ============================================================================
-- Line items within orders (immutable snapshot after checkout)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL, -- Preserve history if product deleted
  price_id UUID REFERENCES prices(id) ON DELETE SET NULL,

  -- Product snapshot (preserve details at time of purchase)
  product_name VARCHAR(255) NOT NULL,
  product_description TEXT,
  sku VARCHAR(100),

  -- Pricing snapshot
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price INTEGER NOT NULL, -- Price per unit in cents
  total_price INTEGER NOT NULL, -- unit_price * quantity
  discount_amount INTEGER DEFAULT 0,
  tax_amount INTEGER DEFAULT 0,

  -- Customization options
  custom_options JSONB DEFAULT '{}'::jsonb,

  -- Digital product delivery
  is_digital BOOLEAN DEFAULT false,
  download_url TEXT,
  access_granted_at TIMESTAMPTZ,
  access_expires_at TIMESTAMPTZ,
  download_count INTEGER DEFAULT 0,

  -- Fulfillment status
  fulfillment_status VARCHAR(30) DEFAULT 'pending' CHECK (fulfillment_status IN (
    'pending', 'processing', 'fulfilled', 'cancelled'
  )),
  fulfilled_at TIMESTAMPTZ,

  -- Business metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Audit trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_order_items_fulfillment_status ON order_items(fulfillment_status);

COMMENT ON TABLE order_items IS 'Immutable order line items preserving product details at time of purchase';

-- ============================================================================
-- PAYMENTS TABLE
-- ============================================================================
-- Payment transaction records for comprehensive financial tracking
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  -- Payment amount
  amount INTEGER NOT NULL CHECK (amount > 0), -- Amount in cents
  currency VARCHAR(3) NOT NULL DEFAULT 'usd',

  -- Payment status
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded'
  )),

  -- Payment method details
  payment_method VARCHAR(50), -- 'card', 'ach', 'paypal', etc.
  payment_method_details JSONB, -- {last4: '4242', brand: 'visa', exp_month: 12, exp_year: 2025}

  -- Stripe integration
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_charge_id VARCHAR(255),

  -- Transaction details
  processor_response JSONB, -- Full Stripe API response for audit trail
  failure_reason TEXT,
  failure_code VARCHAR(100),

  -- Refund tracking
  refunded_amount INTEGER DEFAULT 0,

  -- Business metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Audit trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  succeeded_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,

  CONSTRAINT valid_refund_amount CHECK (refunded_amount >= 0 AND refunded_amount <= amount)
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_stripe_payment_intent ON payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

COMMENT ON TABLE payments IS 'Payment transaction records with Stripe integration and refund tracking';

-- ============================================================================
-- REFUNDS TABLE
-- ============================================================================
-- Refund transaction records for customer service and accounting
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  -- Refund amount
  amount INTEGER NOT NULL CHECK (amount > 0), -- Amount refunded in cents
  currency VARCHAR(3) NOT NULL DEFAULT 'usd',

  -- Refund status
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'succeeded', 'failed', 'cancelled'
  )),

  -- Refund reason
  reason VARCHAR(100), -- 'requested_by_customer', 'duplicate', 'fraudulent', 'other'
  reason_description TEXT,

  -- Stripe integration
  stripe_refund_id VARCHAR(255) UNIQUE,

  -- Transaction details
  processor_response JSONB,
  failure_reason TEXT,

  -- Processed by
  processed_by UUID REFERENCES auth.users(id),

  -- Business metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Audit trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  succeeded_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ
);

CREATE INDEX idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX idx_refunds_order_id ON refunds(order_id);
CREATE INDEX idx_refunds_stripe_refund_id ON refunds(stripe_refund_id);
CREATE INDEX idx_refunds_status ON refunds(status);

COMMENT ON TABLE refunds IS 'Refund transaction records for customer service and financial reconciliation';

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================
-- Recurring billing subscriptions for membership dues, courses, etc.
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  price_id UUID NOT NULL REFERENCES prices(id) ON DELETE RESTRICT,

  -- Subscription status
  status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN (
    'active', 'trialing', 'past_due', 'cancelled', 'unpaid', 'incomplete', 'incomplete_expired'
  )),

  -- Stripe integration
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),

  -- Billing cycle
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,

  -- Cancellation tracking
  cancel_at TIMESTAMPTZ, -- Scheduled cancellation date
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  -- Billing configuration
  billing_interval VARCHAR(20) NOT NULL, -- 'day', 'week', 'month', 'year'
  billing_interval_count INTEGER DEFAULT 1,

  -- Pricing
  unit_amount INTEGER NOT NULL, -- Amount in cents
  currency VARCHAR(3) NOT NULL DEFAULT 'usd',

  -- Payment tracking
  latest_invoice_id UUID, -- Reference to invoices table

  -- Business metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Audit trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subscriptions_member_id ON subscriptions(member_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_current_period_end ON subscriptions(current_period_end);

COMMENT ON TABLE subscriptions IS 'Recurring billing subscriptions with Stripe integration and lifecycle management';

-- ============================================================================
-- INVOICES TABLE (Enhanced for eCommerce)
-- ============================================================================
-- Note: The invoices table already exists from migration 024.
-- This section adds eCommerce-specific columns.

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS stripe_invoice_id VARCHAR(255) UNIQUE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS auto_advance BOOLEAN DEFAULT true;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS collection_method VARCHAR(20) DEFAULT 'charge_automatically';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS hosted_invoice_url TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_pdf TEXT;

CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_invoice_id ON invoices(stripe_invoice_id);

COMMENT ON COLUMN invoices.subscription_id IS 'Reference to recurring subscription if invoice is subscription-related';
COMMENT ON COLUMN invoices.stripe_invoice_id IS 'Stripe invoice identifier for payment processing';

-- ============================================================================
-- COUPONS TABLE
-- ============================================================================
-- Promotional codes for marketing campaigns and discounts
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Coupon identification
  code VARCHAR(50) UNIQUE NOT NULL, -- 'SPRING2025', 'MEMBER50', 'WELCOME10'
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Discount configuration
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value INTEGER NOT NULL CHECK (discount_value > 0), -- 20 (for 20%) or 1000 (for $10.00)
  currency VARCHAR(3) DEFAULT 'usd', -- Required for fixed_amount discounts

  -- Usage restrictions
  max_redemptions INTEGER, -- NULL = unlimited
  max_redemptions_per_customer INTEGER DEFAULT 1,
  redemption_count INTEGER DEFAULT 0,

  -- Applicability rules
  applies_to VARCHAR(20) DEFAULT 'all' CHECK (applies_to IN ('all', 'products', 'prices')),
  applicable_product_ids UUID[], -- Specific products eligible for discount
  applicable_price_ids UUID[], -- Specific prices eligible for discount
  minimum_purchase_amount INTEGER, -- Minimum cart value in cents

  -- Member restrictions
  member_tier VARCHAR(50), -- 'individual', 'organizational', 'student', 'lifetime'
  member_only BOOLEAN DEFAULT false,

  -- Validity period
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,

  -- Stripe integration
  stripe_coupon_id VARCHAR(255) UNIQUE,
  stripe_promotion_code_id VARCHAR(255) UNIQUE,

  -- Status
  active BOOLEAN NOT NULL DEFAULT true,

  -- Business metadata
  metadata JSONB DEFAULT '{}'::jsonb, -- {campaign: 'spring-promo', source: 'email'}

  -- Audit trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),

  CONSTRAINT valid_discount_value CHECK (
    (discount_type = 'percentage' AND discount_value <= 100) OR
    (discount_type = 'fixed_amount' AND discount_value > 0)
  ),
  CONSTRAINT valid_validity_period CHECK (
    valid_until IS NULL OR valid_until > valid_from
  ),
  CONSTRAINT valid_redemption_limits CHECK (
    max_redemptions IS NULL OR max_redemptions > 0
  )
);

CREATE INDEX idx_coupons_code ON coupons(code) WHERE active = true;
CREATE INDEX idx_coupons_active ON coupons(active, valid_from, valid_until);
CREATE INDEX idx_coupons_stripe_coupon_id ON coupons(stripe_coupon_id);

COMMENT ON TABLE coupons IS 'Promotional codes for marketing campaigns with flexible discount rules';

-- ============================================================================
-- COUPON_REDEMPTIONS TABLE
-- ============================================================================
-- Track coupon usage for analytics and fraud prevention
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,

  -- Redemption details
  discount_amount INTEGER NOT NULL, -- Actual discount applied in cents

  -- Session tracking (for guest checkout)
  session_id VARCHAR(255),

  -- Business metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Audit trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_coupon_redemptions_coupon_id ON coupon_redemptions(coupon_id);
CREATE INDEX idx_coupon_redemptions_member_id ON coupon_redemptions(member_id);
CREATE INDEX idx_coupon_redemptions_order_id ON coupon_redemptions(order_id);

COMMENT ON TABLE coupon_redemptions IS 'Coupon usage tracking for analytics and fraud prevention';

-- ============================================================================
-- WEBHOOK_EVENTS TABLE
-- ============================================================================
-- Stripe webhook event processing and idempotency
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Stripe event details
  stripe_event_id VARCHAR(255) UNIQUE NOT NULL, -- Ensures idempotency
  event_type VARCHAR(100) NOT NULL, -- 'payment_intent.succeeded', 'invoice.paid', etc.

  -- Event payload
  event_data JSONB NOT NULL, -- Full Stripe event object

  -- Processing status
  processing_status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (processing_status IN (
    'pending', 'processing', 'processed', 'failed', 'skipped'
  )),

  -- Error tracking
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Related entities (for quick lookup)
  related_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  related_subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  related_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,

  -- Business metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Audit trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_webhook_events_stripe_event_id ON webhook_events(stripe_event_id);
CREATE INDEX idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_processing_status ON webhook_events(processing_status);
CREATE INDEX idx_webhook_events_created_at ON webhook_events(created_at DESC);

COMMENT ON TABLE webhook_events IS 'Stripe webhook event processing with idempotency and error tracking';

-- ============================================================================
-- STRIPE_CUSTOMERS TABLE
-- ============================================================================
-- Map NABIP members to Stripe customer IDs for payment processing
CREATE TABLE IF NOT EXISTS stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID UNIQUE NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  -- Stripe customer details
  stripe_customer_id VARCHAR(255) UNIQUE NOT NULL,

  -- Customer metadata
  default_payment_method_id VARCHAR(255), -- Default payment method for subscriptions
  invoice_settings JSONB, -- Custom invoice settings

  -- Business metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Audit trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stripe_customers_member_id ON stripe_customers(member_id);
CREATE INDEX idx_stripe_customers_stripe_customer_id ON stripe_customers(stripe_customer_id);

COMMENT ON TABLE stripe_customers IS 'Map NABIP members to Stripe customer identifiers';

-- ============================================================================
-- AUTO-UPDATE TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamps
CREATE TRIGGER trigger_update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_prices_updated_at
  BEFORE UPDATE ON prices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_carts_updated_at
  BEFORE UPDATE ON carts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_order_items_updated_at
  BEFORE UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_refunds_updated_at
  BEFORE UPDATE ON refunds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_webhook_events_updated_at
  BEFORE UPDATE ON webhook_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_stripe_customers_updated_at
  BEFORE UPDATE ON stripe_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
