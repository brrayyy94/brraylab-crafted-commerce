ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'cancelled';