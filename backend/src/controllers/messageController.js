const MessageModel = require('../models/messageModel');

// 1. פונקציית שליחת הודעה בצ'אט בלייב + שמירה ב-MySQL + שידור ב-WebSocket
async function sendMessage(req, res) {
  try {
    // שליפת ה-ID של שולח ההודעה מתוך הטוקן המאומת ב-req.user
    const sender_id = req.user.id;
    const { receiver_id, booking_id, content } = req.body;

    // ולידציה בסיסית: ודאות שקיבלנו נמען ותוכן הודעה
    if (!receiver_id || !content || !content.trim()) {
      return res.status(400).json({ message: 'נא למלא נמען ותוכן הודעה.' });
    }

    // א. שמירת ההודעה במסד הנתונים MySQL בטבלת messages
    const messageId = await MessageModel.createMessage({
      sender_id,
      receiver_id,
      booking_id,
      content: content.trim()
    });

    // ב. בניית אובייקט ההודעה המלא עבור שידור בזמן אמת
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

    // ג. Server Push בזמן אמת: שידור בלייב ב-WebSocket לחדר הפרטי של המקבל (user_X)
    if (req.io) {
      req.io.to(`user_${receiver_id}`).emit('new_message', newMessage);
    }

    // ד. החזרת תשובת Payload מינימלית לשולח להפחתת עומס ברשת
    res.status(201).json({ message: 'ההודעה שנשלחה בהצלחה!', id: messageId });
  } catch (error) {
    console.error('Error in messageController.sendMessage:', error);
    res.status(500).json({ message: 'שגיאה בשליחת ההודעה.' });
  }
}

// 2. שליפת היסטוריית שיחה בודדת בין 2 משתמשים + עדכון הודעות כנקראו (is_read = true)
async function getConversation(req, res) {
  try {
    const userId = req.user.id;
    const { otherUserId } = req.params;

    // א. שליפת כל ההודעות בין 2 המשתמשים בשאילתת SQL מותאמת
    const messages = await MessageModel.getConversation(userId, otherUserId);
    // ב. עדכון סטטוס ההודעות שהתקבלו מ-is_read = false ל-true
    await MessageModel.markAsRead(userId, otherUserId);

    res.json(messages);
  } catch (error) {
    console.error('Error in messageController.getConversation:', error);
    res.status(500).json({ message: 'שגיאה בשליפת השיחה.' });
  }
}

// 3. שליפת רשימת השיחות הציבוריות של המשתמש מול כל הספקים/לקוחות
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

// 4. שליפת מונה ההודעות שלא נקראו עבור סרגל הניווט העליון (Navbar Counter)
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
