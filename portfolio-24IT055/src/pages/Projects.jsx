import { useState, useEffect } from 'react'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import RepoList from '../components/RepoList'

function ProjectsPage() {
  // Step 1: 3 state variables for data, loading, and error
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Additional state for user controls & retry mechanism
  const [username, setUsername] = useState('RushilNariya')
  const [inputUsername, setInputUsername] = useState('RushilNariya')
  const [retryKey, setRetryKey] = useState(0)

  // Step 2: useEffect to fetch data when component mounts or username/retryKey changes
  useEffect(() => {
    let isMounted = true

    fetch(`https://api.github.com/users/${username}/repos?sort=updated`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error(`GitHub user "${username}" not found (404).`)
          } else if (res.status === 403) {
            throw new Error('GitHub API rate limit exceeded. Please try again later (403).')
          } else {
            throw new Error(`Failed to fetch repositories (HTTP ${res.status}: ${res.statusText})`)
          }
        }
        return res.json()
      })
      .then((data) => {
        if (isMounted) {
          if (Array.isArray(data)) {
            setRepos(data)
            setError(null)
          } else {
            throw new Error(data.message || 'Unexpected response format from GitHub API')
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to fetch repositories.')
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [username, retryKey])

  const handleUserSearch = (e) => {
    e.preventDefault()
    if (inputUsername.trim() && inputUsername.trim() !== username) {
      setLoading(true)
      setError(null)
      setUsername(inputUsername.trim())
    }
  }

  const handleRetry = () => {
    setLoading(true)
    setError(null)
    setRetryKey((prev) => prev + 1)
  }

  const triggerErrorTest = () => {
    setLoading(true)
    setError(null)
    setUsername('non-existent-user-error-test-404-xyz')
    setInputUsername('non-existent-user-error-test-404-xyz')
  }

  const resetToDefault = () => {
    setLoading(true)
    setError(null)
    setUsername('RushilNariya')
    setInputUsername('RushilNariya')
  }

  return (
    <div className="page">
      <div className="projects-header">
        <div>
          <h2 style={{ color: '#0d6efd', marginBottom: '0.3rem' }}>My GitHub Projects</h2>
          <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.95rem' }}>
            Live repositories dynamically fetched from GitHub REST API.
          </p>
        </div>

        {/* GitHub user switcher for testing & practical demonstration */}
        <form onSubmit={handleUserSearch} className="user-switch-form">
          <label htmlFor="gh-user-input" className="sr-only" style={{ fontSize: '0.85rem', color: '#666' }}>
            GitHub User:
          </label>
          <div className="user-input-group">
            <input
              id="gh-user-input"
              type="text"
              value={inputUsername}
              onChange={(e) => setInputUsername(e.target.value)}
              placeholder="GitHub username"
              className="user-input"
            />
            <button type="submit" className="user-btn">
              Fetch
            </button>
            <button
              type="button"
              onClick={triggerErrorTest}
              className="user-btn error-test-btn"
              title="Test error handling with an invalid user"
            >
              Test Error State
            </button>
            {username !== 'RushilNariya' && (
              <button
                type="button"
                onClick={resetToDefault}
                className="user-btn reset-btn"
                title="Reset to default username"
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Step 3: Conditional rendering based on loading, error, and success state */}
      {loading && <Spinner message={`Fetching repositories for @${username}...`} />}

      {!loading && error && (
        <ErrorMessage
          message={error}
          onRetry={handleRetry}
        />
      )}

      {!loading && !error && (
        <RepoList repos={repos} />
      )}
    </div>
  )
}

export default ProjectsPage