const TopBar = ({ title, subtitle }) => (
  <div className="mb-6">
    <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>{title}</h1>
    {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
  </div>
);

export default TopBar;