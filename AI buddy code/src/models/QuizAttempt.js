const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: [true, 'Quiz ID is required'],
      index: true,
    },
    score: {
      type: Number,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
    answers: [
      {
        questionIndex: Number,
        question: String,
        options: [String],
        selectedAnswer: String,
        correctAnswer: String,
        isCorrect: Boolean,
      },
    ],
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

quizAttemptSchema.index({ userId: 1, submittedAt: -1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
