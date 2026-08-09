const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Tasks always belong to an event, and only customers own events.
router.use(authenticateToken, requireRole(['customer']));

router.get('/event/:eventId', taskController.getEventTasks);
router.post('/', taskController.createTask);
router.put('/:id/toggle', taskController.toggleTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
