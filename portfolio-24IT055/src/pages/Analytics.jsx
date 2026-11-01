import React, { useState, useEffect, Suspense } from 'react';
import { lazyWithDelay } from '../utils/lazyWithDelay';
import LoadingFallback from '../components/LoadingFallback';

// Supplementary Problem (a): Lazy load heavy third-party chart component
const TaskChart = lazyWithDelay(() => import('../components/TaskChart'), 300);

export default function Analytics() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Read cached tasks from localStorage or token
    const saved = localStorage.getItem('tasks_cache');
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        // fallback
      }
    }

    // Also attempt fetching from backend API if token is present
    const token = localStorage.getItem('token');
    if (token) {
      fetch('http://localhost:3000/api/tasks', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data)) {
            setTasks(data);
            localStorage.setItem('tasks_cache', JSON.stringify(data));
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      // Demo dataset if unauthenticated
      setTasks([
        { _id: '1', title: 'Complete Practical 8 React Code Splitting', completed: true },
        { _id: '2', title: 'Measure Bundle Sizes with Vite & Puppeteer', completed: true },
        { _id: '3', title: 'Generate Lab Report 24IT055-PR-8.docx', completed: false },
        { _id: '4', title: 'Push git commits to GitHub repo', completed: false }
      ]);
      setLoading(false);
    }
  }, []);

  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const stats = { total, completed, pending };

  return (
    <div className="analytics-container" style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊 Task Analytics & Statistics</h1>
        <p style={{ opacity: 0.8 }}>
          Performance-optimized dashboard with heavy Recharts charting loaded purely on demand.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem'
        }}
      >
        <div style={{ padding: '1.25rem', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid #6366f1', textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>Total Tasks</h3>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', fontWeight: 700, color: '#6366f1' }}>{total}</p>
        </div>

        <div style={{ padding: '1.25rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>Completed</h3>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>{completed}</p>
        </div>

        <div style={{ padding: '1.25rem', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>Pending</h3>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', fontWeight: 700, color: '#f59e0b' }}>{pending}</p>
        </div>
      </div>

      {loading ? (
        <LoadingFallback message="Loading analytics data..." />
      ) : (
        <Suspense fallback={<LoadingFallback message="Loading Recharts visualizer chunk..." />}>
          <TaskChart stats={stats} />
        </Suspense>
      )}
    </div>
  );
}

