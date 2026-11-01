import React, { Component } from 'react';

/**
 * RouteErrorBoundary - Catches chunk loading errors (e.g., dynamic import failures
 * when network drops or new deployment invalidates chunk hash) and offers a retry.
 */
export default class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Route chunk load failure caught by boundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            maxWidth: '560px',
            margin: '4rem auto',
            padding: '2rem',
            borderRadius: '12px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            background: 'rgba(239, 68, 68, 0.08)',
            textAlign: 'center',
            color: 'inherit'
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚠️</div>
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.4rem', color: '#ef4444' }}>
            Failed to Load Route Component
          </h2>
          <p style={{ margin: '0 0 1.25rem 0', opacity: 0.85, fontSize: '0.95rem' }}>
            A dynamic bundle chunk failed to download. This usually occurs when the network connection is lost or a newer build was deployed.
          </p>
          <button
            onClick={this.handleRetry}
            style={{
              padding: '0.65rem 1.4rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#6366f1',
              color: '#ffffff',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.95rem'
            }}
          >
            ↻ Retry / Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

