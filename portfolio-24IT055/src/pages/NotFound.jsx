import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="page not-found">
      <h2>404</h2>
      <p>Oops! The page you're looking for doesn't exist.</p>
      <Link to="/">← Go back to Home</Link>
    </div>
  )
}

export default NotFound