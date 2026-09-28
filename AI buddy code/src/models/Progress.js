const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
      index: true,
    },
    totalMaterials: {
      type: Number,
      default: 0,
    },
    totalSubjects: {
      type: Number,
      default: 0,
    },
    totalSummaries: {
      type: Number,
      default: 0,
    },
    flashcardsStudied: {
      type: Number,
      default: 0,
    },
    quizzesTaken: {
      type: Number,
      default: 0,
    },
    averageQuizScore: {
      type: Number,
      default: 0,
    },
    studyPlanTasks: {
      type: Number,
      default: 0,
    },
    completedTasks: {
      type: Number,
      default: 0,
    },
    overallProgress: {
      type: Number,
      default: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = mongoose.model('Progress', progressSchema);
