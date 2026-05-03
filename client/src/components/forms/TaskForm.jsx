import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getProjectsApi } from '../../api/projects';
import { getUsersBasicApi } from '../../api/users'; // ✅ FIXED — was getUsersApi (admin only)
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';

const TaskForm = ({ initial = {}, onSubmit, loading, onCancel, fixedProjectId }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title:       initial.title                          || '',
    description: initial.description                   || '',
    project:     initial.project?._id || initial.project || fixedProjectId || '',
    assignee:    initial.assignee?._id || initial.assignee || '',
    status:      initial.status   || 'todo',
    priority:    initial.priority || 'medium',
    dueDate:     initial.dueDate  ? initial.dueDate.split('T')[0] : ''
  });
  const [errors,      setErrors]      = useState({});
  const [projects,    setProjects]    = useState([]);
  const [users,       setUsers]       = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  const isEditing      = !!initial._id;
  const isAssigneeOnly =
    isEditing &&
    user?.role !== 'admin' &&
    initial.assignee?._id === user?._id &&
    initial.createdBy?._id !== user?._id;

  useEffect(() => {
    Promise.all([
      getProjectsApi(),
      getUsersBasicApi()   // ✅ works for ALL roles
    ])
      .then(([pRes, uRes]) => {
        setProjects(pRes.data);
        setUsers(uRes.data);
      })
      .catch(err => console.error('TaskForm data load error:', err))
      .finally(() => setDataLoading(false));
  }, []);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors(er => ({ ...er, [e.target.name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.project)      errs.project = 'Project is required';
    if (Object.keys(errs).length) return setErrors(errs);
    const payload = isAssigneeOnly
      ? { status: form.status }
      : { ...form, assignee: form.assignee || null, dueDate: form.dueDate || null };
    onSubmit(payload);
  };

  if (dataLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
      <Spinner />
    </div>
  );

  /* ── styles ── */
  const fieldWrap  = { marginBottom: 16 };
  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 600,
    color: 'rgba(148,163,184,0.65)', marginBottom: 6,
    letterSpacing: '0.06em', textTransform: 'uppercase'
  };
  const inputBase = {
    width: '100%', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
    padding: '10px 13px', fontSize: 13, color: '#e2e8f0',
    background: 'rgba(255,255,255,0.05)', outline: 'none',
    fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s', boxSizing: 'border-box'
  };
  const inputErr  = { ...inputBase, border: '1px solid rgba(244,63,94,0.5)', background: 'rgba(244,63,94,0.05)' };
  const errText   = { fontSize: 11, color: '#f87171', marginTop: 4 };

  const inp = (field) => ({
    ...( errors[field] ? inputErr : inputBase ),
    onFocus: e => { e.target.style.borderColor = 'rgba(99,102,241,0.6)'; e.target.style.background = 'rgba(99,102,241,0.06)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; },
    onBlur:  e => { e.target.style.borderColor = errors[field] ? 'rgba(244,63,94,0.5)' : 'rgba(255,255,255,0.1)'; e.target.style.background = errors[field] ? 'rgba(244,63,94,0.05)' : 'rgba(255,255,255,0.05)'; e.target.style.boxShadow = 'none'; }
  });

  return (
    <form onSubmit={handleSubmit}>
      {!isAssigneeOnly && (
        <>
          {/* Title */}
          <div style={fieldWrap}>
            <label style={labelStyle}>Title *</label>
            <input name="title" value={form.title} onChange={handleChange}
              placeholder="What needs to be done?" style={inp('title').style || inputBase}
              {...inp('title')} />
            {errors.title && <p style={errText}>{errors.title}</p>}
          </div>

          {/* Description */}
          <div style={fieldWrap}>
            <label style={labelStyle}>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange}
              placeholder="Add more details..." rows={3}
              style={{ ...inputBase, resize: 'none', lineHeight: 1.6 }}
              onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.6)'; e.target.style.background = 'rgba(99,102,241,0.06)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
              onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.05)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Project + Assignee */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Project *</label>
              <select name="project" value={form.project} onChange={handleChange}
                disabled={!!fixedProjectId}
                style={{ ...inputBase, cursor: fixedProjectId ? 'not-allowed' : 'pointer', opacity: fixedProjectId ? 0.6 : 1 }}
                onFocus={e => { if (!fixedProjectId) { e.target.style.borderColor = 'rgba(99,102,241,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}}
                onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
              >
                <option value="" style={{ background: '#1a1d27' }}>Select project</option>
                {projects.map(p => (
                  <option key={p._id} value={p._id} style={{ background: '#1a1d27' }}>{p.name}</option>
                ))}
              </select>
              {errors.project && <p style={errText}>{errors.project}</p>}
            </div>

            <div>
              <label style={labelStyle}>
                Assignee
                {users.length === 0 && <span style={{ color: '#f87171', marginLeft: 4 }}>(no users found)</span>}
              </label>
              <select name="assignee" value={form.assignee} onChange={handleChange}
                style={{ ...inputBase, cursor: 'pointer' }}
                onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
                onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
              >
                <option value="" style={{ background: '#1a1d27' }}>Unassigned</option>
                {users.map(u => (
                  <option key={u._id} value={u._id} style={{ background: '#1a1d27' }}>
                    {u.name} {u._id === user?._id ? '(you)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority + Due Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange}
                style={{ ...inputBase, cursor: 'pointer' }}
                onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
                onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
              >
                <option value="low"    style={{ background: '#1a1d27' }}>🟢 Low</option>
                <option value="medium" style={{ background: '#1a1d27' }}>🟡 Medium</option>
                <option value="high"   style={{ background: '#1a1d27' }}>🔴 High</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Due Date</label>
              <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange}
                style={{ ...inputBase, colorScheme: 'dark', cursor: 'pointer' }}
                onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
                onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>
        </>
      )}

      {/* Status — always visible */}
      <div style={fieldWrap}>
        <label style={labelStyle}>Status</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { val: 'todo',        label: 'To Do',       color: '#64748b', active: 'rgba(100,116,139,0.15)', border: 'rgba(100,116,139,0.4)' },
            { val: 'in_progress', label: 'In Progress', color: '#818cf8', active: 'rgba(99,102,241,0.15)',  border: 'rgba(99,102,241,0.5)'  },
            { val: 'done',        label: 'Done',        color: '#34d399', active: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.5)'  },
          ].map(s => (
            <button key={s.val} type="button"
              onClick={() => setForm(f => ({ ...f, status: s.val }))}
              style={{
                flex: 1, padding: '9px 8px', borderRadius: 10, border: '1px solid',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                fontFamily: "'DM Sans', sans-serif",
                background:   form.status === s.val ? s.active   : 'rgba(255,255,255,0.03)',
                borderColor:  form.status === s.val ? s.border   : 'rgba(255,255,255,0.08)',
                color:        form.status === s.val ? s.color    : 'rgba(148,163,184,0.5)',
                boxShadow:    form.status === s.val ? `0 0 12px ${s.color}22` : 'none'
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {isAssigneeOnly && (
        <div style={{
          background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 10, padding: '10px 14px', marginBottom: 16
        }}>
          <p style={{ fontSize: 12, color: 'rgba(129,140,248,0.8)', margin: 0 }}>
            As the assignee, you can only update the status of this task.
          </p>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>
          {isEditing ? 'Save Changes' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
};

export default TaskForm;