import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import ticketService from '../services/ticketService';
import { getCachedTickets, cacheTickets, getOfflineQueue, removeFromQueue } from '../pwa/offlineDB';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const TicketContext = createContext(null);

export const TicketProvider = ({ children }) => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentTicket, setCurrentTicket] = useState(null);

  // Fetch tickets list (offline aware)
  const fetchTickets = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      if (navigator.onLine) {
        const data = await ticketService.getTickets(filters);
        setTickets(data.tickets);
        // Cache tickets for offline use
        await cacheTickets(data.tickets);
      } else {
        // Read from IndexedDB cache when offline
        const cached = await getCachedTickets();
        setTickets(cached);
        toast.info('Viewing offline cached tickets.');
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError(err.message || 'Failed to fetch tickets');
      // Read from cache as backup
      const cached = await getCachedTickets();
      setTickets(cached);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch individual ticket details (offline aware)
  const fetchTicketById = useCallback(async (id) => {
    setError(null);
    try {
      if (navigator.onLine) {
        const data = await ticketService.getTicketById(id);
        setCurrentTicket(data);
        return data;
      } else {
        const cached = await getCachedTickets();
        const found = cached.find(t => t._id === id);
        if (found) {
          setCurrentTicket(found);
          return found;
        } else {
          throw new Error('Ticket not found in local offline cache.');
        }
      }
    } catch (err) {
      console.error('Error fetching ticket details:', err);
      setError(err.message || 'Failed to retrieve ticket details');
      throw err;
    }
  }, []);

  // Synchronize offline actions when reconnected
  const syncOfflineActions = useCallback(async () => {
    const queue = await getOfflineQueue();
    if (!queue || queue.length === 0) return;

    console.log(`Syncing ${queue.length} offline actions...`);
    const toastId = toast.loading(`Syncing ${queue.length} offline actions...`);

    for (const action of queue) {
      try {
        const parts = action.endpoint.split('/'); // e.g., ["", "tickets", "id", "status"]
        
        if (action.method === 'POST') {
          if (action.endpoint === '/tickets' || action.endpoint === 'tickets') {
            // Re-package base64 files back into a FormData structure if needed, or send as JSON
            const formData = new FormData();
            formData.append('title', action.body.title);
            formData.append('description', action.body.description);
            formData.append('priority', action.body.priority);
            formData.append('category', action.body.category);
            
            // If offline action has base64 files, we can upload them
            if (action.body.attachments && action.body.attachments.length > 0) {
              for (let i = 0; i < action.body.attachments.length; i++) {
                const base64Str = action.body.attachments[i];
                const response = await fetch(base64Str);
                const blob = await response.blob();
                formData.append('attachments', blob, `attachment-${i}.png`);
              }
            }
            await ticketService.createTicket(formData);
          } else if (action.endpoint.includes('/comment')) {
            // Add comment: Endpoint is e.g. /tickets/:id/comment
            const ticketId = parts[2];
            await ticketService.addComment(ticketId, action.body.text);
          }
        } else if (action.method === 'PUT') {
          const ticketId = parts[2];
          if (action.endpoint.includes('/status')) {
            await ticketService.updateStatus(ticketId, action.body.status);
          } else if (action.endpoint.includes('/assign')) {
            await ticketService.assignTicket(ticketId, action.body.employeeId);
          }
        } else if (action.method === 'DELETE') {
          const ticketId = parts[2];
          await ticketService.deleteTicket(ticketId);
        }

        // Remove item on success
        await removeFromQueue(action.id);
      } catch (err) {
        console.error('Error replaying offline action:', action, err);
        // If it's a validation / logic error, remove it so it doesn't block the queue
        if (err.status === 400 || err.status === 403 || err.status === 404) {
          await removeFromQueue(action.id);
        }
      }
    }

    toast.dismiss(toastId);
    toast.success('Sync complete. Dashboard updated!');
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    // Listen for custom reconnection event
    const handleReconnection = () => {
      syncOfflineActions();
    };

    window.addEventListener('pwa:reconnected', handleReconnection);
    return () => {
      window.removeEventListener('pwa:reconnected', handleReconnection);
    };
  }, [syncOfflineActions]);

  // Initial load
  useEffect(() => {
    if (user) {
      fetchTickets();
    } else {
      setTickets([]);
      setCurrentTicket(null);
    }
  }, [user, fetchTickets]);

  const value = {
    tickets,
    loading,
    error,
    currentTicket,
    fetchTickets,
    fetchTicketById,
    syncOfflineActions,
    setCurrentTicket,
  };

  return <TicketContext.Provider value={value}>{children}</TicketContext.Provider>;
};

export const useTickets = () => {
  const context = useContext(TicketContext);
  if (!context) {
    throw new Error('useTickets must be used within a TicketProvider');
  }
  return context;
};
