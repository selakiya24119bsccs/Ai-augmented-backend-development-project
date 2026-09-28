const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const User = require('../src/models/User');
const Quiz = require('../src/models/Quiz');
const QuizAttempt = require('../src/models/QuizAttempt');
const StudyPlan = require('../src/models/StudyPlan');
const Flashcard = require('../src/models/Flashcard');
const Progress = require('../src/models/Progress');

async function resetUsers() {
  await connectDB();
  const users = await User.find({});
  for (const user of users) {
    const userId = user._id;
    await QuizAttempt.deleteMany({ userId });
    await Quiz.updateMany({ userId }, { $unset: { lastAttempt: 1 } });
    await StudyPlan.updateMany({ userId }, { isCompleted: false, completedAt: null });
    await Flashcard.updateMany({ userId }, { isStudied: false, studyCount: 0, studiedAt: null });
    await Progress.findOneAndUpdate(
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
    );
    console.log(`Reset learning activity to 0 for: ${user.email}`);
  }
  console.log('All users successfully reset to 0: quizzes taken=0, completed tasks=0, avg quiz score=0%, overall progress=0%');
  await mongoose.disconnect();
}

resetUsers().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
