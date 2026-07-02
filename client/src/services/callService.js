import api from './api';

export const callService = {
  /**
   * Log completed or missed voice calls into ticket history logs
   */
  logCall: async (ticketId, callData) => {
    // callData structure: { callerName, participants, startTime, duration, isMissed }
    const response = await api.post(`/tickets/${ticketId}/call-log`, callData);
    return response.data;
  },
};

export default callService;
