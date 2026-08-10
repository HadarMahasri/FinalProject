const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.post('/plan', aiController.getAIPlan);
router.post('/ask', aiController.askAI);

module.exports = router;
