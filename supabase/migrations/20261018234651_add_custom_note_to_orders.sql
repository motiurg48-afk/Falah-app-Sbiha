/*
# Add customization note to orders

1. Changed Tables
- `orders`
- `custom_note` (text, nullable) — customer's special instructions entered at order time, e.g. preferred color or custom measurements.
2. Notes
- Additive only: no existing columns or data are changed. Safe to re-run.
*/

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS custom_note text;