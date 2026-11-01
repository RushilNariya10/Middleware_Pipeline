function Spinner({ message = 'Loading repositories from GitHub API...' }) {
  return (
    <div className="spinner-wrapper" role="status" aria-live="polite">
      <div className="spinner"></div>
      <p className="spinner-text">{message}</p>
    </div>
  )
}

export default Spinner
