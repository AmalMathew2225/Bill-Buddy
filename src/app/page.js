'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    setMounted(true);
    console.log('[v0] Component mounted');
    setStatus('Component loaded successfully');
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <main className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Bill Buddy</h1>
        <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>{status}</p>
        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
          <p>The app is initializing. Please wait...</p>
        </div>
      </div>
    </main>
  );
}
