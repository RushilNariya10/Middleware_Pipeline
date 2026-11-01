import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import TaskItem from '../components/TaskItem'

function Tasks() {
  const { authFetch, user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // New task form state (typing here re-rendered the parent Tasks page, which without memo re-renders every task item)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [formError, setFormError] = useState(null)

  // Practical 13 - AI description suggestion state
  const [aiLoading, setAiLoading] = useState(false)
  const [aiNotice, setAiNotice] = useState(null) // { type: 'success' | 'fallback', text?, priority? }
  const [descBeforeAi, setDescBeforeAi] = useState(null)

  // Edit mode state
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPriority, setEditPriority] = useState('medium')
  const [editCompleted, setEditCompleted] = useState(false)

  const fetchTasks = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await authFetch('/tasks')
      if (!res.ok) throw new Error('Failed to fetch tasks')
      const data = await res.json()
      setTasks(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  // Practical 13 - ask OUR backend for a suggestion (the AI key never reaches the browser).
  // Any failure degrades gracefully: a notice is shown and the form keeps working normally.
  const handleGenerateDescription = async () => {
    if (!title.trim()) {
      setFormError('Enter a task title first so the AI has something to work with.')
      return
    }
    setFormError(null)
    setAiNotice(null)
    setAiLoading(true)
    try {
      const res = await authFetch('/api/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      })
      const data = await res.json()
      if (!res.ok || data.fallback || !data.description) {
        setAiNotice({
          type: 'fallback',
          text: data.message || 'AI suggestions are unavailable right now. You can still write the description yourself.'
        })
      } else {
        setDescBeforeAi(description)
        setDescription(data.description)          // editable suggestion, not a final answer
        if (data.priority) setPriority(data.priority)
        setAiNotice({ type: 'success', priority: data.priority })
      }
    } catch (err) {
      if (err.message.startsWith('Session expired')) return
      setAiNotice({ type: 'fallback', text: 'AI suggestions are unavailable right now. You can still write the description yourself.' })
    } finally {
      setAiLoading(false)
    }
  }

  const discardAiSuggestion = () => {
    setDescription(descBeforeAi ?? '')
    setAiNotice(null)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setFormError(null)

    if (!title.trim()) {
      setFormError('Task title is required.')
      return
    }

    try {
      const res = await authFetch('/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, priority })
      })
      const data = await res.json()

      if (!res.ok) {
        setFormError(data.message || 'Failed to create task')
        return
      }

      setTasks(prev => [data, ...prev])
      setTitle('')
      setDescription('')
      setPriority('medium')
      setAiNotice(null)
    } catch (err) {
      setFormError(err.message)
    }
  }

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return
    try {
      const res = await authFetch(`/tasks/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message)
      }
      setTasks(prev => prev.filter(t => t._id !== id))
    } catch (err) {
      setError(err.message)
    }
  }, [authFetch])

  const startEdit = useCallback((task) => {
    setEditingId(task._id)
    setEditTitle(task.title)
    setEditDescription(task.description || '')
    setEditPriority(task.priority || 'medium')
    setEditCompleted(task.completed || false)
  }, [])

  const cancelEdit = useCallback(() => {
    setEditingId(null)
    setEditTitle('')
    setEditDescription('')
    setEditPriority('medium')
    setEditCompleted(false)
  }, [])

  const handleUpdate = useCallback(async (id) => {
    try {
      const res = await authFetch(`/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          priority: editPriority,
          completed: editCompleted
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      setTasks(prev => prev.map(t => t._id === id ? data : t))
      cancelEdit()
    } catch (err) {
      setError(err.message)
    }
  }, [authFetch, editTitle, editDescription, editPriority, editCompleted, cancelEdit])

  const toggleComplete = useCallback(async (task) => {
    try {
      const res = await authFetch(`/tasks/${task._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setTasks(prev => prev.map(t => t._id === task._id ? data : t))
    } catch (err) {
      setError(err.message)
    }
  }, [authFetch])

  const priorityColor = useCallback((p) => {
    switch (p) {
      case 'high': return '#dc3545'
      case 'medium': return '#fd7e14'
      case 'low': return '#28a745'
      default: return '#6c757d'
    }
  }, [])

  return (
    <div className="page">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ color: '#0d6efd', marginBottom: '0.3rem' }}>Task Manager</h2>
        <p style={{ color: '#666', fontSize: '0.92rem' }}>
          Logged in as <strong>{user?.email}</strong> — manage your tasks below.
        </p>
      </div>

      {/* ── Create Task Form ── */}
      <form onSubmit={handleCreate} className="task-form">
        <h3 style={{ margin: '0 0 0.8rem 0', fontSize: '1rem', color: '#333' }}>Add New Task</h3>
        {formError && <div className="auth-error">{formError}</div>}

        <div className="task-form-row">
          <input
            type="text"
            placeholder="Task title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="task-input"
            required
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="task-select"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
        </div>

        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="task-textarea"
          rows="2"
        />

        {/* Practical 13: AI suggestion controls */}
        <div className="ai-row">
          <button type="button" className="ai-btn" onClick={handleGenerateDescription} disabled={aiLoading}>
            ✨ Generate description
          </button>
          {aiLoading && <span className="ai-loading" role="status">Asking AI… the form still works while you wait.</span>}
        </div>
        {aiNotice?.type === 'success' && (
          <div className="ai-success" role="note">
            <strong>AI-generated suggestion</strong> — please review and edit before saving.
            {aiNotice.priority && <> Suggested priority: <b>{aiNotice.priority}</b>.</>}{' '}
            <button type="button" className="ai-link" onClick={discardAiSuggestion}>Discard</button>
          </div>
        )}
        {aiNotice?.type === 'fallback' && <div className="ai-fallback" role="alert">{aiNotice.text}</div>}

        <button type="submit" className="task-submit-btn">
          Add Task
        </button>
      </form>

      {/* ── Task List Section ── */}
      {loading && <Spinner message="Loading tasks..." />}
      {error && (
        <ErrorMessage
          message={error}
          onRetry={fetchTasks}
        />
      )}

      {!loading && !error && tasks.length === 0 && (
        <div className="empty-state">
          <p style={{ fontSize: '1.1rem' }}>📝</p>
          <p>No tasks yet. Create one above to get started!</p>
        </div>
      )}

      {!loading && !error && tasks.length > 0 && (
        <div className="task-list">
          <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.8rem' }}>
            {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </p>

          {tasks.map(task => (
            <TaskItem
              key={task._id}
              task={task}
              isEditing={editingId === task._id}
              editTitle={editTitle}
              setEditTitle={setEditTitle}
              editDescription={editDescription}
              setEditDescription={setEditDescription}
              editPriority={editPriority}
              setEditPriority={setEditPriority}
              editCompleted={editCompleted}
              setEditCompleted={setEditCompleted}
              handleUpdate={handleUpdate}
              cancelEdit={cancelEdit}
              startEdit={startEdit}
              toggleComplete={toggleComplete}
              handleDelete={handleDelete}
              priorityColor={priorityColor}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Tasks
