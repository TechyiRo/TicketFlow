const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All admin routes require authentication and 'admin' role
router.use(auth);
router.use(roleCheck(['admin']));

// Get aggregate stats
router.get('/stats', adminController.getStats);

// Manage users and employees
router.get('/users', adminController.getUsers);
router.get('/employees', adminController.getEmployees);
router.post('/employees', adminController.createEmployee);
router.delete('/employees/:id', adminController.deleteEmployee);
router.put('/users/:id/reset-password', adminController.resetPassword);
router.put('/employees/:id/reset-password', adminController.resetPassword);

// Manage tickets
router.get('/tickets', adminController.getTickets);
router.get('/chats', adminController.getActiveChats);

module.exports = router;
