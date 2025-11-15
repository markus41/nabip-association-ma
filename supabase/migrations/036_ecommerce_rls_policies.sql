-- Migration: 036_ecommerce_rls_policies.sql
-- Description: Establish secure Row Level Security policies for eCommerce tables
-- Created: 2025-01-15
-- Purpose: Enable multi-tenant data access control to protect customer and payment data
--          while supporting public product browsing

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PRODUCTS TABLE POLICIES
-- ============================================================================

-- Public: View active products (supports public catalog browsing)
CREATE POLICY "Public can view active products"
  ON products FOR SELECT
  TO public
  USING (active = true);

-- Authenticated Members: View all products (including inactive for admins)
CREATE POLICY "Authenticated members can view all products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

-- Admin: Full control over product catalog
CREATE POLICY "Admins can manage products"
  ON products FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

COMMENT ON POLICY "Public can view active products" ON products IS
  'Enable public browsing of product catalog to drive engagement';

-- ============================================================================
-- PRICES TABLE POLICIES
-- ============================================================================

-- Public: View active prices for active products
CREATE POLICY "Public can view active prices"
  ON prices FOR SELECT
  TO public
  USING (
    active = true AND
    EXISTS (SELECT 1 FROM products WHERE products.id = prices.product_id AND products.active = true)
  );

-- Authenticated Members: View all prices (including member-only pricing)
CREATE POLICY "Authenticated members can view all prices"
  ON prices FOR SELECT
  TO authenticated
  USING (true);

-- Admin: Full control over pricing
CREATE POLICY "Admins can manage prices"
  ON prices FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- CARTS TABLE POLICIES
-- ============================================================================

-- Members: View and manage their own carts
CREATE POLICY "Members can view own carts"
  ON carts FOR SELECT
  TO authenticated
  USING (member_id = get_current_member_id());

CREATE POLICY "Members can create own carts"
  ON carts FOR INSERT
  TO authenticated
  WITH CHECK (member_id = get_current_member_id());

CREATE POLICY "Members can update own carts"
  ON carts FOR UPDATE
  TO authenticated
  USING (member_id = get_current_member_id())
  WITH CHECK (member_id = get_current_member_id());

CREATE POLICY "Members can delete own carts"
  ON carts FOR DELETE
  TO authenticated
  USING (member_id = get_current_member_id());

-- Admin: View all carts for customer service
CREATE POLICY "Admins can view all carts"
  ON carts FOR SELECT
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- CART_ITEMS TABLE POLICIES
-- ============================================================================

-- Members: Manage cart items for their own carts
CREATE POLICY "Members can view own cart items"
  ON cart_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
      AND carts.member_id = get_current_member_id()
    )
  );

CREATE POLICY "Members can create own cart items"
  ON cart_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
      AND carts.member_id = get_current_member_id()
    )
  );

CREATE POLICY "Members can update own cart items"
  ON cart_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
      AND carts.member_id = get_current_member_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
      AND carts.member_id = get_current_member_id()
    )
  );

CREATE POLICY "Members can delete own cart items"
  ON cart_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
      AND carts.member_id = get_current_member_id()
    )
  );

-- Admin: Full access for customer service
CREATE POLICY "Admins can manage all cart items"
  ON cart_items FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- ORDERS TABLE POLICIES
-- ============================================================================

-- Members: View own orders
CREATE POLICY "Members can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (member_id = get_current_member_id());

-- System: Create orders (via Stripe webhook or checkout process)
CREATE POLICY "Authenticated users can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (member_id = get_current_member_id() OR is_admin());

-- Admin: Full access to all orders
CREATE POLICY "Admins can manage all orders"
  ON orders FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

COMMENT ON POLICY "Members can view own orders" ON orders IS
  'Members can access order history for tracking and customer service';

-- ============================================================================
-- ORDER_ITEMS TABLE POLICIES
-- ============================================================================

-- Members: View order items for their own orders
CREATE POLICY "Members can view own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.member_id = get_current_member_id()
    )
  );

-- Admin: Full access to all order items
CREATE POLICY "Admins can manage all order items"
  ON order_items FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- PAYMENTS TABLE POLICIES
-- ============================================================================

-- Members: View payment records for their own orders
CREATE POLICY "Members can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payments.order_id
      AND orders.member_id = get_current_member_id()
    )
  );

