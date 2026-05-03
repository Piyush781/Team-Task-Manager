import { useState, useEffect } from 'react';
import { getTasksApi } from '../api/tasks';

export const useTasks = (params = {}) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTasks = async (overrideParams) => {
    setLoading(true);
    try {
      const res = await getTasksApi(overrideParams || params);
      setTasks(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, [JSON.stringify(params)]);
  return { tasks, loading, error, refetch: fetchTasks, setTasks };
};