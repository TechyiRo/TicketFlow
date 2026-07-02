import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Ticket, 
  MessageSquare, 
  UserCircle, 
  Plus, 
  Activity,
  Users,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

/**
 * BottomTabBar - Mobile bottom navigation bar
 */
export function BottomTabBar() {
  const { user } = useAuth();
  const { getTotalUnreadCount } = useChat();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const isEmployee = user.role === 'employee';
  const unreadCount = getTotalUnreadCount();

  const handleCenterClick = () => {
    if (isAdmin) {
      navigate('/manage-users');
    } else if (isEmployee) {
      navigate('/assigned-tickets');
    } else {
      navigate('/dashboard?action=create-ticket');
    }
  };

  return (
    <nav 
      className="md:hidden fixed bottom-4 left-4 right-4 z-30 rounded-2xl glass-panel flex items-center justify-around h-16 shadow-glassShadow"
      style={{
        height: '64px',
      }}
    >
      {/* Home / Dashboard Link */}
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center flex-1 h-full text-xs font-semibold ${
            isActive ? 'text-accent-primary' : 'text-text-secondary'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            {isActive && <span className="text-[10px] mt-0.5">Home</span>}
          </>
        )}
      </NavLink>

      {/* Tickets Link */}
      <NavLink
        to={isAdmin ? '/manage-tickets' : isEmployee ? '/all-tickets' : '/my-tickets'}
        className={({ isActive }) =>
          `flex flex-col items-center justify-center flex-1 h-full text-xs font-semibold ${
            isActive ? 'text-accent-primary' : 'text-text-secondary'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <Ticket className="w-5 h-5 shrink-0" />
            {isActive && <span className="text-[10px] mt-0.5">Tickets</span>}
          </>
        )}
      </NavLink>

      {/* Center Action Button (Raised indigo circle) */}
      <div className="flex-1 flex justify-center -translate-y-4">
        <button
          onClick={handleCenterClick}
          aria-label={isAdmin ? 'Manage Users' : isEmployee ? 'Assigned tickets' : 'Create new ticket'}
          className="w-14 h-14 rounded-full bg-accent-primary hover:bg-accent-glow text-white flex items-center justify-center shadow-primaryGlow transition-transform active:scale-95 border-4 border-background-primary select-none focus:outline-none"
        >
          {isAdmin ? (
            <Users className="w-6 h-6" />
          ) : isEmployee ? (
            <Activity className="w-6 h-6" />
          ) : (
            <Plus className="w-7 h-7" />
          )}
        </button>
      </div>

      {/* Chat Messages Link */}
      <NavLink
        to={isAdmin ? '/chat-monitor' : '/messages'}
        className={({ isActive }) =>
          `flex flex-col items-center justify-center flex-1 h-full text-xs font-semibold relative ${
            isActive ? 'text-accent-primary' : 'text-text-secondary'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <MessageSquare className="w-5 h-5 shrink-0" />
            {isActive && <span className="text-[10px] mt-0.5">Chat</span>}
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-6 bg-accent-danger text-white text-[9px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center border border-background-surface">
                {unreadCount}
              </span>
            )}
          </>
        )}
      </NavLink>

      {/* Schedule Link */}
      <NavLink
        to="/schedule"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center flex-1 h-full text-xs font-semibold ${
            isActive ? 'text-accent-primary' : 'text-text-secondary'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <Calendar className="w-5 h-5 shrink-0" />
            {isActive && <span className="text-[10px] mt-0.5">Schedule</span>}
          </>
        )}
      </NavLink>

      {/* Profile Link */}
      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center flex-1 h-full text-xs font-semibold ${
            isActive ? 'text-accent-primary' : 'text-text-secondary'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <UserCircle className="w-5 h-5 shrink-0" />
            {isActive && <span className="text-[10px] mt-0.5">Profile</span>}
          </>
        )}
      </NavLink>
    </nav>
  );
}

export default BottomTabBar;