-- Admin: Full access to all payment records
CREATE POLICY "Admins can manage all payments"
  ON payments FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

COMMENT ON POLICY "Members can view own payments" ON payments IS
  'Transparent payment tracking for customer confidence';

-- ============================================================================
-- REFUNDS TABLE POLICIES
-- ============================================================================

-- Members: View refunds for their own orders
CREATE POLICY "Members can view own refunds"
  ON refunds FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = refunds.order_id
      AND orders.member_id = get_current_member_id()
    )
  );

-- Admin: Full access to all refunds
CREATE POLICY "Admins can manage all refunds"
  ON refunds FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- SUBSCRIPTIONS TABLE POLICIES
-- ============================================================================

-- Members: View and manage their own subscriptions
CREATE POLICY "Members can view own subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (member_id = get_current_member_id());

CREATE POLICY "Members can create own subscriptions"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (member_id = get_current_member_id());

CREATE POLICY "Members can update own subscriptions"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (member_id = get_current_member_id())
  WITH CHECK (member_id = get_current_member_id());

-- Admin: Full access to all subscriptions
CREATE POLICY "Admins can manage all subscriptions"
  ON subscriptions FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

COMMENT ON POLICY "Members can view own subscriptions" ON subscriptions IS
  'Self-service subscription management for member autonomy';

-- ============================================================================
-- COUPONS TABLE POLICIES
-- ============================================================================

-- Public: View active coupons (for promotional landing pages)
CREATE POLICY "Public can view active coupons"
  ON coupons FOR SELECT
  TO public
  USING (
    active = true AND
    (valid_from IS NULL OR valid_from <= now()) AND
    (valid_until IS NULL OR valid_until >= now())
  );

-- Authenticated Members: View all active coupons
CREATE POLICY "Members can view active coupons"
  ON coupons FOR SELECT
  TO authenticated
  USING (active = true);

-- Admin: Full control over coupons
CREATE POLICY "Admins can manage coupons"
  ON coupons FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- COUPON_REDEMPTIONS TABLE POLICIES
-- ============================================================================

-- Members: View their own coupon redemptions
CREATE POLICY "Members can view own redemptions"
  ON coupon_redemptions FOR SELECT
  TO authenticated
  USING (member_id = get_current_member_id());

-- System: Create redemption records
CREATE POLICY "Authenticated users can create redemptions"
  ON coupon_redemptions FOR INSERT
  TO authenticated
  WITH CHECK (member_id = get_current_member_id() OR is_admin());

-- Admin: Full access to all redemptions
CREATE POLICY "Admins can manage all redemptions"
  ON coupon_redemptions FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- WEBHOOK_EVENTS TABLE POLICIES
-- ============================================================================

-- Admin only: Webhook events contain sensitive payment data
CREATE POLICY "Admins can view webhook events"
  ON webhook_events FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "System can create webhook events"
  ON webhook_events FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "System can update webhook events"
  ON webhook_events FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

COMMENT ON POLICY "Admins can view webhook events" ON webhook_events IS
  'Restrict access to sensitive payment webhook data';

-- ============================================================================
-- STRIPE_CUSTOMERS TABLE POLICIES
-- ============================================================================

-- Members: View their own Stripe customer record
CREATE POLICY "Members can view own stripe customer"
  ON stripe_customers FOR SELECT
  TO authenticated
  USING (member_id = get_current_member_id());

-- System: Create and update Stripe customer records
CREATE POLICY "System can create stripe customers"
  ON stripe_customers FOR INSERT
  TO authenticated
  WITH CHECK (member_id = get_current_member_id() OR is_admin());

CREATE POLICY "System can update stripe customers"
  ON stripe_customers FOR UPDATE
  TO authenticated
  USING (member_id = get_current_member_id() OR is_admin())
  WITH CHECK (member_id = get_current_member_id() OR is_admin());

-- Admin: Full access to all Stripe customer records
CREATE POLICY "Admins can manage all stripe customers"
  ON stripe_customers FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS POLICIES
-- ============================================================================

-- Check if current user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user has admin role in members table
  -- Adjust this logic based on your RBAC implementation
  RETURN EXISTS (
    SELECT 1
    FROM members
    WHERE id = get_current_member_id()
    AND (
      custom_fields->>'role' = 'admin' OR
      custom_fields->>'role' = 'national_admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_admin() IS
  'Determine if current user has administrative privileges for eCommerce management';
