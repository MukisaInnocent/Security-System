'use client';

export default function OfflinePage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'var(--bg-primary)',
      textAlign: 'center',
    }}>
      <div>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📴</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>You&apos;re Offline</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Don&apos;t worry — your check-ins and incident reports are saved locally and will sync automatically when you&apos;re back online.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
