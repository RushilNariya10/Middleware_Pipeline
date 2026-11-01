import { useState } from 'react'

function RepoList({ repos = [] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedId, setSelectedId] = useState(null)

  const toggleDetails = (id) => {
    setSelectedId((prev) => (prev === id ? null : id))
  }

  const filteredRepos = repos.filter((repo) =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (repo.language && repo.language.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="repo-list-container">
      <div className="repo-search-bar">
        <input
          type="text"
          placeholder="🔍 Search repositories by name, language or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
          aria-label="Search repositories"
        />
        {searchTerm && (
          <button
            className="clear-search-btn"
            onClick={() => setSearchTerm('')}
            title="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      <div className="repo-count-badge">
        Showing {filteredRepos.length} of {repos.length} repositories
      </div>

      {filteredRepos.length === 0 ? (
        <div className="empty-state">
          <p>No repositories match your search "<strong>{searchTerm}</strong>".</p>
        </div>
      ) : (
        <div className="projects-grid">
          {filteredRepos.map((repo) => {
            const isExpanded = selectedId === repo.id
            return (
              <div
                key={repo.id}
                className={`project-card repo-card ${isExpanded ? 'expanded' : ''}`}
                onClick={() => toggleDetails(repo.id)}
              >
                <div className="repo-card-header">
                  <h3 className="repo-title">
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {repo.name}
                    </a>
                  </h3>
                  <span className="repo-stars" title="Stars">
                    ⭐ {repo.stargazers_count ?? 0}
                  </span>
                </div>

                <p className="repo-desc">
                  {repo.description || 'No description provided.'}
                </p>

                <div className="repo-tags">
                  {repo.language && (
                    <span className="repo-tag lang-tag">
                      {repo.language}
                    </span>
                  )}
                  {repo.fork && (
                    <span className="repo-tag fork-tag">
                      Forked
                    </span>
                  )}
                </div>

                {isExpanded && (
                  <div className="desc repo-extra-details">
                    <p><strong>Default Branch:</strong> {repo.default_branch || 'main'}</p>
                    <p><strong>Forks:</strong> {repo.forks_count ?? 0}</p>
                    {repo.updated_at && (
                      <p><strong>Last Updated:</strong> {new Date(repo.updated_at).toLocaleDateString()}</p>
                    )}
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="repo-link-btn"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View on GitHub ↗
                    </a>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default RepoList
