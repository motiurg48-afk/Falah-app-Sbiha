/*
# Add website service charge to orders

1. Changes
- `orders.service_charge` (integer, default 0): the website service charge billed
  on the order (Rs. 20 when the product subtotal is below Rs. 1000, otherwise 2%
  of the subtotal). Existing orders default to 0.

2. Security
- No policy changes.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'service_charge'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN service_charge integer NOT NULL DEFAULT 0;
  END IF;
END $$;