import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, Ticket, Calendar, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * BottomTabBar - Mobile bottom navigation bar
 */
export function BottomTabBar() {
  const { user } = useAuth();

  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const isEmployee = user.role === 'employee';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#030712]/90 backdrop-blur-md border-t border-borderColor/50 flex items-center justify-around pb-[env(safe-area-inset-bottom)] h-[calc(64px+env(safe-area-inset-bottom))] shadow-glassShadow select-none">
      {/* Home / Dashboard Link */}
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 touch-target ${
            isActive ? 'text-accent-cyan drop-shadow-[0_0_8px_#06b6d4]' : 'text-text-secondary hover:text-text-primary'
          }`
        }
      >
        <LayoutGrid className="w-7 h-7" />
      </NavLink>

      {/* Tickets Link */}
      <NavLink
        to={isAdmin ? '/manage-tickets' : isEmployee ? '/all-tickets' : '/my-tickets'}
        className={({ isActive }) =>
          `flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 touch-target ${
            isActive ? 'text-accent-cyan drop-shadow-[0_0_8px_#06b6d4]' : 'text-text-secondary hover:text-text-primary'
          }`
        }
      >
        <Ticket className="w-7 h-7" />
      </NavLink>

      {/* Schedule Link */}
      <NavLink
        to="/schedule"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 touch-target ${
            isActive ? 'text-accent-cyan drop-shadow-[0_0_8px_#06b6d4]' : 'text-text-secondary hover:text-text-primary'
          }`
        }
      >
        <Calendar className="w-7 h-7" />
      </NavLink>

      {/* Profile Link */}
      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 touch-target ${
            isActive ? 'text-accent-cyan drop-shadow-[0_0_8px_#06b6d4]' : 'text-text-secondary hover:text-text-primary'
          }`
        }
      >
        <User className="w-7 h-7" />
      </NavLink>
    </nav>
  );
}

export default BottomTabBar;
