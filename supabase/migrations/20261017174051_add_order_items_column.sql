/*
# Add order_items column to orders

1. Modified Tables
- `orders`
- `order_items` (jsonb, nullable) — array of line items for combined cart orders:
  [{ title, variant, size, qty, price }]. Null for single-product orders.

2. Security
- No policy changes; column inherits the table's existing RLS policies.
*/

ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_items jsonb;