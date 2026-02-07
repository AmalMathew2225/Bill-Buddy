'use client';

import Link from 'next/link';

export default function SignUpSuccessPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0a',
      padding: '2rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '1rem',
        padding: '2rem',
        color: 'white',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Check Your Email
        </h1>
        <p style={{ color: '#94a3b8', marginBottom: '2rem', fontSize: '0.9rem' }}>
          We sent a confirmation link to your email. Please check your inbox and click the link to activate your account.
        </p>
        <Link
          href="/auth/login"
          style={{
            display: 'inline-block',
            padding: '0.75rem 2rem',
            background: '#6366f1',
            color: 'white',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '0.9rem'
          }}
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}
