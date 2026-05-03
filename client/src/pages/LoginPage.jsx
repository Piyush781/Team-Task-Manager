import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginApi, signupApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';

const LoginPage = () => {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // ── Particle canvas ──────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const rand = (a, b) => Math.random() * (b - a) + a;
    const particles = Array.from({ length: 70 }, () => ({
      x: rand(0, canvas.width), y: rand(0, canvas.height),
      vx: rand(-0.2, 0.2), vy: rand(-0.35, -0.05),
      size: rand(1, 2.5), opacity: rand(0.1, 0.5),
      color: Math.random() > 0.5 ? '99,102,241' : '139,92,246',
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -5) { p.y = canvas.height + 5; p.x = rand(0, canvas.width); }
        if (p.x < -5) p.x = canvas.width + 5;
        if (p.x > canvas.width + 5) p.x = -5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.opacity})`;
        ctx.fill();
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 90) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99,102,241,${0.09 * (1 - d / 90)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  // ── Handlers ─────────────────────────────────────────────
  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors(er => ({ ...er, [e.target.name]: '', general: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const res = mode === 'login'
        ? await loginApi({ email: form.email, password: form.password })
        : await signupApi({ name: form.name, email: form.email, password: form.password });
      login(res.data.token, res.data.user);
      addToast(`Welcome, ${res.data.user.name}!`, 'success');
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        const errs = {};
        data.errors.forEach(e => { errs[e.field] = e.message; });
        setErrors(errs);
      } else {
        setErrors({ general: data?.error || 'Something went wrong' });
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m) => { setMode(m); setErrors({}); setForm({ name: '', email: '', password: '' }); };

  // ── Styles ───────────────────────────────────────────────
const inputBase = `
block w-full rounded-full
pl-6 pr-5 py-3.5
text-sm text-white
placeholder:text-slate-400
bg-gradient-to-r from-white/5 to-white/10
border border-white/10
shadow-inner
focus:outline-none focus:ring-2 focus:ring-indigo-500
transition-all duration-200
`;
  const inputClass = (field) =>
    `${inputBase} ${errors[field] 
      ? 'border-rose-500 focus:border-rose-400 focus:shadow-[0_0_0_3px_rgba(244,63,94,0.15)]'
      : 'border-white/10 focus:border-indigo-500 focus:bg-indigo-500/5 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)]'}`;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: '#070b14', fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Animated canvas background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 0 }}
      />

      {/* Ambient glow blobs */}
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%', zIndex: 1,
        background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
        top: -120, left: -120,
        animation: 'glowPulse1 7s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute', width: 380, height: 380, borderRadius: '50%', zIndex: 1,
        background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
        bottom: -80, right: -80,
        animation: 'glowPulse2 9s ease-in-out infinite'
      }} />

      {/* Card */}
      <div style={{
        position: 'relative', zIndex: 2, width: '100%', maxWidth: 420,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 24,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        padding: '2.5rem',
        animation: 'cardIn 0.7s cubic-bezier(0.16,1,0.3,1) both',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset'
      }}>

        {/* Logo */}
        <div style={{
          width: 56, height: 56, borderRadius: 16, margin: '0 auto 1rem',
          background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 22, color: '#fff',
          boxShadow: '0 0 36px rgba(99,102,241,0.55)',
          animation: 'logoIn 0.6s 0.15s cubic-bezier(0.16,1,0.3,1) both'
        }}>T</div>

        {/* Heading */}
        <h1 style={{
          fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 700,
          color: '#fff', textAlign: 'center', margin: '0 0 4px',
          animation: 'fadeUp 0.5s 0.25s both'
        }}>TaskFlow</h1>
        <p style={{
          fontSize: 13, color: 'rgba(148,163,184,0.75)', textAlign: 'center',
          margin: '0 0 1.5rem', animation: 'fadeUp 0.5s 0.3s both'
        }}>Team Tracker</p>

        {/* Feature pills */}
        {/* <div style={{
          display: 'flex', gap: 10, marginBottom: '1.5rem',
          animation: 'fadeUp 0.5s 0.35s both'
        }}>
          {[['⚡', 'Real-time'], ['🔒', 'Role-based'], ['📊', 'Analytics']].map(([icon, label]) => (
            <div key={label} style={{
              flex: 1, background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10, padding: '8px 6px', textAlign: 'center'
            }}>
              <div style={{ fontSize: 14, marginBottom: 3 }}>{icon}</div>
              <div style={{ fontSize: 10, color: 'rgba(100,116,139,0.8)' }}>{label}</div>
            </div>
          ))}
        </div> */}

        {/* Tab switcher */}
        <div style={{
          display: 'flex', background: 'rgba(0,0,0,0.35)',
          borderRadius: 12, padding: 4, gap: 4, marginBottom: '1.5rem',
          animation: 'fadeUp 0.5s 0.4s both'
        }}>
          {['login', 'signup'].map(m => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 9, border: 'none',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", transition: 'all 0.25s',
                background: mode === m
                  ? 'linear-gradient(135deg, #6366f1, #7c3aed)'
                  : 'transparent',
                color: mode === m ? '#fff' : 'rgba(148,163,184,0.6)',
                boxShadow: mode === m ? '0 4px 16px rgba(99,102,241,0.4)' : 'none'
              }}
            >
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ animation: 'fadeUp 0.5s 0.45s both' }}>
          {mode === 'signup' && (
            <div className="mb-4">
              <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'rgba(148,163,184,0.65)', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Full Name
              </label>
              <input
                name="name" value={form.name} onChange={handleChange}
                placeholder="Enter Your Name" autoComplete="name"
                className={inputClass('name')}
              />
              {errors.name && <p className="mt-1.5 text-xs text-rose-400">{errors.name}</p>}
            </div>
          )}

          <div className="mb-4">
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'rgba(148,163,184,0.65)', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Email Address
            </label>
            <input
              name="email" type="email" value={form.email} onChange={handleChange}
              placeholder="Enter Your Email" autoComplete="email"
              className={inputClass('email')}
            />
            {errors.email && <p className="mt-1.5 text-xs text-rose-400">{errors.email}</p>}
          </div>

          <div className="mb-2">
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'rgba(148,163,184,0.65)', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Password
            </label>
            <input
              name="password" type="password" value={form.password} onChange={handleChange}
              placeholder="Min. 8 characters" autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className={inputClass('password')}
            />
            {errors.password && <p className="mt-1.5 text-xs text-rose-400">{errors.password}</p>}
          </div>

          {errors.general && (
            <div style={{
              borderRadius: 10, border: '1px solid rgba(244,63,94,0.35)',
              background: 'rgba(159,18,57,0.15)', padding: '10px 14px',
              fontSize: 13, color: '#fda4af', marginTop: 12
            }}>
              {errors.general}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', marginTop: 16, padding: '13px',
              borderRadius: 12, border: 'none',
              background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
              color: '#fff', fontSize: 14, fontWeight: 600,
              fontFamily: "'Sora', sans-serif", cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s', letterSpacing: '0.02em',
              boxShadow: loading ? 'none' : '0 4px 24px rgba(99,102,241,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(99,102,241,0.55)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(99,102,241,0.45)'; }}
          >
            {loading ? (
              <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Processing...</>
            ) : (
              mode === 'login' ? 'Sign In to TaskFlow →' : 'Create Account →'
            )}
          </button>
        </form>
      </div>

      {/* Keyframe injection */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes logoIn {
          from { opacity: 0; transform: scale(0.5) rotate(-12deg); }
          to   { opacity: 1; transform: scale(1)   rotate(0deg); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes glowPulse1 {
          0%,100% { transform: scale(1) translate(0,0); }
          50%      { transform: scale(1.12) translate(24px,18px); }
        }
        @keyframes glowPulse2 {
          0%,100% { transform: scale(1) translate(0,0); }
          50%      { transform: scale(1.18) translate(-18px,-12px); }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;