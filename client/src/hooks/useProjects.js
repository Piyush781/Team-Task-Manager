import { useState, useEffect } from 'react';
import { getProjectsApi } from '../api/projects';

export const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await getProjectsApi();
      setProjects(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);
  return { projects, loading, error, refetch: fetchProjects, setProjects };
};