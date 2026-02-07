'use client';

import { useState, useEffect } from 'react';
import UploadZone from '@/components/UploadZone';
import ReceiptCard from '@/components/ReceiptCard';
import InsightsChart from '@/components/InsightsChart';
import { Camera, CreditCard, TrendingUp, Trash2 } from 'lucide-react';

export default function Home() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [error, setError] = useState(null);
  const [recents, setRecents] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('receipts');
      if (stored) {
        setRecents(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to parse receipts from localStorage:", e);
      // Clear corrupt data
      localStorage.removeItem('receipts');
    }
  }, []);

  const saveReceipt = (data) => {
    // Duplicate Detection Logic
    const isDuplicate = recents.some(r =>
      r.date === data.date &&
      Math.abs(r.total - data.total) < 0.01 &&
      r.merchant.toLowerCase() === data.merchant.toLowerCase()
    );

    if (isDuplicate) {
      if (!confirm('This looks like a duplicate receipt. Do you want to save it anyway?')) {
        return;
      }
    }

    const newReceipts = [data, ...recents];
    setRecents(newReceipts);
    localStorage.setItem('receipts', JSON.stringify(newReceipts));
    setReceiptData(null);
    setFile(null);
  };

  const deleteReceipt = (id) => {
    // Determine if we should use confirm or just delete
    // For now, removing confirm as it seems to be blocking for some users
    // if (confirm('Are you sure you want to delete this receipt?')) {
    const newReceipts = recents.filter(r => r.id !== id);
    setRecents(newReceipts);
    localStorage.setItem('receipts', JSON.stringify(newReceipts));
    // }
  };

  const currentMonthTotal = recents.reduce((acc, curr) => {
    // robust parsing
    const amount = typeof curr.total === 'number' ? curr.total : parseFloat(curr.total || 0);
    return acc + (isNaN(amount) ? 0 : amount);
  }, 0);

  const handleFileSelect = async (selectedFile) => {
    setFile(selectedFile);
    setReceiptData(null);
    setError(null);

    // Defensive check
    if (!selectedFile) return;

    if (selectedFile === 'manual') {
      const today = new Date().toISOString().split('T')[0];
      setReceiptData({
        merchant: 'New Merchant',
        date: today,
        total: 0,
        tax: 0,
        category: 'Uncategorized',
        items: []
      });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch('/api/process-receipt', {
        method: 'POST',
        body: formData,
      });

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) { // Safer check
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to process receipt');
        setReceiptData({ ...data, id: Date.now() });
      } else {
        const text = await res.text();
        console.error("Non-JSON received:", text);
        throw new Error(`Server returned ${res.status} ${res.statusText}. Please check server logs.`);
      }
    } catch (err) {
      console.error("Receipt processing error:", err);
      setError(err.message || "Failed to process receipt");

      // Fallback: Show mock data if things fail, so user isn't stuck
      console.warn("Using mock data as fallback due to error.");
      setReceiptData({
        merchant: "Mock Merchant (Fallback)",
        date: new Date().toISOString().split('T')[0],
        total: 99.99,
        tax: 5.00,
        category: "Fallback",
        items: [
          { description: "Item 1", price: 50.00 },
          { description: "Item 2", price: 49.99 }
        ],
        id: Date.now()
      });
    } finally {
      setLoading(false);
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
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.5rem' }}>
            <TrendingUp size={16} color="var(--secondary)" />
            <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Month:</span>
            <span style={{ fontWeight: 'bold' }}>₹{currentMonthTotal.toFixed(2)}</span>
          </div>
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
                  <div style={{ fontWeight: 600 }}>{r.merchant}</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{r.date} • {r.category}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--secondary)' }}>₹{Number(r.total).toFixed(2)}</div>
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
