const variants = {
  primary: 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-600',
  secondary: 'bg-transparent hover:bg-white/5 text-slate-300 border-slate-600',
  danger: 'bg-rose-600 hover:bg-rose-500 text-white border-rose-600',
  ghost: 'bg-transparent hover:bg-white/5 text-slate-400 border-transparent'
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base'
};

const Button = ({ children, variant = 'primary', size = 'md', loading = false, className = '', ...props }) => (
  <button
    className={`inline-flex items-center justify-center gap-2 rounded-lg border font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    disabled={loading || props.disabled}
    {...props}
  >
    {loading && <span className="spinner" style={{ width: 14, height: 14 }} />}
    {children}
  </button>
);

export default Button;