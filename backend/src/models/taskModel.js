const db = require('../config/db');

class TaskModel {
  static async getTasksByEventId(eventId) {
    try {
      const [rows] = await db.query(
        'SELECT id, event_id, title, category, is_completed, created_at FROM event_tasks WHERE event_id = ? ORDER BY created_at ASC',
        [eventId]
      );
      return rows;
    } catch (err) {
      console.error('Error in TaskModel.getTasksByEventId:', err.message);
      return [];
    }
  }

  static async createTask({ event_id, title, category }) {
    try {
      const [result] = await db.query(
        'INSERT INTO event_tasks (event_id, title, category) VALUES (?, ?, ?)',
        [event_id, title, category || 'general']
      );
      return result.insertId;
    } catch (err) {
      console.error('Error in TaskModel.createTask:', err.message);
      throw err;
    }
  }

  static async toggleTask(taskId, isCompleted) {
    try {
      await db.query('UPDATE event_tasks SET is_completed = ? WHERE id = ?', [isCompleted, taskId]);
      return true;
    } catch (err) {
      console.error('Error in TaskModel.toggleTask:', err.message);
      throw err;
    }
  }

  static async deleteTask(taskId) {
    try {
      await db.query('DELETE FROM event_tasks WHERE id = ?', [taskId]);
      return true;
    } catch (err) {
      console.error('Error in TaskModel.deleteTask:', err.message);
      throw err;
    }
  }
}

module.exports = TaskModel;
