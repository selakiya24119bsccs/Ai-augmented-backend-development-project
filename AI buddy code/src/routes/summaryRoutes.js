const express = require('express');
const router = express.Router();
const summaryController = require('../controllers/summaryController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', summaryController.getSummaries);
router.post('/', summaryController.createSummary);
router.get('/:id', summaryController.getSummaryById);
router.delete('/:id', summaryController.deleteSummary);

module.exports = router;
