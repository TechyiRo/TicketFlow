import React from 'react';

/**
 * Shared Badge component
 */
export function Badge({
  children,
  variant = 'primary',
  className = '',
  ...props
}) {
  const styles = {
    primary: 'bg-accent-primary/10 text-accent-glow border border-accent-primary/20 shadow-primaryGlow',
    success: 'bg-accent-success/10 text-accent-success border border-accent-success/20 shadow-successGlow',
    warning: 'bg-accent-warning/10 text-accent-warning border border-accent-warning/20 shadow-warningGlow',
    danger: 'bg-accent-danger/10 text-accent-danger border border-accent-danger/20 shadow-dangerGlow',
    neutral: 'bg-background-elevated text-text-secondary border border-borderColor',
  };

  return (
    <span
      className={`inline-flex items-center text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full select-none ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

export default Badge;
