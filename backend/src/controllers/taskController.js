const TaskModel = require('../models/taskModel');
const EventModel = require('../models/eventModel');

async function getEventTasks(req, res) {
  try {
    const { eventId } = req.params;

    // A task list is private planning info — verify the event actually
    // belongs to the requesting customer before returning it.
    const event = await EventModel.getEventById(eventId);
    if (!event || Number(event.customer_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: 'אין לך הרשאה לצפות במשימות של אירוע זה.' });
    }

    const tasks = await TaskModel.getTasksByEventId(eventId);
    res.json(tasks);
  } catch (error) {
    console.error('Error in taskController.getEventTasks:', error);
    res.status(500).json({ message: 'שגיאה בשליפת המשימות של האירוע.' });
  }
}

async function createTask(req, res) {
  try {
    const { event_id, title, category } = req.body;

    if (!event_id || !title || !title.trim()) {
      return res.status(400).json({ message: 'נא למלא מזהה אירוע וכותרת משימה.' });
    }

    const event = await EventModel.getEventById(event_id);
    if (!event || Number(event.customer_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: 'אין לך הרשאה להוסיף משימות לאירוע זה.' });
    }

    const taskId = await TaskModel.createTask({
      event_id,
      title: title.trim(),
      category
    });

    res.status(201).json({ message: 'המשימה נוספה בהצלחה!', id: taskId });
  } catch (error) {
    console.error('Error in taskController.createTask:', error);
    res.status(500).json({ message: 'שגיאה בהוספת משימה.' });
  }
}

async function toggleTask(req, res) {
  try {
    const { id } = req.params;
    const { is_completed } = req.body;

    const updated = await TaskModel.toggleTask(id, is_completed, req.user.id);
    if (!updated) {
      return res.status(404).json({ message: 'משימה לא נמצאה, או שאינך מורשה לערוך אותה.' });
    }

    res.json({ message: 'סטטוס המשימה עודכן בהצלחה!' });
  } catch (error) {
    console.error('Error in taskController.toggleTask:', error);
    res.status(500).json({ message: 'שגיאה בעדכון סטטוס המשימה.' });
  }
}

async function deleteTask(req, res) {
  try {
    const { id } = req.params;

    const deleted = await TaskModel.deleteTask(id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ message: 'משימה לא נמצאה, או שאינך מורשה למחוק אותה.' });
    }

    res.json({ message: 'המשימה נמחקה בהצלחה!' });
  } catch (error) {
    console.error('Error in taskController.deleteTask:', error);
    res.status(500).json({ message: 'שגיאה במחיקת המשימה.' });
  }
}

module.exports = {
  getEventTasks,
  createTask,
  toggleTask,
  deleteTask
};
