const mongoose = require('mongoose');

const summarySchema = new mongoose.Schema(
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
    summary: {
      type: String,
      required: [true, 'Summary content is required'],
    },
    shortSummary: {
      type: String,
      default: '',
    },
    importantPoints: {
      type: [String],
      default: [],
    },
    keyTerms: [
      {
        term: String,
        definition: String,
      },
    ],
    mainConcepts: {
      type: [String],
      default: [],
    },
    keyPoints: {
      type: [String],
      default: [],
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

module.exports = mongoose.model('Summary', summarySchema);
