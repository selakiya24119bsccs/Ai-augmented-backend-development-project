const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', subjectController.getSubjects);
router.post('/defaults', subjectController.seedDefaultSubjects);
router.post('/', subjectController.createSubject);
router.get('/:subject', subjectController.getSubjectById);
router.put('/:id', subjectController.updateSubject);
router.delete('/:id', subjectController.deleteSubject);

module.exports = router;
