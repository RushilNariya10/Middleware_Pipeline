function ErrorMessage({ message, onRetry }) {
  return (
    <div className="error-card" role="alert">
      <div className="error-icon">⚠️</div>
      <div className="error-body">
        <h3 className="error-title">Failed to Load Repositories</h3>
        <p className="error-message">{message || 'An unexpected error occurred while fetching data.'}</p>
        {onRetry && (
          <button className="retry-btn" onClick={onRetry} type="button">
            ↻ Retry Request
          </button>
        )}
      </div>
    </div>
  )
}

export default ErrorMessage
