import api from './axios';

export const getUsersApi    = ()       => api.get('/users');
export const getUsersBasicApi = ()     => api.get('/users/basic');   // ✅ new
export const updateRoleApi  = (id, role) => api.put(`/users/${id}/role`, { role });