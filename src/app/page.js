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

  console.log("[v0] Home component rendered with state:", { isInitializing, supabase: !!supabase, user: user?.id });

  // Initialize Supabase client
  useEffect(() => {
    console.log("[v0] Supabase init effect starting");
    try {
      const client = createClient();
      console.log("[v0] createClient returned:", !!client);
      
      if (!client) {
        console.log("[v0] Supabase not configured, running in local mode");
        setSupabase(null);
        setIsInitializing(false);
        return;
      }
      setSupabase(client);
      console.log("[v0] Supabase client initialized successfully");
    } catch (err) {
      console.error("[v0] Supabase init error:", err.message);
      setSupabase(null);
      setIsInitializing(false);
    }
  }, []);

  // Initialize user session once supabase is ready
  useEffect(() => {
    console.log("[v0] User init effect - supabase state:", !!supabase, "isInitializing:", isInitializing);
    
    if (supabase === undefined) {
      console.log("[v0] Supabase still undefined, waiting...");
      return;
    }

    const initializeUser = async () => {
      try {
        console.log("[v0] Starting user initialization");
        
        if (!supabase) {
          console.log("[v0] No Supabase available, skipping auth check");
          setIsInitializing(false);
          return;
        }

        console.log("[v0] Checking authentication with Supabase...");
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        console.log("[v0] Auth result:", { authenticated: !!authUser, errorMsg: authError?.message });

        if (authError || !authUser) {
          console.log("[v0] No user authenticated - running in demo mode");
          setUser(null);
          setIsInitializing(false);
          return;
        }

        setUser(authUser);
        console.log("[v0] User authenticated:", authUser.id);

        // Load receipts from Supabase
        console.log("[v0] Loading receipts from database...");
        const { data, error: dbError } = await supabase
          .from('receipts')
          .select('*')
          .eq('user_id', authUser.id)
          .order('uploaded_at', { ascending: false });

        if (dbError) {
          console.error("[v0] Database error:", dbError.message);
          setError('Failed to load receipts');
        } else {
          console.log("[v0] Receipts loaded:", data?.length || 0);
          setRecents(data || []);
        }

        setIsInitializing(false);
        console.log("[v0] User initialization complete");
      } catch (err) {
        console.error("[v0] Initialization error:", err);
        setIsInitializing(false);
      }
    };

    if (supabase) {
      console.log("[v0] Calling initializeUser");
      initializeUser();
    } else {
      console.log("[v0] No supabase, setting isInitializing to false");
      setIsInitializing(false);
    }
  }, [supabase]);
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
    try {
      console.log("[v0] Saving receipt:", { merchant: data.merchant, total: data.total });
      
      // Add to local recents immediately for instant feedback
      const newReceipt = {
        id: Date.now().toString(),
        store_name: data.merchant,
        merchant: data.merchant,
        total_amount: parseFloat(data.total),
        total: parseFloat(data.total),
        date: data.date,
        category: data.category,
        items: data.items || [],
        uploaded_at: new Date().toISOString()
      };

      // If user is authenticated, save to database
      if (user && supabase) {
        const { error } = await supabase
          .from('receipts')
          .insert([{
            user_id: user.id,
            store_name: data.merchant,
            total_amount: parseFloat(data.total),
            items: data.items || [],
            wallet_data: data.walletData || null
          }]);

        if (error) throw error;
        console.log("[v0] Receipt saved to database");
      } else {
        console.log("[v0] No user authenticated - saving to local state only");
      }

      setRecents([newReceipt, ...recents]);
      setReceiptData(null);
      setFile(null);

      // Generate Google Wallet pass
      try {
        const walletResponse = await fetch('/api/create-wallet-pass', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            merchant: data.merchant,
            date: data.date,
            total: data.total,
            items: data.items,
            category: data.category
          })
        });

        if (walletResponse.ok) {
          const walletData = await walletResponse.json();
          if (walletData.saveUrl) {
            console.log("[v0] Google Wallet pass created");
            // Optionally auto-redirect to save (uncomment to enable):
            // window.open(walletData.saveUrl, '_blank');
          }
        } else {
          console.warn("[v0] Wallet pass creation failed");
        }
      } catch (walletError) {
        console.warn("[v0] Wallet pass error:", walletError.message);
      }

    } catch (err) {
      console.error("[v0] Save error:", err);
      setError('Failed to save receipt: ' + err.message);
    }
  };

  const deleteReceipt = (id) => {
    console.log("[v0] Deleting receipt:", id);
    const newReceipts = recents.filter(r => r.id !== id);
    setRecents(newReceipts);

    // If user is authenticated, also delete from database
    if (user && supabase) {
      supabase
        .from('receipts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .catch(err => console.error("[v0] Database delete failed:", err));
    }
  };

      if (deleteError) throw deleteError;

      setRecents(newReceipts.filter(r => r.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete receipt.');
    }
  };

  const currentMonthTotal = recents.reduce((acc, curr) => {
    const amount = typeof curr.total === 'number' ? curr.total : (typeof curr.total_amount === 'number' ? curr.total_amount : parseFloat(curr.total || curr.total_amount || 0));
    return acc + (isNaN(amount) ? 0 : amount);
  }, 0);

  // Loading state
  if (isInitializing) {
    console.log("[v0] Rendering loading state");
    return (
      <main className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p>Loading Bill Buddy...</p>
        </div>
      </main>
    );
  }

  console.log("[v0] Rendering main page - file:", !!file, "receiptData:", !!receiptData, "recents:", recents.length);
  
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
          {user && (
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
          )}
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        {/* Left Column - Upload & Processing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Upload Box Card */}
          <div style={{ padding: '0' }}>
            <UploadZone onFileSelect={handleFileSelect} />
          </div>

          {/* Analyze with AI Box */}
          {file && !receiptData && (
            <div 
              className="glass-panel" 
              style={{ 
                padding: '2rem', 
                textAlign: 'center',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                border: '2px solid rgba(139, 92, 246, 0.3)',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%)',
                transition: 'all 0.3s ease',
                transform: 'hover:scale(1.02)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.6)';
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
              }}
            >
              {/* Animated background */}
              <div style={{ 
                position: 'absolute', 
                inset: 0, 
                background: 'radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.1), transparent 50%)',
                pointerEvents: 'none',
                animation: 'pulse 4s ease-in-out infinite'
              }}></div>
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  margin: '0 auto 1rem',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Camera size={32} color="white" />
                </div>
                
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', fontWeight: '700' }}>
                  Analyze with AI
                </h3>
                <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                  Click to process your receipt using Gemini AI
                </p>
                
                <button
                  onClick={processReceipt}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '1rem 2rem',
                    fontSize: '1rem',
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.3s ease',
                    opacity: loading ? 0.7 : 1,
                    transform: loading ? 'scale(0.98)' : 'scale(1)'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {loading ? (
                    <>
                      <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Camera size={20} />
                      Start Analysis
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px', 
              color: '#ef4444', 
              fontSize: '0.9rem' 
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Receipt Card */}
          {receiptData && (
            <div>
              <ReceiptCard data={receiptData} onChange={setReceiptData} />
              <button
                onClick={() => saveReceipt(receiptData)}
                style={{ 
                  width: '100%', 
                  marginTop: '1rem', 
                  padding: '1rem', 
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                  color: '#fff', 
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <CreditCard size={18} />
                Save Receipt
              </button>
            </div>
          )}
        </div>

        {/* Right Column - Insights & Recents */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <InsightsChart receipts={recents} />

          <div>
            <h2 style={{ margin: '0 0 1rem', color: '#94a3b8', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Recent Receipts
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {recents.length === 0 ? (
                <div style={{ 
                  padding: '2rem',
                  textAlign: 'center',
                  color: '#64748b',
                  fontStyle: 'italic',
                  fontSize: '0.9rem',
                  background: 'rgba(30, 41, 59, 0.3)',
                  borderRadius: '8px',
                  border: '1px dashed rgba(148, 163, 184, 0.2)'
                }}>
                  No receipts yet. Upload one to get started.
                </div>
              ) : (
                recents.map(r => (
                  <div 
                    key={r.id} 
                    className="glass-panel" 
                    style={{ 
                      padding: '1rem', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
                      e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)';
                      e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.1)';
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{r.merchant}</div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                        {r.date}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ fontWeight: '700', color: 'var(--secondary)', fontSize: '1.1rem', minWidth: '80px', textAlign: 'right' }}>
                        ₹{Number(r.total).toFixed(2)}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
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
                          transition: 'all 0.2s ease'
                        }}
                        className="delete-btn"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
}
