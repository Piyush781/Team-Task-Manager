import { useState, useEffect } from 'react';
import { getTasksApi, updateTaskApi, deleteTaskApi } from '../api/tasks';
import { getProjectsApi } from '../api/projects';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Layout from '../components/layout/Layout';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import TaskForm from '../components/forms/TaskForm';
import ConfirmDialog from '../components/ui/ConfirmDialog';

/* ── helpers ─────────────────────────────────────────────── */
const fmtDate   = d => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const isOverdue = t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done';

const STATUS_META = {
  todo:        { label: 'To Do',       dot: '#64748b', bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.3)', text: '#94a3b8' },
  in_progress: { label: 'In Progress', dot: '#6366f1', bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.3)',  text: '#a5b4fc' },
  done:        { label: 'Done',        dot: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)',  text: '#34d399' },
};
const PRIORITY_META = {
  low:    { label: 'Low',    bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.3)',  text: '#34d399', icon: '↓' },
  medium: { label: 'Medium', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.3)',  text: '#fbbf24', icon: '→' },
  high:   { label: 'High',   bg: 'rgba(244,63,94,0.12)',   border: 'rgba(244,63,94,0.3)',   text: '#f87171', icon: '↑' },
};

/* ── StatusBadge ─────────────────────────────────────────── */
const StatusBadge = ({ value }) => {
  const m = STATUS_META[value] || STATUS_META.todo;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
      background: m.bg, border: `1px solid ${m.border}`, color: m.text,
      whiteSpace: 'nowrap'
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.dot, display: 'inline-block', flexShrink: 0 }} />
      {m.label}
    </span>
  );
};

/* ── PriorityBadge ───────────────────────────────────────── */
const PriorityBadge = ({ value }) => {
  const m = PRIORITY_META[value] || PRIORITY_META.medium;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
      background: m.bg, border: `1px solid ${m.border}`, color: m.text,
      whiteSpace: 'nowrap'
    }}>
      {m.icon} {m.label}
    </span>
  );
};

/* ── AssigneeChip ────────────────────────────────────────── */
const AssigneeChip = ({ assignee }) => assignee ? (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <div style={{
      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg,#6366f1,#7c3aed)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 10, fontWeight: 700, color: '#fff'
    }}>{assignee.name.charAt(0).toUpperCase()}</div>
    <span style={{ fontSize: 12, color: 'rgba(148,163,184,0.8)', whiteSpace: 'nowrap' }}>{assignee.name}</span>
  </div>
) : (
  <span style={{ fontSize: 12, color: 'rgba(100,116,139,0.45)', fontStyle: 'italic' }}>Unassigned</span>
);

