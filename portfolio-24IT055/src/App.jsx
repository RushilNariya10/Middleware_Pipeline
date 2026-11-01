import { useState, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import NavBar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import LoadingFallback from './components/LoadingFallback'
import RouteErrorBoundary from './components/RouteErrorBoundary'
import lazyWithDelay from './utils/lazyWithDelay'
import './App.css'

// Route-level code splitting using lazyWithDelay (React.lazy with 300ms anti-flicker delay)
const Home = lazyWithDelay(() => import('./pages/Home'), 300)
const Projects = lazyWithDelay(() => import('./pages/Projects'), 300)
const Contact = lazyWithDelay(() => import('./pages/Contact'), 300)
const Login = lazyWithDelay(() => import('./pages/Login'), 300)
const Register = lazyWithDelay(() => import('./pages/Register'), 300)
const Tasks = lazyWithDelay(() => import('./pages/Tasks'), 300)
const Analytics = lazyWithDelay(() => import('./pages/Analytics'), 300)
const NotFound = lazyWithDelay(() => import('./pages/NotFound'), 300)

function App() {
  const [darkMode, setDarkMode] = useState(false)

  return (
    <AuthProvider>
      <div className={darkMode ? 'app-wrapper dark' : 'app-wrapper'}>
        <NavBar darkMode={darkMode} setDarkMode={setDarkMode} />
        {/* Error boundary catches dynamic chunk import failures */}
        <RouteErrorBoundary>
          {/* Suspense wraps ONLY the Routes block with an accessible loading fallback */}
          <Suspense fallback={<LoadingFallback message="Loading page..." />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route
                path="/tasks"
                element={
                  <ProtectedRoute>
                    <Tasks />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </RouteErrorBoundary>
      </div>
    </AuthProvider>
  )
}

export default App
