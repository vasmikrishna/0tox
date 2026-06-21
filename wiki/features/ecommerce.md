# E-commerce (simple store)

WooCommerce-style store scoped **per tenant**. Onboard products, manage stock, and sell via a public storefront with Stripe checkout.

## Data model
- **products** — `name, slug, description, price, sale_price, sku, stock_quantity, manage_stock, status (draft|active|archived), image_url, images, category, sort_order`. Unique `(tenant_id, slug)`.
- **orders** — `customer_*, total, currency, status (pending|paid|fulfilled|cancelled|refunded), stripe_session_id, stripe_payment_intent_id, paid_at`.
- **order_items** — `order_id, product_id, name, price, quantity` (name/price are snapshots).
- **decrement_product_stock(p_product_id, p_qty)** — atomic, never below 0; called by the webhook on payment.

## Surfaces
| Area | Path |
|------|------|
| Admin products | `/admin/products` (+ `/[id]` edit) |
| Admin orders | `/admin/orders` (+ `/[id]` detail) |
| Storefront | `/shop`, `/shop/[slug]`, `/shop/cart` |
| Product APIs | `/api/admin/products`, `/api/admin/products/[id]` |
| Order API | `/api/admin/orders/[id]` |
| Checkout | `POST /api/store/checkout` |
| Webhook | `POST /api/payments/webhook` (handles `order_id` metadata) |

## Flow
1. Admin creates products (active + in stock to appear on the storefront).
2. Shopper adds to cart (client-side, `localStorage` key `0tox_cart`).
3. Cart → `POST /api/store/checkout`: prices/stock are **re-read from the DB** (client cart is never trusted), an order + items are created, and a Stripe Checkout session is started with `metadata.order_id`.
4. On `checkout.session.completed`, the webhook marks the order paid and decrements stock.
5. **No Stripe configured?** The checkout completes inline (order marked paid, stock decremented) so the flow is demoable in dev.

## Notes / future
- v1 excludes variants, discount codes, shipping/tax, and refunds UI.
- Images use a URL field; wire `src/lib/r2.ts` for uploads later.
