'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UploadZone from '@/components/UploadZone';
import ReceiptCard from '@/components/ReceiptCard';
import InsightsChart from '@/components/InsightsChart';
import { Camera, CreditCard, TrendingUp, Trash2, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function Home() {
  const router = useRouter();
  const [supabase, setSupabase] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [error, setError] = useState(null);
  const [recents, setRecents] = useState([]);
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    try {
      console.log('[v0] Initializing Supabase client...');
      const client = createClient();
      setSupabase(client);
      console.log('[v0] Supabase client created successfully');
    } catch (err) {
      console.error('[v0] Failed to create Supabase client:', err);
      setError('Failed to initialize authentication. Please refresh the page.');
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const initializeUser = async () => {
      try {
        console.log('[v0] Checking authentication status...');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        console.log('[v0] Auth result:', { userId: user?.id, error: authError?.message });
        
        if (authError || !user) {
          console.log('[v0] No authenticated user, redirecting to login');
          router.push('/auth/login');
          return;
        }
        
        console.log('[v0] User authenticated:', user.id);
        setUser(user);
        await loadReceipts(user.id);
        setIsInitializing(false);
      } catch (err) {
        console.error('[v0] Initialization error:', err);
        setError('Failed to load your account. Please try logging in again.');
        setIsInitializing(false);
        router.push('/auth/login');
      }
    };

    initializeUser();
  }, [supabase, router]);

  const loadReceipts = async (userId) => {
    if (!supabase) return;

    try {
      console.log('[v0] Loading receipts for user:', userId);
      const { data, error: loadError } = await supabase
        .from('receipts')
        .select('*')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false });
      
      if (loadError) {
        console.error('[v0] Error loading receipts:', loadError);
        throw loadError;
      }

      console.log('[v0] Loaded receipts:', data?.length || 0);
      setRecents(data || []);
    } catch (err) {
      console.error('[v0] Error loading receipts:', err);
      setError('Failed to load receipts');
    }
  };

  const handleLogout = async () => {
    if (!supabase) return;
    
    console.log('[v0] Logging out...');
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const handleFileSelect = async (selectedFile) => {
    setFile(selectedFile);
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      console.log('[v0] Processing receipt...');
      const res = await fetch('/api/process-receipt', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to process receipt');
      }

      const data = await res.json();
      console.log('[v0] Receipt processed:', data);
      
      const receiptObj = {
        id: Date.now().toString(),
        merchant: data.merchant || 'Unknown',
        date: data.date || new Date().toISOString().split('T')[0],
        total: parseFloat(data.total) || 0,
        tax: parseFloat(data.tax) || 0,
        category: data.category || 'Uncategorized',
        items: data.items || [],
      };

      setReceiptData(receiptObj);
    } catch (err) {
      console.error('[v0] Error processing receipt:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveReceipt = async (data) => {
    if (!user || !supabase) return;

    const isDuplicate = recents.some(r =>
      r.store_name === data.merchant &&
      Math.abs(parseFloat(r.total_amount) - parseFloat(data.total)) < 0.01
    );

    if (isDuplicate) {
      if (!confirm('This looks like a duplicate receipt. Do you want to save it anyway?')) {
        return;
      }
    }

    try {
      console.log('[v0] Saving receipt to database...');
      const { data: insertedData, error: insertError } = await supabase
        .from('receipts')
        .insert([{
          user_id: user.id,
          store_name: data.merchant,
          total_amount: parseFloat(data.total),
          items: data.items || [],
          wallet_data: null
        }])
        .select();

      if (insertError) throw insertError;

      console.log('[v0] Receipt saved:', insertedData[0].id);
      setRecents([insertedData[0], ...recents]);
      setReceiptData(null);
      setFile(null);
    } catch (err) {
      console.error('[v0] Error saving receipt:', err);
      setError('Failed to save receipt. Please try again.');
    }
  };

  const deleteReceipt = async (id) => {
    if (!user || !supabase) return;

    try {
      console.log('[v0] Deleting receipt:', id);
      const { error: deleteError } = await supabase
        .from('receipts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      console.log('[v0] Receipt deleted successfully');
      const newReceipts = recents.filter(r => r.id !== id);
      setRecents(newReceipts);
    } catch (err) {
      console.error('[v0] Error deleting receipt:', err);
      setError('Failed to delete receipt');
    }
  };

  const currentMonthTotal = recents.reduce((acc, curr) => {
    const amount = typeof curr.total_amount === 'number' ? curr.total_amount : parseFloat(curr.total_amount || 0);
    return acc + (isNaN(amount) ? 0 : amount);
  }, 0);

  if (isInitializing) {
    return (
      <main className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '1rem' }}>
          <div className="spinner"></div>
          <p style={{ color: '#94a3b8' }}>Loading Bill Buddy...</p>
        </div>
      </main>
    );
  }

  if (error && !user) {
    return (
      <main className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ color: '#ef4444', textAlign: 'center' }}>
            <p>{error}</p>
            <button
              onClick={() => router.push('/auth/login')}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer'
              }}
            >
              Go to Login
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '2rem 0',
        marginBottom: '2rem'
      }}>
        <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="title-gradient">BILL BUDDY</span>
          <span style={{ fontSize: '0.8rem', background: 'var(--card-border)', padding: '2px 8px', borderRadius: '12px', color: '#94a3b8' }}>AI AGENT</span>
        </h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.5rem' }}>
            <TrendingUp size={16} color="var(--secondary)" />
            <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Month:</span>
            <span style={{ fontWeight: 'bold' }}>₹{currentMonthTotal.toFixed(2)}</span>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              cursor: 'pointer',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem'
            }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div>
          <UploadZone onFileSelect={handleFileSelect} />

          {loading && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="spinner"></div>
              <p style={{ marginTop: '1rem', color: '#94a3b8' }}>Processing receipt...</p>
            </div>
          )}

          {error && (
            <div className="glass-panel" style={{ padding: '1rem', marginTop: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <p style={{ color: '#ef4444' }}>{error}</p>
            </div>
          )}

          {receiptData && <ReceiptCard data={receiptData} onSave={saveReceipt} />}

          <h2 style={{ margin: '2rem 0 1rem', color: '#94a3b8', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Recent</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recents.map(r => (
              <div key={r.id} className="glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{r.store_name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{new Date(r.uploaded_at).toLocaleDateString()}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--secondary)' }}>₹{Number(r.total_amount).toFixed(2)}</div>
                  <button
                    onClick={() => deleteReceipt(r.id)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                    title="Delete Receipt"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
            {recents.length === 0 && <p style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.9rem' }}>No receipts yet. Upload your first receipt above!</p>}
          </div>
        </div>

        <div>
          <InsightsChart receipts={recents} />
        </div>
      </div>
    </main>
  );
}
