import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProjectApi, updateProjectApi, addMemberApi, removeMemberApi } from '../api/projects';
import { getTasksApi, createTaskApi, updateTaskApi, deleteTaskApi } from '../api/tasks';
import { getUsersBasicApi } from '../api/users';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Layout from '../components/layout/Layout';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import ProjectForm from '../components/forms/ProjectForm';
import TaskForm from '../components/forms/TaskForm';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';

/* ── helpers ───────────────────────────────────────────── */
const fmtDate   = d => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const isOverdue = t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done';

const priorityColors = {
  high:   { bg: 'rgba(244,63,94,0.12)',   border: 'rgba(244,63,94,0.3)',   text: '#f87171' },
  medium: { bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.3)',  text: '#fbbf24' },
  low:    { bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.3)',  text: '#34d399' },
};
const statusColors = {
  todo:        { bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.3)', text: '#94a3b8', dot: '#64748b' },
  in_progress: { bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.3)',  text: '#a5b4fc', dot: '#6366f1' },
  done:        { bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)',  text: '#34d399', dot: '#10b981' },
};
const statusLabel = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };

/* ── TaskCard ───────────────────────────────────────────── */
const TaskCard = ({ task, onClick, onDelete }) => {
  const over = isOverdue(task);
  const sc   = statusColors[task.status]   || statusColors.todo;
  const pc   = priorityColors[task.priority] || priorityColors.medium;

  return (
    <div onClick={onClick} style={{
      borderRadius: 14, padding: '16px', cursor: 'pointer',
      background: over ? 'rgba(159,18,57,0.08)' : 'rgba(255,255,255,0.03)',
      border: over ? '1px solid rgba(244,63,94,0.25)' : '1px solid rgba(255,255,255,0.07)',
      borderLeft: over ? '3px solid #f43f5e' : '1px solid rgba(255,255,255,0.07)',
      transition: 'all 0.2s', position: 'relative'
    }}
    onMouseEnter={e => { e.currentTarget.style.background = over ? 'rgba(159,18,57,0.12)' : 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = over ? 'rgba(159,18,57,0.08)' : 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Delete btn */}
      <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{
        position: 'absolute', top: 10, right: 10, width: 24, height: 24,
        borderRadius: 6, border: 'none', background: 'transparent',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(100,116,139,0.5)', fontSize: 14, transition: 'all 0.15s'
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.1)'; e.currentTarget.style.color = '#f43f5e'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(100,116,139,0.5)'; }}
      >✕</button>

      {/* Title */}
      <h3 style={{
        fontSize: 14, fontWeight: 600, color: over ? '#fda4af' : '#e2e8f0',
        margin: '0 24px 6px 0', lineHeight: 1.4,
        fontFamily: "'Sora', sans-serif"
      }}>{task.title}</h3>

      {/* Description */}
      {task.description && (
        <p style={{
          fontSize: 12, color: 'rgba(100,116,139,0.7)', margin: '0 0 12px',
          lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>{task.description}</p>
      )}

      {/* Badges */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
          background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text,
          display: 'flex', alignItems: 'center', gap: 5
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot, display: 'inline-block' }} />
          {statusLabel[task.status]}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
          background: pc.bg, border: `1px solid ${pc.border}`, color: pc.text
        }}>
          {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)}
        </span>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {task.assignee ? (
            <>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: 'linear-gradient(135deg,#6366f1,#7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: '#fff'
              }}>{task.assignee.name.charAt(0).toUpperCase()}</div>
              <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.7)' }}>{task.assignee.name}</span>
            </>
          ) : (
            <span style={{ fontSize: 11, color: 'rgba(100,116,139,0.5)', fontStyle: 'italic' }}>Unassigned</span>
          )}
        </div>
        {task.dueDate && (
          <span style={{
            fontSize: 11, fontWeight: 500,
            color: over ? '#f87171' : 'rgba(100,116,139,0.6)',
            background: over ? 'rgba(244,63,94,0.08)' : 'transparent',
            padding: over ? '2px 7px' : '0', borderRadius: 6
          }}>
            {over ? '⚠ ' : ''}{fmtDate(task.dueDate)}
          </span>
        )}
      </div>
    </div>
  );
};

