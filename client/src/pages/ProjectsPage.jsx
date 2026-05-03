import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProjectApi } from '../api/projects';
import { useProjects } from '../hooks/useProjects';
import { useToast } from '../context/ToastContext';
import Layout from '../components/layout/Layout';
import TopBar from '../components/layout/TopBar';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import ProjectForm from '../components/forms/ProjectForm';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';

const ProjectCard = ({ project, onClick }) => {
  const colors = [
    'from-indigo-500/20 to-indigo-600/5',
    'from-purple-500/20 to-purple-600/5',
    'from-pink-500/20 to-pink-600/5',
    'from-emerald-500/20 to-emerald-600/5'
  ];

  const randomColor = colors[project._id.charCodeAt(0) % colors.length];

  return (
    <div
      onClick={onClick}
      className={`relative rounded-2xl p-5 cursor-pointer transition-all duration-300 
      hover:-translate-y-1 hover:shadow-xl border backdrop-blur-md`}
      style={{
        background: 'rgba(15,23,42,0.7)',
        borderColor: 'rgba(255,255,255,0.08)'
      }}
    >
      {/* Gradient overlay */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${randomColor} opacity-30`} />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-600/30 flex items-center justify-center text-indigo-400 font-bold text-lg">
            {project.name.charAt(0).toUpperCase()}
          </div>

          <span className="text-xs text-slate-500">
            {new Date(project.createdAt).toLocaleDateString()}
          </span>
        </div>

        <h3 className="text-base font-semibold text-white mb-1">
          {project.name}
        </h3>

        <p className="text-xs text-slate-400 line-clamp-2 mb-5">
          {project.description || 'No description'}
        </p>

        <div className="flex items-center gap-4 text-xs text-slate-400 border-t pt-3"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <span>👥 {project.members?.length || 0}</span>
          <span>✓ {project.taskCount || 0}</span>
          <span className="ml-auto text-slate-500 truncate">
            {project.owner?.name}
          </span>
        </div>
      </div>
    </div>
  );
};

const ProjectsPage = () => {
  const { projects, loading, refetch } = useProjects();
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleCreate = async (data) => {
    setSubmitting(true);
    try {
      await createProjectApi(data);
      addToast('Project created!', 'success');
      setModalOpen(false);
      refetch();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to create project', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <TopBar
          title="Projects"
          subtitle={`${projects.length} project${projects.length !== 1 ? 's' : ''}`}
        />

        <Button
          onClick={() => setModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 transition px-4 py-2 rounded-xl shadow-lg"
        >
          + New Project
        </Button>
      </div>

      {/* LOADING */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size={36} />
        </div>
      ) : projects.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon="📁"
            title="No projects yet"
            description="Create your first project to get started."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map(p => (
            <ProjectCard
              key={p._id}
              project={p}
              onClick={() => navigate(`/projects/${p._id}`)}
            />
          ))}
        </div>
      )}

      {/* MODAL */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Project"
      >
        <ProjectForm
          onSubmit={handleCreate}
          loading={submitting}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </Layout>
  );
};

export default ProjectsPage;