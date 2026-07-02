import React from 'react';

/**
 * Shared Button component
 */
export function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  onClick,
  ...props
}) {
  const baseStyle = 'inline-flex items-center justify-center font-bold rounded-lg transition-all duration-300 active:scale-[0.96] select-none disabled:opacity-50 disabled:pointer-events-none focus:outline-none min-h-[44px] min-w-[44px]';
  
  const variants = {
    primary: 'btn-cyber-glow text-white shadow-neonIndigo',
    secondary: 'bg-white/5 hover:bg-white/10 text-text-primary border border-white/10 backdrop-blur-sm',
    success: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-successGlow',
    warning: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-warningGlow',
    danger: 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white shadow-dangerGlow',
    transparent: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/5',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 min-h-[40px]',
    md: 'text-sm px-5 py-2.5 min-h-[44px]',
    lg: 'text-base px-6 py-3 min-h-[48px]',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-5 w-5 text-current mr-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : null}
      {children}
    </button>
  );
}

export default Button;
