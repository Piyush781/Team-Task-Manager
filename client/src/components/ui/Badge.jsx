const statusStyles = {
  todo: 'bg-slate-800 text-slate-300 border-slate-600',
  in_progress: 'bg-indigo-950 text-indigo-300 border-indigo-700',
  done: 'bg-emerald-950 text-emerald-300 border-emerald-700'
};

const priorityStyles = {
  low: 'bg-emerald-950 text-emerald-300 border-emerald-700',
  medium: 'bg-amber-950 text-amber-300 border-amber-700',
  high: 'bg-rose-950 text-rose-300 border-rose-700'
};

const roleStyles = {
  admin: 'bg-indigo-950 text-indigo-300 border-indigo-700',
  member: 'bg-slate-800 text-slate-300 border-slate-600'
};

const statusLabel = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };

const Badge = ({ type, value }) => {
  let style = '';
  let label = value;

  if (type === 'status') { style = statusStyles[value] || statusStyles.todo; label = statusLabel[value] || value; }
  else if (type === 'priority') { style = priorityStyles[value] || priorityStyles.medium; label = value?.charAt(0).toUpperCase() + value?.slice(1); }
  else if (type === 'role') { style = roleStyles[value] || roleStyles.member; label = value?.charAt(0).toUpperCase() + value?.slice(1); }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      {label}
    </span>
  );
};

export default Badge;