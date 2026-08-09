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

  // Ownership-scoped toggle: only updates a task if it actually belongs to
  // an event owned by customerId. affectedRows === 0 means either the task
  // doesn't exist or it belongs to someone else.
  static async toggleTask(taskId, isCompleted, customerId) {
    try {
      const [result] = await db.query(
        `UPDATE event_tasks et
         JOIN events e ON et.event_id = e.id
         SET et.is_completed = ?
         WHERE et.id = ? AND e.customer_id = ?`,
        [isCompleted, taskId, customerId]
      );
      return result.affectedRows > 0;
    } catch (err) {
      console.error('Error in TaskModel.toggleTask:', err.message);
      throw err;
    }
  }

  // Ownership-scoped delete — same guarantee as toggleTask above.
  static async deleteTask(taskId, customerId) {
    try {
      const [result] = await db.query(
        `DELETE et FROM event_tasks et
         JOIN events e ON et.event_id = e.id
         WHERE et.id = ? AND e.customer_id = ?`,
        [taskId, customerId]
      );
      return result.affectedRows > 0;
    } catch (err) {
      console.error('Error in TaskModel.deleteTask:', err.message);
      throw err;
    }
  }
}

module.exports = TaskModel;
