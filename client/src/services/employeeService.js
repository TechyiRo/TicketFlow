import api from './api';

export const employeeService = {
  /**
   * Get all active employees (for ticket assignment dropdowns)
   */
  getEmployees: async () => {
    const response = await api.get('/employees');
    return response.data;
  },

  /**
   * Get Employee dashboard stats and activity feed
   */
  getEmployeeStats: async () => {
    const response = await api.get('/employees/stats');
    return response.data;
  },

  /**
   * Update employee profile
   */
  updateProfile: async (data) => {
    const response = await api.put('/employees/profile', data);
    return response.data;
  },
};

export default employeeService;
