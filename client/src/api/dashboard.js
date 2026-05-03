import api from './axios';
export const getDashboardApi = () => api.get('/dashboard');