/* ── MemberCard ─────────────────────────────────────────── */
const MemberCard = ({ member, isOwner, canRemove, onRemove }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
    borderRadius: 12, background: 'rgba(255,255,255,0.03)',
    border: isOwner ? '1px solid rgba(99,102,241,0.25)' : '1px solid rgba(255,255,255,0.07)',
    transition: 'all 0.15s'
  }}>
    <div style={{
      width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
      background: isOwner
        ? 'linear-gradient(135deg,#6366f1,#7c3aed)'
        : 'rgba(99,102,241,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 15, fontWeight: 700,
      color: isOwner ? '#fff' : '#a5b4fc',
      boxShadow: isOwner ? '0 0 16px rgba(99,102,241,0.3)' : 'none'
    }}>
      {member.name.charAt(0).toUpperCase()}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>{member.name}</div>
      <div style={{ fontSize: 12, color: 'rgba(100,116,139,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.email}</div>
    </div>
    {isOwner ? (
      <span style={{
        fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
        background: 'rgba(99,102,241,0.15)', color: '#818cf8',
        border: '1px solid rgba(99,102,241,0.3)', letterSpacing: '0.06em'
      }}>OWNER</span>
    ) : canRemove ? (
      <button onClick={onRemove} style={{
        fontSize: 12, padding: '5px 12px', borderRadius: 8,
        border: '1px solid rgba(244,63,94,0.2)', background: 'rgba(244,63,94,0.06)',
        color: 'rgba(244,63,94,0.7)', cursor: 'pointer', transition: 'all 0.15s',
        fontFamily: 'inherit', fontWeight: 500
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.15)'; e.currentTarget.style.color = '#f43f5e'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.4)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.06)'; e.currentTarget.style.color = 'rgba(244,63,94,0.7)'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.2)'; }}
      >Remove</button>
    ) : null}
  </div>
);

/* ── main page ──────────────────────────────────────────── */
const ProjectDetailPage = () => {
  const { id }       = useParams();
  const { user }     = useAuth();
  const { addToast } = useToast();
  const navigate     = useNavigate();

  const [project,       setProject]       = useState(null);
  const [tasks,         setTasks]         = useState([]);
  const [allUsers,      setAllUsers]       = useState([]);
  const [loading,       setLoading]        = useState(true);
  const [tab,           setTab]            = useState('tasks');
  const [statusFilter,  setStatusFilter]   = useState('all');
  const [editModal,     setEditModal]      = useState(false);
  const [taskModal,     setTaskModal]      = useState(false);
  const [editingTask,   setEditingTask]    = useState(null);
  const [confirmDelete, setConfirmDelete]  = useState(null);
  const [submitting,    setSubmitting]     = useState(false);
  const [addMemberId,   setAddMemberId]    = useState('');
  const [addingMember,  setAddingMember]   = useState(false);

  const fetchAll = async () => {
    try {
      const [pRes, tRes] = await Promise.all([
        getProjectApi(id),
        getTasksApi({ projectId: id })
      ]);
      setProject(pRes.data);
      setTasks(tRes.data);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to load project', 'error');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    getUsersBasicApi()
      .then(r => setAllUsers(r.data))
      .catch(() => addToast('Could not load user list', 'error'));
  }, [id]);

  const isOwner   = project?.owner?._id === user?._id;
  const canManage = user?.role === 'admin' || isOwner;

  const memberIds  = (project?.members || []).map(m => (m._id?.toString?.() || m._id));
  const nonMembers = allUsers.filter(u => !memberIds.includes(u._id?.toString?.() || u._id));

  /* task counts per status */
  const counts = { all: tasks.length, todo: 0, in_progress: 0, done: 0 };
  tasks.forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++; });

  const handleEditProject = async (data) => {
    setSubmitting(true);
    try { const res = await updateProjectApi(id, data); setProject(res.data); addToast('Project updated!', 'success'); setEditModal(false); }
    catch (err) { addToast(err.response?.data?.error || 'Failed to update', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleAddMember = async () => {
    if (!addMemberId) { addToast('Please select a member', 'error'); return; }
    setAddingMember(true);
    try { const res = await addMemberApi(id, addMemberId); setProject(res.data); setAddMemberId(''); addToast('Member added!', 'success'); }
    catch (err) { addToast(err.response?.data?.error || 'Failed to add member', 'error'); }
    finally { setAddingMember(false); }
  };

  const handleRemoveMember = async (userId) => {
    try { const res = await removeMemberApi(id, userId); setProject(res.data); addToast('Member removed', 'success'); }
    catch (err) { addToast(err.response?.data?.error || 'Failed to remove', 'error'); }
  };

  const handleCreateTask = async (data) => {
    setSubmitting(true);
    try { await createTaskApi({ ...data, project: id }); addToast('Task created!', 'success'); setTaskModal(false); fetchAll(); }
    catch (err) { addToast(err.response?.data?.error || 'Failed to create task', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleUpdateTask = async (data) => {
    setSubmitting(true);
    try { await updateTaskApi(editingTask._id, data); addToast('Task updated!', 'success'); setEditingTask(null); fetchAll(); }
    catch (err) { addToast(err.response?.data?.error || 'Failed to update', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleDeleteTask = async () => {
    setSubmitting(true);
    try { await deleteTaskApi(confirmDelete); addToast('Task deleted', 'success'); setConfirmDelete(null); fetchAll(); }
    catch (err) { addToast(err.response?.data?.error || 'Failed to delete', 'error'); }
    finally { setSubmitting(false); }
  };

  const filteredTasks = statusFilter === 'all' ? tasks : tasks.filter(t => t.status === statusFilter);

  if (loading) return <Layout><div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}><Spinner size={32} /></div></Layout>;

  return (
    <Layout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ── Back ── */}
      <button onClick={() => navigate('/projects')} style={{
        display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
        color: 'rgba(100,116,139,0.7)', fontSize: 13, cursor: 'pointer', marginBottom: 20,
        fontFamily: "'DM Sans',sans-serif", padding: 0, transition: 'color 0.15s'
      }}
      onMouseEnter={e => e.currentTarget.style.color = '#818cf8'}
      onMouseLeave={e => e.currentTarget.style.color = 'rgba(100,116,139,0.7)'}
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        Back to Projects
      </button>

      {/* ── Project Header ── */}
      <div style={{
        borderRadius: 18, padding: '24px 28px', marginBottom: 24,
        background: 'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.04))',
        border: '1px solid rgba(99,102,241,0.15)',
        animation: 'fadeUp 0.4s both'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flex: 1 }}>
            {/* Project icon */}
            <div style={{
              width: 52, height: 52, borderRadius: 14, flexShrink: 0,
              background: 'linear-gradient(135deg,#6366f1,#7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 800, color: '#fff',
              fontFamily: "'Sora',sans-serif",
              boxShadow: '0 0 24px rgba(99,102,241,0.4)'
            }}>
              {project?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 style={{
                fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px',
                fontFamily: "'Sora',sans-serif"
              }}>{project?.name}</h1>
              <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.7)', margin: '0 0 12px' }}>
                {project?.description || 'No description provided'}
              </p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {[
                  { icon: '👤', label: 'Owner', val: project?.owner?.name },
                  { icon: '📅', label: 'Created', val: fmtDate(project?.createdAt) },
                  { icon: '👥', label: 'Members', val: project?.members?.length || 0 },
                  { icon: '✓',  label: 'Tasks',   val: tasks.length },
                ].map(m => (
                  <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13 }}>{m.icon}</span>
                    <span style={{ fontSize: 12, color: 'rgba(100,116,139,0.6)' }}>{m.label}:</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>{m.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {canManage && (
            <button onClick={() => setEditModal(true)} style={{
              padding: '9px 18px', borderRadius: 10, border: '1px solid rgba(99,102,241,0.3)',
              background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', fontSize: 13,
              fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
              fontFamily: "'DM Sans',sans-serif", display: 'flex', alignItems: 'center', gap: 6
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.2)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit Project
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 24, padding: 4,
        background: 'rgba(0,0,0,0.3)', borderRadius: 12,
        width: 'fit-content', animation: 'fadeUp 0.4s 0.05s both'
      }}>
        {['tasks','members'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 20px', borderRadius: 9, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans',sans-serif",
            transition: 'all 0.2s',
            background: tab === t ? 'linear-gradient(135deg,#6366f1,#7c3aed)' : 'transparent',
            color: tab === t ? '#fff' : 'rgba(148,163,184,0.6)',
            boxShadow: tab === t ? '0 4px 16px rgba(99,102,241,0.35)' : 'none'
          }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
            <span style={{
              marginLeft: 6, fontSize: 11, fontWeight: 700,
              background: tab === t ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
              padding: '1px 7px', borderRadius: 10, color: tab === t ? '#fff' : 'rgba(148,163,184,0.5)'
            }}>
              {t === 'tasks' ? tasks.length : project?.members?.length || 0}
            </span>
          </button>
        ))}
      </div>

      {/* ── MEMBERS ── */}
      {tab === 'members' && (
        <div style={{ animation: 'fadeUp 0.4s both' }}>
          {canManage && (
            <div style={{
              borderRadius: 14, padding: '18px 20px', marginBottom: 20,
              background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)'
            }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(129,140,248,0.8)', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Add Team Member
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <select value={addMemberId} onChange={e => setAddMemberId(e.target.value)} style={{
                  flex: 1, borderRadius: 10, border: '1px solid rgba(99,102,241,0.25)',
                  padding: '10px 13px', fontSize: 13, color: '#e2e8f0',
                  background: 'rgba(255,255,255,0.05)', outline: 'none', cursor: 'pointer'
                }}>
                  <option value="" style={{ background: '#1a1d27' }}>
                    {nonMembers.length === 0 ? '— All users are already members —' : `Select user to add (${nonMembers.length} available)`}
                  </option>
                  {nonMembers.map(u => (
                    <option key={u._id} value={u._id} style={{ background: '#1a1d27' }}>
                      {u.name} — {u.email}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddMember}
                  disabled={!addMemberId || addingMember}
                  style={{
                    padding: '10px 20px', borderRadius: 10, border: 'none',
                    background: (!addMemberId || addingMember) ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg,#6366f1,#7c3aed)',
                    color: '#fff', fontSize: 13, fontWeight: 600, cursor: (!addMemberId || addingMember) ? 'not-allowed' : 'pointer',
                    fontFamily: "'DM Sans',sans-serif", whiteSpace: 'nowrap',
                    boxShadow: (!addMemberId || addingMember) ? 'none' : '0 4px 16px rgba(99,102,241,0.4)',
                    transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  {addingMember ? '...' : '+ Add Member'}
                </button>
              </div>
            </div>
          )}

          {project?.members?.length === 0 ? (
            <EmptyState icon="👥" title="No members yet" description="Add members to collaborate on this project." />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 10 }}>
              {project.members.map(member => {
                const mid = member._id?.toString?.() || member._id;
                const oid = project.owner._id?.toString?.() || project.owner._id;
                return (
                  <MemberCard key={mid} member={member}
                    isOwner={mid === oid} canRemove={canManage && mid !== oid}
                    onRemove={() => handleRemoveMember(mid)} />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TASKS ── */}
      {tab === 'tasks' && (
        <div style={{ animation: 'fadeUp 0.4s both' }}>
          {/* Filter bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: 4 }}>
              {['all','todo','in_progress','done'].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} style={{
                  padding: '7px 14px', borderRadius: 8, border: 'none',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
                  transition: 'all 0.18s',
                  background: statusFilter === s ? 'rgba(99,102,241,0.2)' : 'transparent',
                  color: statusFilter === s ? '#a5b4fc' : 'rgba(100,116,139,0.7)',
                  display: 'flex', alignItems: 'center', gap: 5
                }}>
                  {s === 'all' ? 'All' : s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
                  <span style={{
                    fontSize: 10, background: 'rgba(255,255,255,0.08)',
                    padding: '1px 6px', borderRadius: 8,
                    color: statusFilter === s ? '#a5b4fc' : 'rgba(100,116,139,0.5)'
                  }}>{counts[s]}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setTaskModal(true)} style={{
              padding: '9px 18px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
              boxShadow: '0 4px 16px rgba(99,102,241,0.4)', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 6
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.4)'; }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Task
            </button>
          </div>

          {filteredTasks.length === 0 ? (
            <EmptyState icon="✓" title="No tasks here"
              description={statusFilter === 'all' ? 'Create your first task for this project.' : `No ${statusFilter.replace('_',' ')} tasks.`} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
              {filteredTasks.map(task => (
                <TaskCard key={task._id} task={task}
                  onClick={() => setEditingTask(task)}
                  onDelete={() => setConfirmDelete(task._id)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title="Edit Project">
        <ProjectForm initial={project} onSubmit={handleEditProject} loading={submitting} onCancel={() => setEditModal(false)} />
      </Modal>

      <Modal open={taskModal} onClose={() => setTaskModal(false)} title="New Task" maxWidth="max-w-xl">
        <TaskForm fixedProjectId={id} onSubmit={handleCreateTask} loading={submitting} onCancel={() => setTaskModal(false)} />
      </Modal>

      <Modal open={!!editingTask} onClose={() => setEditingTask(null)} title="Edit Task" maxWidth="max-w-xl">
        {editingTask && (
          <TaskForm initial={editingTask} onSubmit={handleUpdateTask} loading={submitting} onCancel={() => setEditingTask(null)} />
        )}
      </Modal>

      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}
        onConfirm={handleDeleteTask} loading={submitting}
        title="Delete Task" message="Are you sure you want to delete this task? This cannot be undone." />
    </Layout>
  );
};

export default ProjectDetailPage;