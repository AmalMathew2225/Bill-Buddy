-- Create bills table
CREATE TABLE IF NOT EXISTS public.bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant_name TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  date TIMESTAMPTZ DEFAULT now(),
  category TEXT DEFAULT 'General',
  receipt_url TEXT,
  stripe_payment_id TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "bills_select_own" ON public.bills
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "bills_insert_own" ON public.bills
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bills_update_own" ON public.bills
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "bills_delete_own" ON public.bills
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_bills_user_id ON public.bills(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_date ON public.bills(date DESC);
