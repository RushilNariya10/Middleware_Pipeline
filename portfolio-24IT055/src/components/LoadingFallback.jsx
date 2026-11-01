import React from 'react';

/**
 * LoadingFallback - Accessible loading placeholder for Suspense boundaries.
 * Styled to match the modern card/glassmorphism theme with accessible aria attributes.
 */
export default function LoadingFallback({ message = 'Loading page...' }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '1.25rem',
        padding: '2rem',
        color: 'inherit'
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          border: '4px solid rgba(99, 102, 241, 0.2)',
          borderTop: '4px solid #6366f1',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}
      />
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{message}</p>
        <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>
          Fetching component chunk on demand...
        </span>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

