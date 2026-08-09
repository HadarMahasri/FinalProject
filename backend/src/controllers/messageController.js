const MessageModel = require('../models/messageModel');

async function sendMessage(req, res) {
  try {
    const sender_id = req.user.id;
    const { receiver_id, booking_id, content } = req.body;

    if (!receiver_id || !content || !content.trim()) {
      return res.status(400).json({ message: 'נא למלא נמען ותוכן הודעה.' });
    }

    const messageId = await MessageModel.createMessage({
      sender_id,
      receiver_id,
      booking_id,
      content: content.trim()
    });

    const newMessage = {
      id: messageId,
      sender_id,
      receiver_id,
      booking_id,
      content: content.trim(),
      sender_name: req.user.name,
      is_read: false,
      created_at: new Date().toISOString()
    };

    // Emit live WebSocket event if Socket.io io instance is available
    if (req.io) {
      req.io.to(`user_${receiver_id}`).emit('new_message', newMessage);
    }

    res.status(201).json({ message: 'ההודעה שנשלחה בהצלחה!', id: messageId });
  } catch (error) {
    console.error('Error in messageController.sendMessage:', error);
    res.status(500).json({ message: 'שגיאה בשליחת ההודעה.' });
  }
}

async function getConversation(req, res) {
  try {
    const userId = req.user.id;
    const { otherUserId } = req.params;

    const messages = await MessageModel.getConversation(userId, otherUserId);
    await MessageModel.markAsRead(userId, otherUserId);

    res.json(messages);
  } catch (error) {
    console.error('Error in messageController.getConversation:', error);
    res.status(500).json({ message: 'שגיאה בשליפת השיחה.' });
  }
}

async function getConversationsList(req, res) {
  try {
    const userId = req.user.id;
    const conversations = await MessageModel.getConversationsList(userId);
    res.json(conversations);
  } catch (error) {
    console.error('Error in messageController.getConversationsList:', error);
    res.status(500).json({ message: 'שגיאה בשליפת רשימת השיחות.' });
  }
}

async function getUnreadCount(req, res) {
  try {
    const userId = req.user.id;
    const unreadCount = await MessageModel.getUnreadTotalCount(userId);
    res.json({ unreadCount });
  } catch (error) {
    console.error('Error in messageController.getUnreadCount:', error);
    res.status(500).json({ message: 'שגיאה בשליפת מספר ההודעות שלא נקראו.' });
  }
}

module.exports = {
  sendMessage,
  getConversation,
  getConversationsList,
  getUnreadCount
};
