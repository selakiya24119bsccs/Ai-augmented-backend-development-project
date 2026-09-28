const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', progressController.getProgress);
router.post('/reset', progressController.resetProgress);

module.exports = router;
