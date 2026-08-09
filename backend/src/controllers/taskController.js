const TaskModel = require('../models/taskModel');

async function getEventTasks(req, res) {
  try {
    const { eventId } = req.params;
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

    await TaskModel.toggleTask(id, is_completed);
    res.json({ message: 'סטטוס המשימה עודכן בהצלחה!' });
  } catch (error) {
    console.error('Error in taskController.toggleTask:', error);
    res.status(500).json({ message: 'שגיאה בעדכון סטטוס המשימה.' });
  }
}

async function deleteTask(req, res) {
  try {
    const { id } = req.params;

    await TaskModel.deleteTask(id);
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