/* ── StatPill ────────────────────────────────────────────── */
const StatPill = ({ label, count, color, bg }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 16px', borderRadius: 12,
    background: bg, border: `1px solid ${color}30`
  }}>
    <span style={{ fontSize: 22, fontWeight: 800, color, fontFamily: "'Sora',sans-serif", lineHeight: 1 }}>{count}</span>
    <span style={{ fontSize: 11, color: `${color}99`, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
  </div>
);

/* ── main ────────────────────────────────────────────────── */
const TasksPage = () => {
  const { user }     = useAuth();
  const { addToast } = useToast();

  const [tasks,         setTasks]         = useState([]);
  const [projects,      setProjects]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [editingTask,   setEditingTask]   = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [submitting,    setSubmitting]    = useState(false);
  const [viewMode,      setViewMode]      = useState('table'); // 'table' | 'grid'
  const [filters, setFilters] = useState({ search: '', status: '', priority: '', projectId: '' });

  const fetchTasks = async (overrides) => {
    setLoading(true);
    try {
      const f = overrides || filters;
      const params = {};
      if (f.status)    params.status    = f.status;
      if (f.priority)  params.priority  = f.priority;
      if (f.projectId) params.projectId = f.projectId;
      if (f.search)    params.search    = f.search;
      const res = await getTasksApi(params);
      setTasks(res.data);
    } catch { addToast('Failed to load tasks', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTasks(); }, [filters.status, filters.priority, filters.projectId]);
  useEffect(() => { getProjectsApi().then(r => setProjects(r.data)).catch(() => {}); }, []);

  const handleFilterChange = (key, val) => setFilters(f => ({ ...f, [key]: val }));

  const handleSearchKeyDown = (e) => { if (e.key === 'Enter') fetchTasks(); };

  const clearFilters = () => {
    const reset = { search: '', status: '', priority: '', projectId: '' };
    setFilters(reset);
    fetchTasks(reset);
  };

  const handleUpdate = async (data) => {
    setSubmitting(true);
    try { await updateTaskApi(editingTask._id, data); addToast('Task updated!', 'success'); setEditingTask(null); fetchTasks(); }
    catch (err) { addToast(err.response?.data?.error || 'Failed to update', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try { await deleteTaskApi(confirmDelete); addToast('Task deleted', 'success'); setConfirmDelete(null); fetchTasks(); }
    catch (err) { addToast(err.response?.data?.error || 'Failed to delete', 'error'); }
    finally { setSubmitting(false); }
  };

  /* counts */
  const counts = { total: tasks.length, todo: 0, in_progress: 0, done: 0, overdue: 0 };
  tasks.forEach(t => {
    if (counts[t.status] !== undefined) counts[t.status]++;
    if (isOverdue(t)) counts.overdue++;
  });

  const hasActiveFilters = filters.search || filters.status || filters.priority || filters.projectId;

  /* ── shared input style ── */
  const inputStyle = {
    borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)',
    padding: '9px 13px', fontSize: 13, color: '#e2e8f0',
    background: 'rgba(255,255,255,0.04)', outline: 'none',
    fontFamily: "'DM Sans',sans-serif", transition: 'all 0.2s'
  };

  return (
    <Layout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        .task-row { display:contents; }
        .task-row-cells { display:table-row; cursor:pointer; transition:background 0.15s; }
        .task-row-cells:hover td { background:rgba(99,102,241,0.05) !important; }
        .task-row-cells.overdue-row:hover td { background:rgba(159,18,57,0.12) !important; }
        .filter-input:focus { border-color:rgba(99,102,241,0.5) !important; background:rgba(99,102,241,0.06) !important; box-shadow:0 0 0 3px rgba(99,102,241,0.1) !important; }
        .icon-btn:hover { background:rgba(255,255,255,0.08) !important; }
        .del-btn:hover { background:rgba(244,63,94,0.15) !important; color:#f43f5e !important; }
        .task-grid-card:hover { transform:translateY(-3px) !important; box-shadow:0 12px 32px rgba(0,0,0,0.4) !important; }
        .view-toggle-btn { padding:7px 10px;border-radius:8px;border:none;cursor:pointer;
          background:transparent;color:rgba(100,116,139,0.6);transition:all 0.18s;font-family:inherit; }
        .view-toggle-btn.active { background:rgba(99,102,241,0.15);color:#a5b4fc; }
        .view-toggle-btn:hover:not(.active) { background:rgba(255,255,255,0.05);color:#94a3b8; }
      `}</style>

      {/* ── Page Header ── */}
      <div style={{ marginBottom: 24, animation: 'fadeUp 0.4s both' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{
              fontFamily: "'Sora',sans-serif", fontSize: 24, fontWeight: 700,
              color: '#f1f5f9', margin: '0 0 4px'
            }}>Tasks</h1>
            <p style={{ fontSize: 13, color: 'rgba(100,116,139,0.7)', margin: 0 }}>
              Manage and track all your tasks across projects
            </p>
          </div>
          {/* View toggle */}
          <div style={{
            display: 'flex', gap: 2, padding: 4,
            background: 'rgba(0,0,0,0.3)', borderRadius: 10
          }}>
            <button className={`view-toggle-btn${viewMode === 'table' ? ' active' : ''}`}
              onClick={() => setViewMode('table')} title="Table view">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/>
              </svg>
            </button>
            <button className={`view-toggle-btn${viewMode === 'grid' ? ' active' : ''}`}
              onClick={() => setViewMode('grid')} title="Grid view">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Stat Pills ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 22, flexWrap: 'wrap', animation: 'fadeUp 0.4s 0.05s both' }}>
        <StatPill label="Total"       count={counts.total}       color="#818cf8" bg="rgba(99,102,241,0.08)"  />
        <StatPill label="To Do"       count={counts.todo}        color="#94a3b8" bg="rgba(100,116,139,0.08)" />
        <StatPill label="In Progress" count={counts.in_progress} color="#a5b4fc" bg="rgba(99,102,241,0.08)"  />
        <StatPill label="Done"        count={counts.done}        color="#34d399" bg="rgba(16,185,129,0.08)"  />
        {counts.overdue > 0 && (
          <StatPill label="Overdue"   count={counts.overdue}     color="#f87171" bg="rgba(244,63,94,0.08)"   />
        )}
      </div>

      {/* ── Filter Bar ── */}
      <div style={{
        display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap',
        padding: '14px 16px', borderRadius: 14,
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
        animation: 'fadeUp 0.4s 0.1s both'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(100,116,139,0.5)', pointerEvents: 'none' }}
            width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={filters.search}
            onChange={e => handleFilterChange('search', e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search tasks… (Enter)"
            className="filter-input"
            style={{ ...inputStyle, width: '100%', paddingLeft: 32, boxSizing: 'border-box' }}
          />
        </div>

        {/* Status */}
        <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)}
          className="filter-input"
          style={{ ...inputStyle, cursor: 'pointer', minWidth: 130 }}>
          <option value="" style={{ background: '#1a1d27' }}>All Statuses</option>
          <option value="todo"        style={{ background: '#1a1d27' }}>To Do</option>
          <option value="in_progress" style={{ background: '#1a1d27' }}>In Progress</option>
          <option value="done"        style={{ background: '#1a1d27' }}>Done</option>
        </select>

        {/* Priority */}
        <select value={filters.priority} onChange={e => handleFilterChange('priority', e.target.value)}
          className="filter-input"
          style={{ ...inputStyle, cursor: 'pointer', minWidth: 130 }}>
          <option value="" style={{ background: '#1a1d27' }}>All Priorities</option>
          <option value="low"    style={{ background: '#1a1d27' }}>↓ Low</option>
          <option value="medium" style={{ background: '#1a1d27' }}>→ Medium</option>
          <option value="high"   style={{ background: '#1a1d27' }}>↑ High</option>
        </select>

        {/* Project */}
        <select value={filters.projectId} onChange={e => handleFilterChange('projectId', e.target.value)}
          className="filter-input"
          style={{ ...inputStyle, cursor: 'pointer', minWidth: 150 }}>
          <option value="" style={{ background: '#1a1d27' }}>All Projects</option>
          {projects.map(p => (
            <option key={p._id} value={p._id} style={{ background: '#1a1d27' }}>{p.name}</option>
          ))}
        </select>

        {/* Clear */}
        {hasActiveFilters && (
          <button onClick={clearFilters} style={{
            padding: '9px 14px', borderRadius: 10, border: '1px solid rgba(244,63,94,0.25)',
            background: 'rgba(244,63,94,0.08)', color: '#f87171', fontSize: 12,
            fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
            whiteSpace: 'nowrap', transition: 'all 0.18s'
          }}>✕ Clear</button>
        )}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <Spinner size={32} />
        </div>

      ) : tasks.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '64px 24px', borderRadius: 16, textAlign: 'center',
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#94a3b8', margin: '0 0 6px', fontFamily: "'Sora',sans-serif" }}>
            {hasActiveFilters ? 'No tasks match your filters' : 'No tasks yet'}
          </h3>
          <p style={{ fontSize: 13, color: 'rgba(100,116,139,0.6)', margin: 0 }}>
            {hasActiveFilters ? 'Try adjusting or clearing your filters.' : 'Tasks will appear here once created.'}
          </p>
          {hasActiveFilters && (
            <button onClick={clearFilters} style={{
              marginTop: 16, padding: '8px 18px', borderRadius: 10, border: 'none',
              background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', fontSize: 13,
              fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif"
            }}>Clear Filters</button>
          )}
        </div>

      ) : viewMode === 'table' ? (
        /* ════════════════ TABLE VIEW ════════════════ */
        <div style={{
          borderRadius: 16, overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.07)',
          animation: 'fadeIn 0.3s both'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                {['Task', 'Project', 'Assignee', 'Priority', 'Status', 'Due Date', ''].map((h, i) => (
                  <th key={i} style={{
                    padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                    color: 'rgba(100,116,139,0.6)', letterSpacing: '0.08em', textTransform: 'uppercase',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    whiteSpace: 'nowrap'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, idx) => {
                const over = isOverdue(task);
                const rowBg = over
                  ? 'rgba(159,18,57,0.07)'
                  : idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)';

                return (
                  <tr key={task._id}
                    className={`task-row-cells${over ? ' overdue-row' : ''}`}
                    onClick={() => setEditingTask(task)}
                    style={{ borderLeft: over ? '3px solid #f43f5e' : '3px solid transparent' }}
                  >
                    {/* Title */}
                    <td style={{
                      padding: '13px 16px', background: rowBg,
                      borderBottom: '1px solid rgba(255,255,255,0.04)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                          background: STATUS_META[task.status]?.dot || '#64748b'
                        }} />
                        <div>
                          <div style={{
                            fontSize: 13, fontWeight: 600,
                            color: over ? '#fda4af' : '#e2e8f0',
                            maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                          }}>{task.title}</div>
                          {task.description && (
                            <div style={{
                              fontSize: 11, color: 'rgba(100,116,139,0.55)', marginTop: 1,
                              maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                            }}>{task.description}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Project */}
                    <td style={{ padding: '13px 16px', background: rowBg, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      {task.project ? (
                        <span style={{
                          fontSize: 12, padding: '3px 9px', borderRadius: 8,
                          background: 'rgba(99,102,241,0.1)', color: '#a5b4fc',
                          border: '1px solid rgba(99,102,241,0.2)', whiteSpace: 'nowrap'
                        }}>{task.project.name}</span>
                      ) : <span style={{ color: 'rgba(100,116,139,0.4)', fontSize: 12 }}>—</span>}
                    </td>

                    {/* Assignee */}
                    <td style={{ padding: '13px 16px', background: rowBg, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <AssigneeChip assignee={task.assignee} />
                    </td>

                    {/* Priority */}
                    <td style={{ padding: '13px 16px', background: rowBg, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <PriorityBadge value={task.priority} />
                    </td>

                    {/* Status */}
                    <td style={{ padding: '13px 16px', background: rowBg, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <StatusBadge value={task.status} />
                    </td>

                    {/* Due Date */}
                    <td style={{ padding: '13px 16px', background: rowBg, borderBottom: '1px solid rgba(255,255,255,0.04)', whiteSpace: 'nowrap' }}>
                      {task.dueDate ? (
                        <span style={{
                          fontSize: 12, fontWeight: over ? 700 : 400,
                          color: over ? '#f87171' : 'rgba(148,163,184,0.6)',
                          background: over ? 'rgba(244,63,94,0.08)' : 'transparent',
                          padding: over ? '2px 8px' : '0', borderRadius: 6
                        }}>
                          {over && '⚠ '}{fmtDate(task.dueDate)}
                        </span>
                      ) : <span style={{ color: 'rgba(100,116,139,0.4)', fontSize: 12 }}>No due date</span>}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '13px 12px', background: rowBg, borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {/* Edit */}
                        <button className="icon-btn" onClick={() => setEditingTask(task)} title="Edit" style={{
                          width: 30, height: 30, borderRadius: 8, border: 'none',
                          background: 'transparent', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'rgba(148,163,184,0.5)', transition: 'all 0.15s'
                        }}>
                          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        {/* Delete */}
                        <button className="icon-btn del-btn" onClick={() => setConfirmDelete(task._id)} title="Delete" style={{
                          width: 30, height: 30, borderRadius: 8, border: 'none',
                          background: 'transparent', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'rgba(148,163,184,0.5)', transition: 'all 0.15s'
                        }}>
                          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      ) : (
        /* ════════════════ GRID VIEW ════════════════ */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 14, animation: 'fadeIn 0.3s both'
        }}>
          {tasks.map(task => {
            const over = isOverdue(task);
            const sc   = STATUS_META[task.status]   || STATUS_META.todo;
            const pc   = PRIORITY_META[task.priority] || PRIORITY_META.medium;
            return (
              <div key={task._id}
                className="task-grid-card"
                onClick={() => setEditingTask(task)}
                style={{
                  borderRadius: 14, padding: '16px', cursor: 'pointer',
                  background: over ? 'rgba(159,18,57,0.08)' : 'rgba(255,255,255,0.03)',
                  border: over ? '1px solid rgba(244,63,94,0.25)' : '1px solid rgba(255,255,255,0.07)',
                  borderLeft: over ? '3px solid #f43f5e' : '1px solid rgba(255,255,255,0.07)',
                  position: 'relative', transition: 'all 0.2s'
                }}>
                {/* Delete */}
                <button onClick={e => { e.stopPropagation(); setConfirmDelete(task._id); }} style={{
                  position: 'absolute', top: 10, right: 10, width: 26, height: 26,
                  borderRadius: 7, border: 'none', background: 'transparent',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgba(100,116,139,0.4)', fontSize: 13, transition: 'all 0.15s', padding: 0
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.1)'; e.currentTarget.style.color = '#f43f5e'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(100,116,139,0.4)'; }}
                >✕</button>

                {/* Project tag */}
                {task.project && (
                  <div style={{ marginBottom: 10 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                      background: 'rgba(99,102,241,0.1)', color: '#818cf8',
                      border: '1px solid rgba(99,102,241,0.2)', letterSpacing: '0.04em'
                    }}>{task.project.name}</span>
                  </div>
                )}

                {/* Title */}
                <h3 style={{
                  fontSize: 14, fontWeight: 600, color: over ? '#fda4af' : '#e2e8f0',
                  margin: '0 24px 6px 0', lineHeight: 1.4, fontFamily: "'Sora',sans-serif"
                }}>{task.title}</h3>

                {/* Description */}
                {task.description && (
                  <p style={{
                    fontSize: 12, color: 'rgba(100,116,139,0.65)', margin: '0 0 12px',
                    lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden'
                  }}>{task.description}</p>
                )}

                {/* Badges */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                  <StatusBadge value={task.status} />
                  <PriorityBadge value={task.priority} />
                </div>

                {/* Footer */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <AssigneeChip assignee={task.assignee} />
                  {task.dueDate && (
                    <span style={{
                      fontSize: 11, fontWeight: over ? 700 : 500,
                      color: over ? '#f87171' : 'rgba(100,116,139,0.55)',
                      background: over ? 'rgba(244,63,94,0.08)' : 'transparent',
                      padding: over ? '2px 7px' : 0, borderRadius: 6
                    }}>
                      {over ? '⚠ ' : ''}{fmtDate(task.dueDate)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modals ── */}
      <Modal open={!!editingTask} onClose={() => setEditingTask(null)} title="Edit Task" maxWidth="max-w-xl">
        {editingTask && (
          <TaskForm initial={editingTask} onSubmit={handleUpdate}
            loading={submitting} onCancel={() => setEditingTask(null)} />
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete} onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete} loading={submitting}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
      />
    </Layout>
  );
};

export default TasksPage;