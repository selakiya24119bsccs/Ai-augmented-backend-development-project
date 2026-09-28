const mongoose = require('mongoose');

const studyPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      index: true,
    },
    topic: {
      type: String,
      default: '',
      trim: true,
    },
    date: {
      type: Date,
      default: null,
    },
    startTime: {
      type: String,
      default: '09:00 AM',
    },
    duration: {
      type: String,
      default: '1 hour',
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    studyPlan: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    examDate: {
      type: Date,
      default: null,
    },
    availableTime: {
      type: String,
      default: '2 hours/day',
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

studyPlanSchema.index({ userId: 1, isCompleted: 1 });
studyPlanSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('StudyPlan', studyPlanSchema);
