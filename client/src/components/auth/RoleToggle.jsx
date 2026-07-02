import React from 'react';

/**
 * RoleToggle - Swapper between User and Employee login/signup modes
 */
export function RoleToggle({ role, onChange }) {
  return (
    <div className="w-full max-w-xs mx-auto bg-white/5 border border-white/10 backdrop-blur-md rounded-full p-1.5 flex items-center justify-between mb-8 select-none">
      <button
        type="button"
        onClick={() => onChange('user')}
        className={`flex-1 text-center py-2.5 rounded-full text-xs font-bold transition-all duration-300 ${
          role === 'user'
            ? 'bg-accent-primary text-white shadow-glow'
            : 'text-text-secondary hover:text-text-primary'
        }`}
      >
        Client User
      </button>
      <button
        type="button"
        onClick={() => onChange('employee')}
        className={`flex-1 text-center py-2.5 rounded-full text-xs font-bold transition-all duration-300 ${
          role === 'employee'
            ? 'bg-accent-primary text-white shadow-glow'
            : 'text-text-secondary hover:text-text-primary'
        }`}
      >
        Support Team
      </button>
    </div>
  );
}

export default RoleToggle;
