const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    color: {
      type: String,
      default: '#4f46e5',
    },
    icon: {
      type: String,
      default: '📚',
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

subjectSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);
