import React, { memo } from 'react';

/**
 * TaskItem - Individual task card.
 * Wrapped with React.memo so it only re-renders when its specific task data,
 * editing status, or priority callback changes, rather than re-rendering every
 * task in the list when the user types into the "Add Task" title/description inputs!
 */
const TaskItem = memo(function TaskItem({
  task,
  isEditing,
  editTitle,
  setEditTitle,
  editDescription,
  setEditDescription,
  editPriority,
  setEditPriority,
  editCompleted,
  setEditCompleted,
  handleUpdate,
  cancelEdit,
  startEdit,
  toggleComplete,
  handleDelete,
  priorityColor
}) {
  if (isEditing) {
    return (
      <div className="task-card">
        <div className="task-edit-form">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="task-input"
            placeholder="Title"
          />
          <input
            type="text"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className="task-input"
            placeholder="Description"
            style={{ marginTop: '0.4rem' }}
          />
          <div className="task-edit-controls">
            <select
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value)}
              className="task-select"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <input
                type="checkbox"
                checked={editCompleted}
                onChange={(e) => setEditCompleted(e.target.checked)}
              />
              Completed
            </label>
            <button onClick={() => handleUpdate(task._id)} className="task-save-btn">
              Save
            </button>
            <button onClick={cancelEdit} className="task-cancel-btn">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`task-card ${task.completed ? 'completed' : ''}`}>
      <div className="task-card-main">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => toggleComplete(task)}
          className="task-checkbox"
          title="Mark complete"
        />
        <div className="task-info">
          <span className={`task-title ${task.completed ? 'task-done' : ''}`}>
            {task.title}
          </span>
          {task.description && (
            <p className="task-desc">{task.description}</p>
          )}
        </div>
      </div>

      <div className="task-card-actions">
        <span
          className="task-priority-badge"
          style={{ backgroundColor: priorityColor(task.priority) }}
        >
          {task.priority}
        </span>
        <button
          onClick={() => startEdit(task)}
          className="task-action-btn edit-btn"
          title="Edit task"
        >
          ✏️
        </button>
        <button
          onClick={() => handleDelete(task._id)}
          className="task-action-btn delete-btn"
          title="Delete task"
        >
          🗑️
        </button>
      </div>
    </div>
  );
});

export default TaskItem;

