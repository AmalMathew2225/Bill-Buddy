'use client';

export default function Home() {
  return (
    <main style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '2rem',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '2rem'
    }}>
      <h1 style={{ fontSize: '3rem', fontWeight: 'bold', textAlign: 'center' }}>
        Bill Buddy
      </h1>
      <p style={{ fontSize: '1.5rem', textAlign: 'center' }}>
        AI-Powered Receipt Manager
      </p>
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        padding: '2rem',
        borderRadius: '1rem',
        backdropFilter: 'blur(10px)',
        maxWidth: '600px',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Test Page Loaded Successfully!</h2>
        <p style={{ marginBottom: '1rem' }}>
          If you can see this, the app is rendering correctly.
        </p>
        <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
          Current time: {new Date().toLocaleTimeString()}
        </p>
        <a 
          href="/auth/login"
          style={{
            display: 'inline-block',
            marginTop: '1.5rem',
            padding: '0.75rem 2rem',
            background: 'white',
            color: '#667eea',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            fontWeight: '600',
            transition: 'transform 0.2s'
          }}
        >
          Go to Login
        </a>
      </div>
    </main>
  );
}
