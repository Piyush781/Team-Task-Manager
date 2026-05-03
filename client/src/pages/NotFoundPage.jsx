
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center flex-col text-center gap-4" style={{ backgroundColor: 'var(--bg-base)' }}>
      <div className="text-7xl font-black text-slate-700" style={{ fontFamily: 'Sora, sans-serif' }}>404</div>
      <h1 className="text-xl font-semibold text-slate-300">Page not found</h1>
      <p className="text-slate-500 text-sm">The page you're looking for doesn't exist.</p>
      <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
    </div>
  );
};

export default NotFoundPage;