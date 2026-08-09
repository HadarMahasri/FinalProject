const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.post('/', messageController.sendMessage);
router.get('/conversations', messageController.getConversationsList);
router.get('/unread-count', messageController.getUnreadCount);
router.get('/:otherUserId', messageController.getConversation);

module.exports = router;
