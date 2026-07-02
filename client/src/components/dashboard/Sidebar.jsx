import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Ticket, 
  MessageSquare, 
  UserCircle, 
  Settings, 
  LogOut, 
  Users, 
  Activity,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Import SVG avatars
import avatar1 from '../../assets/avatars/avatar1.svg';
import avatar2 from '../../assets/avatars/avatar2.svg';
import avatar3 from '../../assets/avatars/avatar3.svg';
import avatar4 from '../../assets/avatars/avatar4.svg';
import avatar5 from '../../assets/avatars/avatar5.svg';
import avatar6 from '../../assets/avatars/avatar6.svg';
import avatar7 from '../../assets/avatars/avatar7.svg';
import avatar8 from '../../assets/avatars/avatar8.svg';

const avatarMap = {
  avatar1, avatar2, avatar3, avatar4,
  avatar5, avatar6, avatar7, avatar8
};

/**
 * Sidebar - Left navigation pane
 */
export function Sidebar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const isEmployee = user.role === 'employee';

  // Navigation configurations based on role
  let navItems = [];
  if (isAdmin) {
    navItems = [
      { path: '/dashboard', label: 'Admin Console', icon: LayoutDashboard },
      { path: '/manage-users', label: 'Manage Users', icon: Users },
      { path: '/manage-tickets', label: 'Manage Tickets', icon: Ticket },
      { path: '/schedule', label: 'Schedule Manager', icon: Calendar },
      { path: '/chat-monitor', label: 'Chat Monitor', icon: MessageSquare },
      { path: '/profile', label: 'My Profile', icon: UserCircle },
    ];
  } else if (isEmployee) {
    navItems = [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/all-tickets', label: 'All Tickets', icon: Ticket },
      { path: '/assigned-tickets', label: 'Assigned to Me', icon: Activity },
      { path: '/schedule', label: 'My Schedule', icon: Calendar },
      { path: '/messages', label: 'Messages', icon: MessageSquare },
      { path: '/profile', label: 'My Profile', icon: UserCircle },
    ];
  } else {
    navItems = [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/my-tickets', label: 'My Tickets', icon: Ticket },
      { path: '/schedule', label: 'My Schedule', icon: Calendar },
      { path: '/messages', label: 'Messages', icon: MessageSquare },
      { path: '/profile', label: 'My Profile', icon: UserCircle },
    ];
  }

  const userAvatar = avatarMap[user.avatar] || user.avatar || avatarMap.avatar1;

  return (
    <aside 
      className="hidden md:flex flex-col h-full rounded-2xl glass-panel transition-all duration-300 w-[72px] hover:w-[240px] lg:w-[240px] group overflow-hidden pl-safe-left shrink-0 z-30 shadow-glassShadow border border-borderColor/20"
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-borderColor shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-purple flex items-center justify-center font-bold text-white shrink-0 shadow-neonIndigo">
          TF
        </div>
        <span className="text-lg font-black tracking-tight text-text-primary transition-opacity duration-300 md:opacity-0 group-hover:opacity-100 lg:opacity-100 whitespace-nowrap">
          TicketFlow
        </span>
      </div>

      {/* User Info Badge */}
      <div className="flex items-center gap-3 px-4 py-6 border-b border-borderColor overflow-hidden shrink-0">
        <div className="w-10 h-10 rounded-full border border-borderColor/30 p-0.5 bg-background-primary/45 overflow-hidden shrink-0">
          <img src={userAvatar} alt={user.fullName} className="w-full h-full object-contain" />
        </div>
        <div className="flex flex-col min-w-0 transition-opacity duration-300 md:opacity-0 group-hover:opacity-100 lg:opacity-100 whitespace-nowrap">
          <span className="text-sm font-semibold text-text-primary truncate">{user.fullName}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 w-max ${
            user.role === 'admin'
              ? 'bg-[#7B2FFF]/20 text-[#7B2FFF] border border-[#7B2FFF]/30'
              : isEmployee 
                ? 'bg-accent-warning/20 text-accent-warning border border-accent-warning/30' 
                : 'bg-accent-primary/20 text-accent-glow border border-accent-primary/30'
          }`}>
            {user.role === 'admin' ? 'Admin' : isEmployee ? 'Employee' : 'User'}
          </span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-6 flex flex-col gap-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-semibold transition-all group-hover:justify-start ${
                  isActive
                    ? 'bg-gradient-to-r from-accent-primary to-accent-purple text-white shadow-neonIndigo'
                    : 'text-text-secondary hover:bg-white/5 hover:text-text-primary border border-transparent hover:border-white/5'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="transition-opacity duration-300 md:opacity-0 group-hover:opacity-100 lg:opacity-100 whitespace-nowrap">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-borderColor shrink-0 flex flex-col gap-1">
        <NavLink
          to="/profile"
          className="flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-semibold text-text-secondary hover:bg-background-elevated hover:text-text-primary transition-all"
        >
          <Settings className="w-5 h-5 shrink-0" />
          <span className="transition-opacity duration-300 md:opacity-0 group-hover:opacity-100 lg:opacity-100 whitespace-nowrap">
            Settings
          </span>
        </NavLink>
        
        <button
          onClick={logout}
          className="flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-semibold text-accent-danger hover:bg-accent-danger/10 transition-all text-left w-full"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="transition-opacity duration-300 md:opacity-0 group-hover:opacity-100 lg:opacity-100 whitespace-nowrap">
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
