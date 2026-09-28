const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', quizController.getQuizzes);
router.post('/', quizController.createQuiz);
router.get('/attempts/history', quizController.getQuizAttempts);
router.get('/:id', quizController.getQuizById);
router.post('/:id/submit', quizController.submitQuiz);
router.delete('/:id', quizController.deleteQuiz);

module.exports = router;
