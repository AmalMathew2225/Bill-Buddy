import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error('[v0] Supabase environment variables not configured:', {
      hasUrl: !!url,
      hasKey: !!key
    })
    throw new Error('Supabase environment variables are not configured. Please check your .env.local file.')
  }

  return createBrowserClient(url, key)
}
