const mongoose = require('mongoose');
const StudyMaterial = require('../models/StudyMaterial');
const Subject = require('../models/Subject');
const Summary = require('../models/Summary');
const Flashcard = require('../models/Flashcard');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const StudyPlan = require('../models/StudyPlan');
const Progress = require('../models/Progress');

// @desc    Get aggregated learning progress and live statistics from MongoDB
// @route   GET /api/progress
// @access  Protected
exports.getProgress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [
      totalMaterials,
      subjectsCount,
      distinctSubjects,
      totalSummaries,
      totalFlashcards,
      flashcardsStudied,
      quizAttempts,
      studyPlanTasks,
      completedTasks,
      recentMaterials,
      recentSummaries,
      recentAttempts,
    ] = await Promise.all([
      StudyMaterial.countDocuments({ userId }),
      Subject.countDocuments({ userId }),
      StudyMaterial.distinct('subject', { userId }),
      Summary.countDocuments({ userId }),
      Flashcard.countDocuments({ userId }),
      Flashcard.countDocuments({ userId, isStudied: true }),
      QuizAttempt.find({ userId }).sort({ submittedAt: -1 }),
      StudyPlan.countDocuments({ userId }),
      StudyPlan.countDocuments({ userId, isCompleted: true }),
      StudyMaterial.find({ userId }).sort({ createdAt: -1 }).limit(5),
      Summary.find({ userId }).populate('materialId', 'title').sort({ createdAt: -1 }).limit(5),
      QuizAttempt.find({ userId }).populate('quizId', 'title subject').sort({ submittedAt: -1 }).limit(5),
    ]);

    const totalSubjects = Math.max(subjectsCount, distinctSubjects.length);
    const quizzesTaken = quizAttempts.length;

    let averageQuizScore = 0;
    if (quizzesTaken > 0) {
      const sumPercentage = quizAttempts.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
      averageQuizScore = Math.round(sumPercentage / quizzesTaken);
    }

    // Calculate Overall Study Progress % (measures completed tasks, quizzes mastered, and flashcards studied)
    let overallProgress = 0;
    if (studyPlanTasks > 0 || totalFlashcards > 0 || quizzesTaken > 0) {
      const taskWeight = 40;
      const quizWeight = 35;
      const fcWeight = 25;

      const taskPart = studyPlanTasks > 0 ? (completedTasks / studyPlanTasks) * taskWeight : (completedTasks > 0 ? taskWeight : 0);
      const quizPart = quizzesTaken > 0 ? ((averageQuizScore / 100) * 0.7 + Math.min(1, quizzesTaken / 3) * 0.3) * quizWeight : 0;
      const fcPart = totalFlashcards > 0 ? (flashcardsStudied / totalFlashcards) * fcWeight : 0;

      overallProgress = Math.min(100, Math.round(taskPart + quizPart + fcPart));
    }

    // Calculate 7-day activity timeline for chart
    const past7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
      const dayStr = d.toISOString().split('T')[0];
      past7Days.push({ day: dayName, date: dayStr, count: 0 });
    }

    // Build chronological recent activity timeline
    const activities = [];

    recentMaterials.forEach(m => {
      activities.push({
        type: 'material',
        title: `Added study material: "${m.title}"`,
        subtitle: m.subject,
        timestamp: m.createdAt,
      });
    });

    recentSummaries.forEach(s => {
      activities.push({
        type: 'summary',
        title: `Generated AI summary for "${s.materialId?.title || 'Material'}"`,
        subtitle: 'AI Summary',
        timestamp: s.createdAt,
      });
    });

    recentAttempts.forEach(a => {
      activities.push({
        type: 'quiz',
        title: `Completed ${a.quizId?.title || 'AI Quiz'} - Score: ${a.percentage}%`,
        subtitle: a.quizId?.subject || 'Quiz',
        timestamp: a.submittedAt,
      });
    });

    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Tally 7 days activity counts
    activities.forEach(act => {
      if (act.timestamp) {
        const actDateStr = new Date(act.timestamp).toISOString().split('T')[0];
        const match = past7Days.find(d => d.date === actDateStr);
        if (match) match.count++;
      }
    });

    // Update Progress document in MongoDB
    await Progress.findOneAndUpdate(
      { userId },
      {
        totalMaterials,
        totalSubjects,
        totalSummaries,
        flashcardsStudied,
        quizzesTaken,
        averageQuizScore,
        studyPlanTasks,
        completedTasks,
        overallProgress,
        lastUpdated: new Date(),
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Progress statistics retrieved successfully from MongoDB',
      data: {
        totalMaterials,
        totalSubjects,
        totalSummaries,
        totalFlashcards,
        flashcardsStudied,
        quizzesTaken,
        quizzesCompleted: quizzesTaken,
        averageQuizScore,
        studyPlanTasks,
        totalStudyPlans: studyPlanTasks,
        completedTasks,
        overallProgress,
        subjects: distinctSubjects,
        weeklyChart: past7Days,
        recentActivity: activities.slice(0, 10),
      },
    });
  } catch (error) {
    console.error('[Get Progress Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error retrieving progress',
    });
  }
};

// @desc    Reset student study activity (quizzes, completed tasks, flashcards, progress) to 0
// @route   POST /api/progress/reset
// @access  Protected
exports.resetProgress = async (req, res) => {
  try {
    const userId = req.user.userId;

    await Promise.all([
      QuizAttempt.deleteMany({ userId }),
      Quiz.updateMany({ userId }, { $unset: { lastAttempt: 1 } }),
      StudyPlan.updateMany({ userId }, { isCompleted: false, completedAt: null }),
      Flashcard.updateMany({ userId }, { isStudied: false, studyCount: 0, studiedAt: null }),
      Progress.findOneAndUpdate(
        { userId },
        {
          quizzesTaken: 0,
          averageQuizScore: 0,
          completedTasks: 0,
          flashcardsStudied: 0,
          overallProgress: 0,
          lastUpdated: new Date(),
        },
        { upsert: true }
      ),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Learning progress and quiz scores reset to 0 successfully',
      data: {
        quizzesTaken: 0,
        averageQuizScore: 0,
        completedTasks: 0,
        flashcardsStudied: 0,
        overallProgress: 0,
      },
    });
  } catch (error) {
    console.error('[Reset Progress Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error resetting progress',
    });
  }
};

