const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.post('/plan', aiController.getAIPlan);

module.exports = router;
