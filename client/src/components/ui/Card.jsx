const Card = ({ children, className = '', onClick, overdue = false }) => (
  <div
    onClick={onClick}
    className={`rounded-xl border p-5 transition-all duration-200
      ${onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5' : ''}
      ${overdue ? 'border-l-rose-600 border-l-4' : ''}
      ${className}`}
    style={{
      backgroundColor: overdue ? 'rgba(159,18,57,0.08)' : 'var(--bg-card)',
      borderColor: overdue ? undefined : 'var(--border)'
    }}
  >
    {children}
  </div>
);

export default Card;