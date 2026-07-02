import api from './api';

export const chatService = {
  /**
   * Fetch message history for a ticket
   */
  getMessages: async (ticketId) => {
    const response = await api.get(`/messages/${ticketId}`);
    return response.data;
  },

  /**
   * Send a chat message (HTTP fallback when Socket.io is disconnected)
   */
  sendMessageFallback: async (ticketId, content, attachments = []) => {
    const response = await api.post(`/messages/${ticketId}`, { content, attachments });
    return response.data;
  },

  /**
   * Mark messages in a chat room as read
   */
  markAsRead: async (ticketId) => {
    const response = await api.put(`/messages/read/${ticketId}`);
    return response.data;
  },

  /**
   * Upload chat file attachment
   */
  uploadFile: async (formData) => {
    const response = await api.post('/messages/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Toggle emoji reaction on a message
   */
  toggleReaction: async (messageId, emoji) => {
    const response = await api.put(`/messages/react/${messageId}`, { emoji });
    return response.data;
  },
};

export default chatService;
