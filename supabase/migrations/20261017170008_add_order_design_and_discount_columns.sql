/*
# Add design_sample and discount_amount columns to orders

1. Modified Tables
- `orders`
- `design_sample` (text, nullable) — public URL of the customer's uploaded design reference photo (neck design / sleeve style / inspiration image) for custom-measured orders.
- `discount_amount` (numeric, nullable, default 0) — rupees discounted by an applied promo code at checkout time.
- `promo_code` (text, nullable) — the promo code the customer applied, kept for order records.

2. Security
- No policy changes; columns inherit the table's existing RLS policies.

3. Notes
- Idempotent: columns are added only when missing.
- Values are written by the storefront at order placement and read by the Admin Panel and the PDF invoice.
*/

ALTER TABLE orders ADD COLUMN IF NOT EXISTS design_sample text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code text;