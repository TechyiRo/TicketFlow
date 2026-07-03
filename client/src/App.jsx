import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TicketProvider } from './context/TicketContext';
import { AdminProvider } from './context/AdminContext';
import { ChatProvider } from './context/ChatContext';
import { CallProvider } from './context/CallContext';
import { Toaster } from 'react-hot-toast';
import AuthPage from './pages/AuthPage';

// Import Voice Call Overlays
import IncomingCallToast from './components/call/IncomingCallToast';
import CallOverlay from './components/call/CallOverlay';
import FloatingCallBar from './components/call/FloatingCallBar';
import AppShell from './components/layout/AppShell';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Import Pages
import UserDashboard from './pages/user/UserDashboard';
import MyTickets from './pages/user/MyTickets';
import UserProfile from './pages/user/UserProfile';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import AllTickets from './pages/employee/AllTickets';
import AssignedTickets from './pages/employee/AssignedTickets';
import EmployeeProfile from './pages/employee/EmployeeProfile';
import MessagesPage from './pages/MessagesPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminManageUsers from './pages/admin/AdminManageUsers';
import AdminManageTickets from './pages/admin/AdminManageTickets';
import AdminChatMonitor from './pages/admin/AdminChatMonitor';
import SchedulePage from './pages/SchedulePage';

/**
 * Renders the dashboard matching the user's role
 */
const DashboardSelector = () => {
  const { user } = useAuth();
  if (user?.role === 'admin') return <AdminDashboard />;
  return user?.role === 'employee' ? <EmployeeDashboard /> : <UserDashboard />;
};

/**
 * Renders the profile page matching the user's role
 */
const ProfileSelector = () => {
  const { user } = useAuth();
  return user?.role === 'employee' ? <EmployeeProfile /> : <UserProfile />;
};

/**
 * Handles landing page redirection
 */
const RootSelector = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="w-full h-screen bg-background-primary flex flex-col items-center justify-center gap-3">
        <svg className="animate-spin h-8 w-8 text-accent-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-sm font-semibold text-text-secondary">Resolving session...</span>
      </div>
    );
  }

  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

export function App() {
  React.useEffect(() => {
    const handleResize = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    handleResize();
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <TicketProvider>
          <AdminProvider>
            <ChatProvider>
              <CallProvider>
                {/* Global Toasts notifier */}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    className: 'glass-panel text-text-primary border border-borderColor',
                    style: {
                      background: '#1A2235',
                      color: '#F1F5F9',
                    },
                  }}
                />

                {/* Global Calling Overlays */}
                <IncomingCallToast />
                <CallOverlay />
                <FloatingCallBar />

            <Routes>
              {/* Public Login Route */}
              <Route path="/login" element={<AuthPage />} />

              {/* Protected Workspace Routes */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <Routes>
                        <Route path="dashboard" element={<DashboardSelector />} />
                        
                        {/* Client only routes */}
                        <Route
                          path="my-tickets"
                          element={
                            <ProtectedRoute allowedRoles={['user']}>
                              <MyTickets />
                            </ProtectedRoute>
                          }
                        />
                        
                        {/* Employee only routes */}
                        <Route
                          path="all-tickets"
                          element={
                            <ProtectedRoute allowedRoles={['employee']}>
                              <AllTickets />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="assigned-tickets"
                          element={
                            <ProtectedRoute allowedRoles={['employee']}>
                              <AssignedTickets />
                            </ProtectedRoute>
                          }
                        />

                        {/* Admin only routes */}
                        <Route
                          path="manage-users"
                          element={
                            <ProtectedRoute allowedRoles={['admin']}>
                              <AdminManageUsers />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="manage-tickets"
                          element={
                            <ProtectedRoute allowedRoles={['admin']}>
                              <AdminManageTickets />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="chat-monitor"
                          element={
                            <ProtectedRoute allowedRoles={['admin']}>
                              <AdminChatMonitor />
                            </ProtectedRoute>
                          }
                        />

                        {/* Shared routes */}
                        <Route path="messages" element={<MessagesPage />} />
                        <Route path="profile" element={<ProfileSelector />} />
                        <Route path="schedule" element={<SchedulePage />} />

                        {/* Redirect unmatched route */}
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                      </Routes>
                    </AppShell>
                  </ProtectedRoute>
                }
              />

              {/* Root selector fallback */}
              <Route path="/" element={<RootSelector />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
              </CallProvider>
            </ChatProvider>
          </AdminProvider>
        </TicketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
