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
  const supabase = createClient();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [error, setError] = useState(null);
  const [recents, setRecents] = useState([]);
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/auth/login');
        return;
      }
      setUser(user);
      await loadReceipts(user.id);
      setIsInitializing(false);
    };

    initializeUser();
  }, [router, supabase]);

  const loadReceipts = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false });
      
      if (error) throw error;
      setRecents(data || []);
    } catch (err) {
      console.error('Error loading receipts:', err);
      setError('Failed to load receipts');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const saveReceipt = async (data) => {
    if (!user) return;

    // Duplicate Detection Logic
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
      const { data: insertedData, error } = await supabase
        .from('receipts')
        .insert([{
          user_id: user.id,
          store_name: data.merchant,
          total_amount: parseFloat(data.total),
          items: data.items || [],
          wallet_data: data.walletData || null
        }])
        .select();

      if (error) throw error;

      setRecents([insertedData[0], ...recents]);
      setReceiptData(null);
      setFile(null);
    } catch (err) {
      console.error('Error saving receipt:', err);
      setError('Failed to save receipt');
    }
  };

  const deleteReceipt = async (id) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('receipts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      const newReceipts = recents.filter(r => r.id !== id);
      setRecents(newReceipts);
    } catch (err) {
      console.error('Error deleting receipt:', err);
      setError('Failed to delete receipt');
    }
  };

  const currentMonthTotal = recents.reduce((acc, curr) => {
    // robust parsing
    const amount = typeof curr.total_amount === 'number' ? curr.total_amount : parseFloat(curr.total_amount || 0);
    return acc + (isNaN(amount) ? 0 : amount);
  }, 0);

  if (isInitializing) {
    return (
      <main className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div className="spinner"></div>
        </div>
      </main>
    );
  }

  const handleFileSelect = async (selectedFile) => {
    setFile(selectedFile);
    setReceiptData(null);
    setError(null);

    if (selectedFile === 'manual') {
      const today = new Date().toISOString().split('T')[0];
      setReceiptData({
        merchant: '',
        date: today,
        total: 0,
        tax: 0,
        category: 'Uncategorized',
        items: []
      });
      return;
    }

    if (selectedFile) {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      try {
        const res = await fetch('/api/process-receipt', {
          method: 'POST',
          body: formData,
        });

        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to process receipt');
          setReceiptData({ ...data, id: Date.now() });
        } else {
          const text = await res.text();
          console.error("Non-JSON received:", text);
          throw new Error(`Server error: ${res.status} ${res.statusText}`);
        }
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

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

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem' }}>
        <section>
          <h2 style={{ marginBottom: '1rem', color: '#94a3b8', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Upload Receipt</h2>
          <UploadZone onFileSelect={handleFileSelect} />

          {recents.length > 0 && <InsightsChart receipts={recents} />}

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
                    onClick={() => {
                      console.log('Delete clicked for id:', r.id);
                      deleteReceipt(r.id);
                    }}
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
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      zIndex: 10
                    }}
                    title="Delete Receipt"
                    className="delete-btn"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
            {recents.length === 0 && <p style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.9rem' }}>No receipts yet.</p>}
          </div>
        </section>

        <section>
          {loading ? (
            <div className="glass-panel" style={{ minHeight: '400px', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: '1rem' }}>
              <div className="spinner"></div>
              <p>Analyzing receipt with Gemini 2.0 Flash...</p>
            </div>
          ) : error ? (
            <div className="glass-panel" style={{ minHeight: '400px', padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
              Error: {error}
            </div>
          ) : receiptData ? (
            <div className="glass-panel" style={{ padding: '2rem', animation: 'fadeIn 0.5s ease' }}>
              <ReceiptCard data={receiptData} onChange={setReceiptData} />
              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                <button onClick={() => saveReceipt(receiptData)} className="glass-button" style={{ flex: 1 }}>Confirm & Save</button>
                <button onClick={() => setReceiptData(null)} className="glass-button" style={{ flex: 1, background: 'rgba(255,255,255,0.1)' }}>Discard</button>
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ minHeight: '400px', padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', textAlign: 'center' }}>
              <div>
                <CreditCard size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <h3>Ready to Organize?</h3>
                <p style={{ marginTop: '0.5rem', maxWidth: '300px' }}>Upload a receipt to extract data, track spending, and generate wallet passes.</p>
              </div>
            </div>
          )}
        </section>
      </div>

    </main>
  );
}
