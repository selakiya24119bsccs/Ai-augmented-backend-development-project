const mongoose = require('mongoose');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const StudyMaterial = require('../models/StudyMaterial');
const geminiService = require('../services/geminiService');

// @desc    Get all quizzes for logged-in user
// @route   GET /api/quizzes
// @access  Protected
exports.getQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ userId: req.user.userId })
      .populate('materialId', 'title subject')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Quizzes retrieved successfully',
      data: quizzes,
    });
  } catch (error) {
    console.error('[Get Quizzes Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Generate and save a new quiz
// @route   POST /api/quizzes
// @access  Protected
exports.createQuiz = async (req, res) => {
  try {
    const { materialId, subject, count = 5 } = req.body;
    let quizContent = '';
    let quizSubject = subject || 'General';
    let materialDoc = null;

    if (materialId && mongoose.Types.ObjectId.isValid(materialId)) {
      materialDoc = await StudyMaterial.findOne({
        _id: materialId,
        userId: req.user.userId,
      });
      if (materialDoc) {
        quizContent = materialDoc.content;
        quizSubject = materialDoc.subject;
      }
    } else if (subject) {
      // Find recent material under this subject
      const materials = await StudyMaterial.find({
        userId: req.user.userId,
        subject: { $regex: new RegExp(`^${subject}$`, 'i') },
      });
      quizContent = materials.map(m => m.content).join('\n\n') || `Academic subject: ${subject}`;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either materialId or subject must be provided',
      });
    }

    const generatedQuestions = await geminiService.generateQuiz(quizContent, quizSubject, parseInt(count, 10) || 5);

    const quiz = new Quiz({
      userId: req.user.userId,
      materialId: materialDoc ? materialDoc._id : null,
      title: materialDoc ? `Quiz: ${materialDoc.title}` : `Quiz: ${quizSubject}`,
      subject: quizSubject,
      questions: generatedQuestions,
    });

    await quiz.save();

    return res.status(201).json({
      success: true,
      message: 'Quiz generated successfully',
      data: quiz,
    });
  } catch (error) {
    console.error('[Create Quiz Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate quiz',
    });
  }
};

// @desc    Get quiz by ID
// @route   GET /api/quizzes/:id
// @access  Protected
exports.getQuizById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quiz ID',
      });
    }

    const quiz = await Quiz.findOne({
      _id: id,
      userId: req.user.userId,
    }).populate('materialId', 'title subject');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    // Also fetch past attempts for this quiz
    const attempts = await QuizAttempt.find({
      quizId: id,
      userId: req.user.userId,
    }).sort({ submittedAt: -1 }).limit(5);

    return res.status(200).json({
      success: true,
      message: 'Quiz retrieved successfully',
      data: {
        ...quiz.toObject(),
        attempts,
      },
    });
  } catch (error) {
    console.error('[Get Quiz By ID Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Submit quiz answers, calculate score, and record QuizAttempt in MongoDB
// @route   POST /api/quizzes/:id/submit
// @access  Protected
exports.submitQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quiz ID',
      });
    }

    const quiz = await Quiz.findOne({
      _id: id,
      userId: req.user.userId,
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    const totalQuestions = quiz.questions.length;
    let correct = 0;
    const review = [];

    quiz.questions.forEach((q, index) => {
      const userAnswer = (answers && (answers[index] !== undefined ? answers[index] : answers[String(index)])) || '';
      const isCorrect = String(userAnswer).trim().toLowerCase() === String(q.answer).trim().toLowerCase();

      if (isCorrect) {
        correct++;
      }

      review.push({
        questionIndex: index,
        question: q.question,
        options: q.options,
        userAnswer: userAnswer || 'Not answered',
        correctAnswer: q.answer,
        isCorrect,
      });
    });

    const wrong = totalQuestions - correct;
    const percentage = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;

    // Update quiz lastAttempt
    quiz.lastAttempt = {
      score: correct,
      totalQuestions,
      percentage,
      submittedAt: new Date(),
    };
    await quiz.save();

    // Persist full attempt in QuizAttempt collection in MongoDB
    const quizAttempt = new QuizAttempt({
      userId: req.user.userId,
      quizId: quiz._id,
      score: correct,
      totalQuestions,
      percentage,
      answers: review,
      submittedAt: new Date(),
    });
    await quizAttempt.save();

    return res.status(200).json({
      success: true,
      message: 'Quiz submitted and graded successfully',
      data: {
        attemptId: quizAttempt._id,
        totalQuestions,
        correct,
        wrong,
        score: correct,
        percentage,
        review,
      },
    });
  } catch (error) {
    console.error('[Submit Quiz Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error submitting quiz',
    });
  }
};

// @desc    Get all previous quiz attempts for user
// @route   GET /api/quizzes/attempts/history
// @access  Protected
exports.getQuizAttempts = async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ userId: req.user.userId })
      .populate({
        path: 'quizId',
        select: 'title subject',
      })
      .sort({ submittedAt: -1 })
      .limit(20);

    return res.status(200).json({
      success: true,
      message: 'Quiz attempt history retrieved successfully',
      data: attempts,
    });
  } catch (error) {
    console.error('[Get Quiz Attempts Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error retrieving quiz attempts',
    });
  }
};

// @desc    Delete quiz and its associated attempts
// @route   DELETE /api/quizzes/:id
// @access  Protected
exports.deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quiz ID',
      });
    }

    const quiz = await Quiz.findOneAndDelete({
      _id: id,
      userId: req.user.userId,
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    // Also delete past attempts
    await QuizAttempt.deleteMany({ quizId: id, userId: req.user.userId });

    return res.status(200).json({
      success: true,
      message: 'Quiz deleted successfully',
      data: { id },
    });
  } catch (error) {
    console.error('[Delete Quiz Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};
