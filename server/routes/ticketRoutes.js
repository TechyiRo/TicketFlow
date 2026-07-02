const express = require('express');
const { body } = require('express-validator');
const ticketController = require('../controllers/ticketController');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { upload } = require('../middleware/upload');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

// Apply auth middleware to all ticket routes
router.use(authMiddleware);

// Validation rules
const createTicketValidation = [
  body('title')
    .notEmpty()
    .withMessage('Ticket title is required')
    .isLength({ min: 5 })
    .withMessage('Title must be at least 5 characters'),
  body('description')
    .notEmpty()
    .withMessage('Ticket description is required')
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters'),
  body('priority')
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Priority must be low, medium, high, or critical'),
  body('category')
    .isIn(['technical', 'billing', 'general', 'feature', 'bug'])
    .withMessage('Category must be technical, billing, general, feature, or bug'),
];

const commentValidation = [
  body('text')
    .notEmpty()
    .withMessage('Comment text cannot be empty')
    .trim(),
];

// Routes
router.get('/', ticketController.getTickets);

router.post(
  '/',
  roleCheck('user'),
  upload.array('attachments', 5),
  createTicketValidation,
  validateRequest,
  ticketController.createTicket
);

router.get('/:id', ticketController.getTicketById);

router.put(
  '/:id/status',
  roleCheck(['employee', 'admin']),
  body('status').isIn(['open', 'in_progress', 'pending', 'resolved', 'closed']).withMessage('Invalid status value'),
  validateRequest,
  ticketController.updateTicketStatus
);

router.put(
  '/:id/assign',
  roleCheck(['employee', 'admin']),
  ticketController.assignTicket
);

router.post(
  '/:id/comment',
  commentValidation,
  validateRequest,
  ticketController.addComment
);

const callController = require('../controllers/callController');

router.delete('/:id', roleCheck(['employee', 'admin']), ticketController.deleteTicket);
router.post('/:ticketId/call-log', callController.logCall);

module.exports = router;
