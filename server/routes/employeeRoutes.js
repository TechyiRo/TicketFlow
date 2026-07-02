const express = require('express');
const employeeController = require('../controllers/employeeController');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

// Apply auth and employee role check to all employee routes
router.use(authMiddleware);
router.use(roleCheck('employee'));

router.get('/', employeeController.getEmployees);
router.get('/stats', employeeController.getEmployeeStats);
router.put('/profile', employeeController.updateProfile);

module.exports = router;
