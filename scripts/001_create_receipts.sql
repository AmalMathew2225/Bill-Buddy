-- Create receipts table with user isolation
create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  store_name text not null,
  total_amount numeric(10, 2) not null,
  items jsonb default '[]'::jsonb,
  wallet_data jsonb,
  uploaded_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.receipts enable row level security;

-- Drop existing policies if they exist (to avoid conflicts)
drop policy if exists "Users can view their own receipts" on public.receipts;
drop policy if exists "Users can insert their own receipts" on public.receipts;
drop policy if exists "Users can update their own receipts" on public.receipts;
drop policy if exists "Users can delete their own receipts" on public.receipts;

-- Create RLS policies
create policy "Users can view their own receipts" on public.receipts
  for select using (auth.uid() = user_id);

create policy "Users can insert their own receipts" on public.receipts
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own receipts" on public.receipts
  for update using (auth.uid() = user_id);

create policy "Users can delete their own receipts" on public.receipts
  for delete using (auth.uid() = user_id);

-- Create index for faster queries
create index if not exists receipts_user_id_idx on public.receipts(user_id);
create index if not exists receipts_uploaded_at_idx on public.receipts(uploaded_at desc);

