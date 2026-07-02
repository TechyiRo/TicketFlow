const express = require('express');
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

// Apply authentication to all chat routes
router.use(authMiddleware);

router.get('/:ticketId', chatController.getMessages);
router.post('/:ticketId', chatController.sendMessage);
router.put('/read/:ticketId', chatController.markAsRead);
router.post('/upload', upload.single('attachment'), chatController.uploadAttachment);
router.put('/react/:messageId', chatController.toggleReaction);

module.exports = router;
