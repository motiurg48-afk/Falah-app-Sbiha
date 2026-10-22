ALTER TABLE orders ADD COLUMN IF NOT EXISTS gift_wrap boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gift_note text;