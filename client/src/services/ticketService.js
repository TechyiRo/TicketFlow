import api from './api';

export const ticketService = {
  /**
   * Fetch all tickets with filters
   */
  getTickets: async (filters = {}) => {
    const response = await api.get('/tickets', { params: filters });
    return response.data;
  },

  /**
   * Create a new ticket (user only, accepts FormData)
   */
  createTicket: async (formData) => {
    const response = await api.post('/tickets', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Get single ticket by ID
   */
  getTicketById: async (id) => {
    const response = await api.get(`/tickets/${id}`);
    return response.data;
  },

  /**
   * Update ticket status (employee only)
   */
  updateStatus: async (id, status) => {
    const response = await api.put(`/tickets/${id}/status`, { status });
    return response.data;
  },

  /**
   * Assign ticket (employee only)
   */
  assignTicket: async (id, employeeId) => {
    const response = await api.put(`/tickets/${id}/assign`, { employeeId });
    return response.data;
  },

  /**
   * Add a comment to a ticket
   */
  addComment: async (id, text) => {
    const response = await api.post(`/tickets/${id}/comment`, { text });
    return response.data;
  },

  /**
   * Delete a ticket (employee only)
   */
  deleteTicket: async (id) => {
    const response = await api.delete(`/tickets/${id}`);
    return response.data;
  },
};

export default ticketService;
