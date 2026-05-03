import { useState, useEffect } from 'react';
import { getDashboardApi } from '../api/dashboard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Layout from '../components/layout/Layout';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';

/* ── tiny helpers ─────────────────────────────────────── */
const isOverdue = (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done';
const fmtDate   = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';
const fmtTime   = (d) => d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';

/* ── stat card ────────────────────────────────────────── */
const StatCard = ({ label, value, icon, accent, delay = 0 }) => (
  <div style={{
    borderRadius: 16, padding: '20px 22px', position: 'relative', overflow: 'hidden',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
    border: '1px solid rgba(255,255,255,0.07)',
    animation: `fadeUp 0.5s ${delay}s both`,
    boxShadow: `0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)`
  }}>
    {/* glow blob */}
    <div style={{
      position: 'absolute', width: 100, height: 100, borderRadius: '50%', right: -20, top: -20,
      background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`, pointerEvents: 'none'
    }} />
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
      <div style={{
        width: 38, height: 38, borderRadius: 11,
        background: `linear-gradient(135deg, ${accent}25, ${accent}10)`,
        border: `1px solid ${accent}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>{icon}</div>
      <span style={{
        fontSize: 10, fontWeight: 600, color: 'rgba(100,116,139,0.7)',
        letterSpacing: '0.08em', textTransform: 'uppercase'
      }}>{label}</span>
    </div>
    <div style={{
      fontSize: 36, fontWeight: 800, fontFamily: "'Sora', sans-serif",
      background: `linear-gradient(135deg, #fff 30%, ${accent})`,
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      lineHeight: 1
    }}>{value ?? 0}</div>
  </div>
);

/* ── progress bar ─────────────────────────────────────── */
const ProgressBar = ({ todo, inProgress, done, total }) => {
  if (!total) return null;
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(148,163,184,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Task Progress</span>
        <span style={{ fontSize: 12, color: '#34d399', fontWeight: 600 }}>
          {Math.round((done / total) * 100)}% complete
        </span>
      </div>
      <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', display: 'flex' }}>
        <div style={{ width: `${(done / total) * 100}%`, background: 'linear-gradient(90deg,#10b981,#34d399)', transition: 'width 0.8s ease', borderRadius: 99 }} />
        <div style={{ width: `${(inProgress / total) * 100}%`, background: 'linear-gradient(90deg,#6366f1,#818cf8)', transition: 'width 0.8s ease' }} />
        <div style={{ width: `${(todo / total) * 100}%`, background: 'rgba(255,255,255,0.08)', transition: 'width 0.8s ease' }} />
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
        {[['#34d399','Done',done],['#818cf8','In Progress',inProgress],['rgba(148,163,184,0.4)','To Do',todo]].map(([c,l,v]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: 2, background: c }} />
            <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.6)' }}>{l} <strong style={{ color: 'rgba(226,232,240,0.9)' }}>{v}</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── section header ───────────────────────────────────── */
const SectionTitle = ({ children, count, accent = '#6366f1' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
    <span style={{
      fontSize: 11, fontWeight: 700, color: 'rgba(148,163,184,0.65)',
      letterSpacing: '0.1em', textTransform: 'uppercase'
    }}>{children}</span>
    {count !== undefined && (
      <span style={{
        fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
        background: `${accent}20`, color: accent, border: `1px solid ${accent}30`
      }}>{count}</span>
    )}
    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
  </div>
);

/* ── main ─────────────────────────────────────────────── */
const DashboardPage = () => {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const { user }            = useAuth();
  const { addToast }        = useToast();

  useEffect(() => {
    getDashboardApi()
      .then(r => setData(r.data))
      .catch(() => addToast('Failed to load dashboard', 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70vh' }}>
        <Spinner size={36} />
      </div>
    </Layout>
  );

  const ts   = data?.tasksByStatus || {};
  const total = data?.totalTasks || 0;

  return (
    <Layout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
        .db-card { border-radius:16px; padding:22px;
          background:linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02));
          border:1px solid rgba(255,255,255,0.07);
          box-shadow:0 4px 24px rgba(0,0,0,0.25),inset 0 1px 0 rgba(255,255,255,0.05); }
        .db-task-row { display:flex;align-items:center;gap:12px;padding:11px 14px;
          border-radius:10px;margin-bottom:4px;transition:background 0.15s;cursor:default;
          border:1px solid transparent; }
        .db-task-row:hover { background:rgba(255,255,255,0.04);border-color:rgba(255,255,255,0.06); }
        .db-task-row.overdue { background:rgba(159,18,57,0.07);border-color:rgba(244,63,94,0.15);border-left:2px solid #f43f5e; }
        .db-activity-row { display:flex;align-items:center;gap:12px;padding:10px 0;
          border-bottom:1px solid rgba(255,255,255,0.05); }
        .db-activity-row:last-child { border-bottom:none; }
        .db-overdue-card { padding:12px 14px;border-radius:10px;margin-bottom:6px;
          background:rgba(159,18,57,0.08);border:1px solid rgba(244,63,94,0.15);
          border-left:3px solid #f43f5e; }
        .db-empty { display:flex;flex-direction:column;align-items:center;justify-content:center;
          padding:40px 20px;text-align:center; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: 28, animation: 'fadeUp 0.4s both' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{
              fontFamily: "'Sora', sans-serif", fontSize: 24, fontWeight: 700,
              color: '#f1f5f9', margin: 0, lineHeight: 1.2
            }}>
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(100,116,139,0.8)', margin: '4px 0 0' }}>
              Here's what's happening with your projects today.
            </p>
          </div>
          <div style={{
            fontSize: 12, color: 'rgba(100,116,139,0.6)',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 8, padding: '6px 12px'
          }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard delay={0.05} label="Projects" value={data?.totalProjects}
          accent="#6366f1"
          icon={<svg width="18" height="18" fill="none" stroke="#6366f1" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>} />
        <StatCard delay={0.1} label="Total Tasks" value={data?.totalTasks}
          accent="#818cf8"
          icon={<svg width="18" height="18" fill="none" stroke="#818cf8" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 12l2 2 4-4"/></svg>} />
        <StatCard delay={0.15} label="Completed" value={ts.done}
          accent="#10b981"
          icon={<svg width="18" height="18" fill="none" stroke="#10b981" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>} />
        <StatCard delay={0.2} label="Overdue" value={data?.overdueTasks?.length}
          accent="#f43f5e"
          icon={<svg width="18" height="18" fill="none" stroke="#f43f5e" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>} />
      </div>

      {/* ── Progress bar ── */}
      {total > 0 && (
        <div className="db-card" style={{ marginBottom: 24, animation: 'fadeUp 0.5s 0.25s both' }}>
          <ProgressBar todo={ts.todo || 0} inProgress={ts.in_progress || 0} done={ts.done || 0} total={total} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {[
              { label: 'To Do', val: ts.todo || 0, color: 'rgba(148,163,184,0.5)', bg: 'rgba(148,163,184,0.06)' },
              { label: 'In Progress', val: ts.in_progress || 0, color: '#818cf8', bg: 'rgba(99,102,241,0.08)' },
              { label: 'Done', val: ts.done || 0, color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
            ].map(s => (
              <div key={s.label} style={{
                borderRadius: 10, padding: '12px 14px',
                background: s.bg, border: `1px solid ${s.color}20`,
                display: 'flex', alignItems: 'center', gap: 10
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'Sora',sans-serif" }}>{s.val}</div>
                <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.6)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Bottom grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

        {/* My Tasks */}
        <div className="db-card" style={{ animation: 'fadeUp 0.5s 0.3s both' }}>
          <SectionTitle count={data?.myTasks?.length}>My Tasks</SectionTitle>
          {!data?.myTasks?.length ? (
            <div className="db-empty">
              <div style={{ fontSize: 36, marginBottom: 8 }}>🎯</div>
              <p style={{ fontSize: 13, color: 'rgba(100,116,139,0.6)', margin: 0 }}>No tasks assigned to you</p>
            </div>
          ) : (
            data.myTasks.map((task, i) => {
              const over = isOverdue(task);
              return (
                <div key={task._id} className={`db-task-row${over ? ' overdue' : ''}`}
                  style={{ animationDelay: `${0.35 + i * 0.04}s` }}>
                  {/* status dot */}
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: task.status === 'done' ? '#10b981' : task.status === 'in_progress' ? '#6366f1' : 'rgba(148,163,184,0.4)'
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 500, color: over ? '#fda4af' : '#e2e8f0',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>{task.title}</div>
                    <div style={{ fontSize: 11, color: 'rgba(100,116,139,0.7)', marginTop: 1 }}>{task.project?.name}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                    <Badge type="priority" value={task.priority} />
                    <span style={{ fontSize: 10, color: over ? '#f43f5e' : 'rgba(100,116,139,0.6)', fontWeight: over ? 600 : 400 }}>
                      {fmtDate(task.dueDate)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Recent Activity */}
          <div className="db-card" style={{ animation: 'fadeUp 0.5s 0.35s both' }}>
            <SectionTitle count={data?.recentActivity?.length} accent="#818cf8">Recent Activity</SectionTitle>
            {!data?.recentActivity?.length ? (
              <div className="db-empty">
                <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
                <p style={{ fontSize: 13, color: 'rgba(100,116,139,0.6)', margin: 0 }}>No recent activity</p>
              </div>
            ) : (
              data.recentActivity.map((task, i) => (
                <div key={task._id} className="db-activity-row">
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: task.status === 'done' ? '#10b981' : task.status === 'in_progress' ? '#6366f1' : 'rgba(148,163,184,0.4)'
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                    <div style={{ fontSize: 11, color: 'rgba(100,116,139,0.6)', marginTop: 1 }}>{task.project?.name}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                    <Badge type="status" value={task.status} />
                    <span style={{ fontSize: 10, color: 'rgba(100,116,139,0.5)' }}>{fmtDate(task.updatedAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Overdue Tasks */}
          {data?.overdueTasks?.length > 0 && (
            <div className="db-card" style={{ animation: 'fadeUp 0.5s 0.4s both', borderColor: 'rgba(244,63,94,0.15)' }}>
              <SectionTitle count={data.overdueTasks.length} accent="#f43f5e">
                ⚠ Overdue
              </SectionTitle>
              {data.overdueTasks.map(task => (
                <div key={task._id} className="db-overdue-card">
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fda4af', marginBottom: 3 }}>{task.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: 'rgba(244,63,94,0.7)' }}>{task.project?.name}</span>
                    <span style={{ fontSize: 10, color: 'rgba(100,116,139,0.5)' }}>·</span>
                    <span style={{ fontSize: 11, color: '#f87171', fontWeight: 600 }}>Due {fmtDate(task.dueDate)}</span>
                    {task.assignee && (
                      <><span style={{ fontSize: 10, color: 'rgba(100,116,139,0.5)' }}>·</span>
                      <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.6)' }}>{task.assignee.name}</span></>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;