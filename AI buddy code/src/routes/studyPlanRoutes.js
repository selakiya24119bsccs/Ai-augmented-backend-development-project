const express = require('express');
const router = express.Router();
const studyPlanController = require('../controllers/studyPlanController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', studyPlanController.getStudyPlans);
router.post('/', studyPlanController.createStudyPlan);
router.get('/today', studyPlanController.getTodayTasks);
router.patch('/:id/toggle', studyPlanController.toggleTask);
router.get('/:id', studyPlanController.getStudyPlanById);
router.put('/:id', studyPlanController.updateStudyPlan);
router.delete('/:id', studyPlanController.deleteStudyPlan);

module.exports = router;
