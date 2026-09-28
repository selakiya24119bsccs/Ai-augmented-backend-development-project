const express = require('express');
const router = express.Router();
const flashcardController = require('../controllers/flashcardController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', flashcardController.getFlashcards);
router.post('/', flashcardController.createFlashcards);
router.get('/:id', flashcardController.getFlashcardById);
router.patch('/:id/study', flashcardController.toggleStudied);
router.delete('/:id', flashcardController.deleteFlashcard);

module.exports = router;
