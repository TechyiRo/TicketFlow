import React from 'react';

/**
 * PriorityBadge - Renders color coded status badge for ticket priority levels
 */
export function PriorityBadge({ priority }) {
  const styles = {
    low: 'bg-accent-success/15 text-accent-success border border-accent-success/25 shadow-successGlow',
    medium: 'bg-accent-warning/15 text-accent-warning border border-accent-warning/25 shadow-warningGlow',
    high: 'bg-accent-danger/15 text-accent-danger border border-accent-danger/25 shadow-dangerGlow',
    critical: 'bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/25 shadow-[0_0_15px_rgba(240,78,255,0.2)]',
  };

  const label = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
  };

  return (
    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full select-none ${styles[priority] || styles.low}`}>
      {label[priority] || 'Low'}
    </span>
  );
}

export default PriorityBadge;
