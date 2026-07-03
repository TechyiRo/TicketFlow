import React, { forwardRef } from 'react';

/**
 * Shared Input field component
 */
export const Input = forwardRef(({
  label,
  name,
  type = 'text',
  error,
  placeholder = '',
  className = '',
  icon: Icon,
  rightElement,
  ...props
}, ref) => {
  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label 
          htmlFor={name}
          className="text-xs font-bold text-text-secondary uppercase tracking-wider select-none"
        >
          {label}
        </label>
      )}
      
      <div className="relative flex items-center min-h-[44px]">
        {Icon && (
          <div className="absolute left-3.5 text-text-secondary pointer-events-none">
            <Icon className="w-5 h-5" />
          </div>
        )}
        
        <input
          id={name}
          name={name}
          type={type}
          ref={ref}
          placeholder={placeholder}
          className={`w-full h-[52px] md:h-11 bg-white/5 border rounded-lg text-[16px] md:text-sm text-text-primary px-4 py-2.5 transition-all duration-300 placeholder:text-text-secondary/40 focus:outline-none focus:border-accent-primary/80 focus:bg-white/10 focus:ring-2 focus:ring-accent-primary/20 focus:shadow-neonIndigo ${
            Icon ? 'pl-11' : ''
          } ${
            rightElement ? 'pr-11' : ''
          } ${
            error ? 'border-accent-danger/70 focus:border-accent-danger focus:ring-accent-danger/20' : 'border-white/10'
          }`}
          {...props}
        />

        {rightElement && (
          <div className="absolute right-3.5">
            {rightElement}
          </div>
        )}
      </div>

      {error && (
        <span className="text-[11px] text-accent-danger font-medium mt-0.5">
          {error.message || 'Invalid input'}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
