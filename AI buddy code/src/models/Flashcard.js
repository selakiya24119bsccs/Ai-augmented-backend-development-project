const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema(
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
      required: [true, 'Material ID is required'],
      index: true,
    },
    question: {
      type: String,
      required: [true, 'Question is required'],
      trim: true,
    },
    answer: {
      type: String,
      required: [true, 'Answer is required'],
      trim: true,
    },
    isStudied: {
      type: Boolean,
      default: false,
    },
    studyCount: {
      type: Number,
      default: 0,
    },
    studiedAt: {
      type: Date,
      default: null,
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

flashcardSchema.index({ userId: 1, isStudied: 1 });

module.exports = mongoose.model('Flashcard', flashcardSchema);
