const mongoose = require('mongoose');

const studyMaterialSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    fileType: {
      type: String,
      default: 'notes', // 'pdf', 'docx', 'txt', 'notes'
    },
    originalFileName: {
      type: String,
      default: null,
    },
    fileUrl: {
      type: String,
      default: null,
    },
    fileSize: {
      type: Number,
      default: 0,
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

studyMaterialSchema.index({ userId: 1, subject: 1 });
studyMaterialSchema.index({ userId: 1, title: 'text', content: 'text' });

module.exports = mongoose.model('StudyMaterial', studyMaterialSchema);
