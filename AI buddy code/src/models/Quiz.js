const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
    },
    options: {
      type: [String],
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyMaterial',
      default: null,
      index: true,
    },
    title: {
      type: String,
      default: 'AI Generated Quiz',
    },
    subject: {
      type: String,
      default: 'General',
    },
    questions: {
      type: [questionSchema],
      required: true,
    },
    lastAttempt: {
      score: { type: Number, default: null },
      totalQuestions: { type: Number, default: null },
      percentage: { type: Number, default: null },
      submittedAt: { type: Date, default: null },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = mongoose.model('Quiz', quizSchema);
