import api from './api';

export const scheduleService = {
  /**
   * Fetch schedule items for a specific date (YYYY-MM-DD)
   */
  getItems: async (date) => {
    const response = await api.get(`/schedule?date=${date}`);
    return response.data;
  },

  /**
   * Create a new schedule item
   */
  createItem: async (data) => {
    const response = await api.post('/schedule', data);
    return response.data;
  },

  /**
   * Update an existing schedule item
   */
  updateItem: async (id, data) => {
    const response = await api.put(`/schedule/${id}`, data);
    return response.data;
  },

  /**
   * Delete a schedule item
   */
  deleteItem: async (id) => {
    const response = await api.delete(`/schedule/${id}`);
    return response.data;
  },

  /**
   * Toggle completion status
   */
  toggleComplete: async (id) => {
    const response = await api.patch(`/schedule/${id}/toggle`);
    return response.data;
  },

  /**
   * Register push notifications subscription
   */
  subscribePush: async (subscription) => {
    const response = await api.post('/schedule/subscribe', { subscription });
    return response.data;
  },

  /**
   * Fetch failed notification logs for warning banner
   */
  getFailedNotifications: async () => {
    const response = await api.get('/schedule/failed-notifications');
    return response.data;
  },

  /**
   * Clear failed notification alerts
   */
  clearFailedNotifications: async () => {
    const response = await api.delete('/schedule/failed-notifications');
    return response.data;
  },

  /**
   * Fetch master overview for Admins
   */
  getAdminOverview: async (date) => {
    const response = await api.get(`/schedule/admin-overview?date=${date}`);
    return response.data;
  },

  snoozeItemInApp: async (id) => {
    const response = await api.post(`/schedule/items/${id}/snooze-bg`);
    return response.data;
  },

  completeItemInApp: async (id) => {
    const response = await api.post(`/schedule/items/${id}/complete-bg`);
    return response.data;
  },

  logNotificationPermission: async () => {
    const response = await api.post('/schedule/notification-permission');
    return response.data;
  },
};

export default scheduleService;
