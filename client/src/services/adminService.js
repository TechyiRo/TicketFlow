import api from './api';

const adminService = {
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  getEmployees: async () => {
    const response = await api.get('/admin/employees');
    return response.data;
  },

  getTickets: async () => {
    const response = await api.get('/admin/tickets');
    return response.data;
  },

  resetPassword: async (type, id, newPassword) => {
    const response = await api.put(`/admin/${type}s/${id}/reset-password`, { type, newPassword });
    return response.data;
  },

  createEmployee: async (employeeData) => {
    const response = await api.post('/admin/employees', employeeData);
    return response.data;
  },

  deleteEmployee: async (id) => {
    const response = await api.delete(`/admin/employees/${id}`);
    return response.data;
  },

  getActiveChats: async () => {
    const response = await api.get('/admin/chats');
    return response.data;
  },
};

export default adminService;
