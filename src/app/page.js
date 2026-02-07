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
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [error, setError] = useState(null);
  const [recents, setRecents] = useState([]);
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [supabase, setSupabase] = useState(null);

  // Initialize Supabase client
  useEffect(() => {
    const client = createClient();
    if (!client) {
      setError('Supabase is not configured. Check environment variables.');
      setIsInitializing(false);
      return;
    }
    setSupabase(client);
  }, []);

  // Initialize user session once supabase is ready
  useEffect(() => {
    if (!supabase) return;

    const initializeUser = async () => {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
          router.push('/auth/login');
          return;
        }

        setUser(authUser);

        // Load receipts from Supabase
        const { data, error: dbError } = await supabase
          .from('receipts')
          .select('*')
          .eq('user_id', authUser.id)
          .order('uploaded_at', { ascending: false });

        if (dbError) {
          console.error('Error loading receipts:', dbError);
        } else {
          // Map DB fields to the format our components expect
          const mapped = (data || []).map(r => ({
            id: r.id,
            merchant: r.store_name,
            total: Number(r.total_amount),
            date: new Date(r.uploaded_at).toLocaleDateString(),
            items: r.items || [],
            category: 'General',
            tax: 0,
            walletData: r.wallet_data,
            _dbId: r.id
          }));
          setRecents(mapped);
        }
      } catch (err) {
        console.error('Init error:', err);
        setError('Failed to initialize. Please refresh.');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeUser();
  }, [supabase, router]);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push('/auth/login');
  };

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    setReceiptData(null);
    setError(null);

    if (selectedFile === 'manual') {
      setReceiptData({
        merchant: '',
        date: new Date().toISOString().split('T')[0],
        total: 0,
        tax: 0,
        category: 'General',
        items: [{ name: 'Item 1', price: 0 }]
      });
      setFile(null);
    }
  };

  const processReceipt = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/process-receipt', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      data.id = Date.now().toString();
      setReceiptData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveReceipt = async (data) => {
    if (!user || !supabase) return;

    // Duplicate Detection
    const isDuplicate = recents.some(r =>
      r.merchant === data.merchant &&
      Math.abs(r.total - data.total) < 0.01
    );

    if (isDuplicate) {
      if (!confirm('This looks like a duplicate receipt. Save anyway?')) {
        return;
      }
    }

    try {
      const { data: insertedData, error: insertError } = await supabase
        .from('receipts')
        .insert([{
          user_id: user.id,
          store_name: data.merchant,
          total_amount: parseFloat(data.total),
          items: data.items || [],
          wallet_data: data.walletData || null
        }])
        .select();

      if (insertError) throw insertError;

      const newReceipt = {
        id: insertedData[0].id,
        merchant: insertedData[0].store_name,
        total: Number(insertedData[0].total_amount),
        date: new Date(insertedData[0].uploaded_at).toLocaleDateString(),
        items: insertedData[0].items || [],
        category: data.category || 'General',
        tax: data.tax || 0,
        _dbId: insertedData[0].id
      };

      setRecents([newReceipt, ...recents]);
      setReceiptData(null);
      setFile(null);
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save receipt.');
    }
  };

  const deleteReceipt = async (id) => {
    if (!user || !supabase) return;

    try {
      const { error: deleteError } = await supabase
        .from('receipts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      setRecents(recents.filter(r => r.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete receipt.');
    }
  };

  const currentMonthTotal = recents.reduce((acc, curr) => {
    const amount = typeof curr.total === 'number' ? curr.total : parseFloat(curr.total || 0);
    return acc + (isNaN(amount) ? 0 : amount);
  }, 0);

  // Loading state
  if (isInitializing) {
    return (
      <main className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p>Loading Bill Buddy...</p>
        </div>
      </main>
    );
  }

  // Error state (no user)
  if (error && !user) {
    return (
      <main className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#ef4444', maxWidth: '400px' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>{error}</p>
          <a href="/auth/login" style={{ color: '#6366f1', textDecoration: 'underline' }}>Go to Login</a>
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
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="title-gradient">BILL BUDDY</span>
          <span style={{ fontSize: '0.8rem', background: 'var(--card-border)', padding: '2px 8px', borderRadius: '12px', color: '#94a3b8' }}>AI AGENT</span>
        </h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.5rem' }}>
            <TrendingUp size={16} color="var(--secondary)" />
            <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Month:</span>
            <span style={{ fontWeight: 'bold' }}>{'₹'}{currentMonthTotal.toFixed(2)}</span>
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

          {file && !receiptData && (
            <button
              onClick={processReceipt}
              disabled={loading}
              className="glass-button"
              style={{ width: '100%', marginTop: '1rem', padding: '1rem', justifyContent: 'center' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                  Processing with AI...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Camera size={18} /> Analyze Receipt
                </span>
              )}
            </button>
          )}

          {error && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', color: '#ef4444', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          {receiptData && (
            <div style={{ marginTop: '1rem' }}>
              <ReceiptCard data={receiptData} onChange={setReceiptData} />
              <button
                onClick={() => saveReceipt(receiptData)}
                className="glass-button"
                style={{ width: '100%', marginTop: '1rem', padding: '1rem', justifyContent: 'center', background: 'var(--primary)', color: '#fff', border: 'none' }}
              >
                <CreditCard size={18} style={{ marginRight: '0.5rem' }} />
                Save Receipt
              </button>
            </div>
          )}
        </div>

        <div>
          <InsightsChart receipts={recents} />

          <h2 style={{ margin: '2rem 0 1rem', color: '#94a3b8', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Recent</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recents.map(r => (
              <div key={r.id} className="glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{r.merchant}</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{r.date}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--secondary)' }}>{'₹'}{Number(r.total).toFixed(2)}</div>
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
                      justifyContent: 'center'
                    }}
                    className="delete-btn"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
            {recents.length === 0 && <p style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.9rem' }}>No receipts yet. Upload one to get started.</p>}
          </div>
        </div>
      </div>
    </main>
  );
}
