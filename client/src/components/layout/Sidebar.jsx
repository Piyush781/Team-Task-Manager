import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>), label: 'Dashboard' },
  { to: '/projects', icon: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
    </svg>), label: 'Projects' },
  { to: '/tasks', icon: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
    </svg>), label: 'Tasks' },
];

const teamIcon = (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
);

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const initial = user?.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        .sidebar { position:fixed;left:0;top:0;height:100%;width:240px;display:flex;flex-direction:column;z-index:40;
          background:linear-gradient(180deg,#0d1117 0%,#0a0d14 100%);
          border-right:1px solid rgba(255,255,255,0.06); font-family:'DM Sans',sans-serif; }
        .sb-logo { padding:20px 20px 16px; border-bottom:1px solid rgba(255,255,255,0.05); }
        .sb-logo-inner { display:flex;align-items:center;gap:10px; }
        .sb-logo-icon { width:34px;height:34px;border-radius:10px;
          background:linear-gradient(135deg,#6366f1,#7c3aed);
          display:flex;align-items:center;justify-content:center;
          font-family:'Sora',sans-serif;font-weight:800;font-size:16px;color:#fff;
          box-shadow:0 0 20px rgba(99,102,241,0.4); flex-shrink:0; }
        .sb-logo-name { font-family:'Sora',sans-serif;font-weight:700;font-size:16px;
          background:linear-gradient(135deg,#fff 30%,rgba(148,163,184,0.8));
          -webkit-background-clip:text;-webkit-text-fill-color:transparent; }
        .sb-nav { flex:1;padding:12px 10px;overflow-y:auto; }
        .sb-section-label { font-size:10px;font-weight:600;color:rgba(100,116,139,0.6);
          letter-spacing:0.1em;text-transform:uppercase;padding:8px 10px 4px; }
        .sb-link { display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:10px;
          text-decoration:none;font-size:13.5px;font-weight:500;color:rgba(148,163,184,0.7);
          transition:all 0.18s;margin-bottom:2px;position:relative; }
        .sb-link:hover { color:#e2e8f0;background:rgba(255,255,255,0.05); }
        .sb-link.active { color:#a5b4fc;background:rgba(99,102,241,0.12);
          border-left:2px solid #6366f1;padding-left:10px; }
        .sb-link.active .sb-link-icon { color:#818cf8; }
        .sb-link-icon { flex-shrink:0;opacity:0.8; }
        .sb-link.active .sb-link-icon { opacity:1; }
        .sb-footer { padding:12px 10px;border-top:1px solid rgba(255,255,255,0.05); }
        .sb-user { display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;
          background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);margin-bottom:6px; }
        .sb-avatar { width:34px;height:34px;border-radius:50%;flex-shrink:0;
          background:linear-gradient(135deg,#6366f1,#7c3aed);
          display:flex;align-items:center;justify-content:center;
          font-weight:700;font-size:13px;color:#fff; }
        .sb-user-name { font-size:13px;font-weight:600;color:#e2e8f0;line-height:1.2; }
        .sb-user-role { font-size:11px;color:rgba(100,116,139,0.8);text-transform:capitalize; }
        .sb-logout { display:flex;align-items:center;gap:8px;width:100%;padding:9px 12px;
          border-radius:10px;border:none;background:transparent;cursor:pointer;
          font-size:13px;font-weight:500;color:rgba(100,116,139,0.7);font-family:'DM Sans',sans-serif;
          transition:all 0.18s; }
        .sb-logout:hover { color:#fda4af;background:rgba(244,63,94,0.08); }
      `}</style>

      <aside className="sidebar">
        <div className="sb-logo">
          <div className="sb-logo-inner">
            <div className="sb-logo-icon">T</div>
            <span className="sb-logo-name">TaskFlow</span>
          </div>
        </div>

        <nav className="sb-nav">
          <div className="sb-section-label">Main Menu</div>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) => `sb-link${isActive ? ' active' : ''}`}>
              <span className="sb-link-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <>
              <div className="sb-section-label" style={{ marginTop: 8 }}>Admin</div>
              <NavLink to="/team" className={({ isActive }) => `sb-link${isActive ? ' active' : ''}`}>
                <span className="sb-link-icon">{teamIcon}</span>
                Team
              </NavLink>
            </>
          )}
        </nav>

        <div className="sb-footer">
          <div className="sb-user">
            <div className="sb-avatar">{initial}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sb-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div className="sb-user-role">{user?.role}</div>
            </div>
            <div style={{
              fontSize: 10, padding: '3px 7px', borderRadius: 6,
              background: user?.role === 'admin' ? 'rgba(99,102,241,0.15)' : 'rgba(16,185,129,0.12)',
              color: user?.role === 'admin' ? '#818cf8' : '#34d399',
              fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', flexShrink: 0
            }}>{user?.role}</div>
          </div>
          <button className="sb-logout" onClick={handleLogout}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;