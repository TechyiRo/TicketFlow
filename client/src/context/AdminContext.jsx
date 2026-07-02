import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import adminService from '../services/adminService';
import { queueOfflineAction, getOfflineQueue, removeFromQueue } from '../pwa/offlineDB';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const AdminContext = createContext(null);

export const AdminProvider = ({ children }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    if (!navigator.onLine) return; // Wait for online to fetch stats
    try {
      const data = await adminService.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!navigator.onLine) return;
    try {
      setLoading(true);
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    if (!navigator.onLine) return;
    try {
      setLoading(true);
      const data = await adminService.getEmployees();
      setEmployees(data);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTickets = useCallback(async () => {
    if (!navigator.onLine) return;
    try {
      setLoading(true);
      const data = await adminService.getTickets();
      setTickets(data.tickets);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = async (type, id, newPassword) => {
    if (!navigator.onLine) {
      await queueOfflineAction({
        type: 'ADMIN_RESET_PASSWORD',
        endpoint: `/admin/${type}s/${id}/reset-password`,
        method: 'PUT',
        body: { type, newPassword },
      });
      toast.success('Offline mode: Password reset queued for sync');
      return;
    }
    
    try {
      await adminService.resetPassword(type, id, newPassword);
      toast.success('Password successfully reset');
      // Update local state to reflect password change immediately
      if (type === 'user') {
        setUsers(prev => prev.map(u => u._id === id ? { ...u, plainTextPassword: newPassword } : u));
      } else {
        setEmployees(prev => prev.map(e => e._id === id ? { ...e, plainTextPassword: newPassword } : e));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
      throw err;
    }
  };

  const createEmployee = async (employeeData) => {
    try {
      const data = await adminService.createEmployee(employeeData);
      setEmployees(prev => [...prev, data.employee]);
      fetchStats();
      toast.success('Employee successfully created!');
      return data.employee;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create employee');
      throw err;
    }
  };

  const deleteEmployee = async (id) => {
    try {
      await adminService.deleteEmployee(id);
      setEmployees(prev => prev.filter(emp => emp._id !== id));
      fetchStats();
      fetchTickets();
      toast.success('Employee deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete employee');
      throw err;
    }
  };

  const syncAdminOfflineActions = useCallback(async () => {
    if (!navigator.onLine) return;
    const queue = await getOfflineQueue();
    const adminActions = queue.filter(q => q.type === 'ADMIN_RESET_PASSWORD');
    
    if (adminActions.length === 0) return;

    console.log(`Syncing ${adminActions.length} admin actions...`);
    
    for (const action of adminActions) {
      try {
        await adminService.resetPassword(action.body.type, action.body.id, action.body.newPassword);
        await removeFromQueue(action.id);
      } catch (err) {
        console.error('Failed to sync admin action:', err);
        if (err.response?.status >= 400 && err.response?.status < 500) {
          // Client error, drop the action
          await removeFromQueue(action.id);
        }
      }
    }
  }, []);

  useEffect(() => {
    const handleReconnection = () => {
      syncAdminOfflineActions();
    };
    window.addEventListener('pwa:reconnected', handleReconnection);
    return () => {
      window.removeEventListener('pwa:reconnected', handleReconnection);
    };
  }, [syncAdminOfflineActions]);

  // Load initial data if admin
  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchStats();
      fetchUsers();
      fetchEmployees();
      fetchTickets();
    }
  }, [user, fetchStats, fetchUsers, fetchEmployees, fetchTickets]);

  return (
    <AdminContext.Provider value={{
      stats, users, employees, tickets, loading, error,
      fetchStats, fetchUsers, fetchEmployees, fetchTickets, resetPassword,
      createEmployee, deleteEmployee
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
