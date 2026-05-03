import { useState } from 'react';
import Button from '../ui/Button';

const ProjectForm = ({ initial = {}, onSubmit, loading, onCancel }) => {
  const [form, setForm] = useState({ name: initial.name || '', description: initial.description || '' });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors(er => ({ ...er, [e.target.name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Project name is required';
    if (Object.keys(errs).length) return setErrors(errs);
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">Project Name *</label>
        <input
          name="name" value={form.name} onChange={handleChange}
          placeholder="Enter project name"
          className={`w-full rounded-lg border px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors
            ${errors.name ? 'border-rose-600' : 'border-slate-600'}`}
          style={{ backgroundColor: 'var(--bg-elevated)' }}
        />
        {errors.name && <p className="mt-1 text-xs text-rose-400">{errors.name}</p>}
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
        <textarea
          name="description" value={form.description} onChange={handleChange}
          placeholder="Brief description of the project"
          rows={3}
          className="w-full rounded-lg border border-slate-600 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
          style={{ backgroundColor: 'var(--bg-elevated)' }}
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>{initial._id ? 'Save Changes' : 'Create Project'}</Button>
      </div>
    </form>
  );
};

export default ProjectForm;     