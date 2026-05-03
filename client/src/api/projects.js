import api from './axios';
export const getProjectsApi = () => api.get('/projects');
export const createProjectApi = (data) => api.post('/projects', data);
export const getProjectApi = (id) => api.get(`/projects/${id}`);
export const updateProjectApi = (id, data) => api.put(`/projects/${id}`, data);
export const deleteProjectApi = (id) => api.delete(`/projects/${id}`);
export const addMemberApi = (id, userId) => api.post(`/projects/${id}/members`, { userId });
export const removeMemberApi = (id, userId) => api.delete(`/projects/${id}/members/${userId}`);