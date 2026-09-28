const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/chat', aiController.chat);
router.post('/summary', aiController.generateSummary);
router.post('/explain', aiController.explainTopic);
router.post('/flashcards', aiController.generateFlashcards);
router.post('/quiz', aiController.generateQuiz);
router.post('/study-plan', aiController.generateStudyPlan);

module.exports = router;
