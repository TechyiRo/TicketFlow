/**
 * TicketFlow Magic Strings and Constants
 */

export const TICKET_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  PENDING: 'pending',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
};

export const TICKET_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export const TICKET_CATEGORY = {
  TECHNICAL: 'technical',
  BILLING: 'billing',
  GENERAL: 'general',
  FEATURE: 'feature',
  BUG: 'bug',
};

export const STATUS_LABELS = {
  [TICKET_STATUS.OPEN]: 'Open',
  [TICKET_STATUS.IN_PROGRESS]: 'In Progress',
  [TICKET_STATUS.PENDING]: 'Pending',
  [TICKET_STATUS.RESOLVED]: 'Resolved',
  [TICKET_STATUS.CLOSED]: 'Closed',
};

export const PRIORITY_LABELS = {
  [TICKET_PRIORITY.LOW]: 'Low',
  [TICKET_PRIORITY.MEDIUM]: 'Medium',
  [TICKET_PRIORITY.HIGH]: 'High',
  [TICKET_PRIORITY.CRITICAL]: 'Critical',
};

export const CATEGORY_LABELS = {
  [TICKET_CATEGORY.TECHNICAL]: 'Technical Support',
  [TICKET_CATEGORY.BILLING]: 'Billing Inquiry',
  [TICKET_CATEGORY.GENERAL]: 'General Request',
  [TICKET_CATEGORY.FEATURE]: 'Feature Request',
  [TICKET_CATEGORY.BUG]: 'Bug Report',
};
