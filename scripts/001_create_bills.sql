-- Drop existing table if it exists to start fresh
DROP TABLE IF EXISTS public.bills CASCADE;

-- Create bills table
CREATE TABLE public.bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant_name TEXT NOT NULL DEFAULT 'Unknown',
  amount NUMERIC NOT NULL DEFAULT 0,
  bill_date DATE DEFAULT CURRENT_DATE,
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
