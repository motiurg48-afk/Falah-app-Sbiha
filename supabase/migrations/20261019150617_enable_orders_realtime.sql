/*
# Enable realtime notifications for orders

1. Changes
- Adds the `orders` table to the `supabase_realtime` publication so the admin
  dashboard is notified the moment a customer places an order (used to play the
  new-order chime).

2. Security
- No policy changes. Realtime delivery respects the existing row level security
  policies on `orders`.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;