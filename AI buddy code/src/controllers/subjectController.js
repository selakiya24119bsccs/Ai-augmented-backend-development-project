const mongoose = require('mongoose');
const Subject = require('../models/Subject');
const StudyMaterial = require('../models/StudyMaterial');

const DEFAULT_SUBJECTS = [
  {
    name: 'Computer Science',
    description: 'Core computing concepts, algorithms, data structures, and discrete mathematics.',
    color: '#4f46e5',
    icon: '💻',
  },
  {
    name: 'Artificial Intelligence',
    description: 'Machine learning foundations, neural networks, optimization, and search strategies.',
    color: '#7c3aed',
    icon: '🧠',
  },
  {
    name: 'Mathematics',
    description: 'Calculus, linear algebra, discrete math, probability and statistical foundations.',
    color: '#0284c7',
    icon: '📐',
  },
  {
    name: 'Database Management',
    description: 'Relational design, normalization, ACID transactions, SQL and NoSQL architectures.',
    color: '#059669',
    icon: '🗄️',
  },
  {
    name: 'Node.js',
    description: 'Asynchronous event loop, Express.js web APIs, non-blocking I/O and microservices.',
    color: '#16a34a',
    icon: '⚡',
  },
  {
    name: 'MongoDB',
    description: 'Document database model, Mongoose ODM, aggregation pipelines and indexing strategies.',
    color: '#0d9488',
    icon: '🍃',
  },
];

exports.DEFAULT_SUBJECTS = DEFAULT_SUBJECTS;

// @desc    Get all subjects for logged-in user with material counts (auto-seeds defaults if empty)
// @route   GET /api/subjects
// @access  Protected
exports.getSubjects = async (req, res) => {
  try {
    const userId = req.user.userId;

    let subjects = await Subject.find({ userId }).sort({ name: 1 });

    // If user has no subjects recorded yet, automatically seed the 6 default academic subjects
    if (subjects.length === 0) {
      try {
        const defaults = DEFAULT_SUBJECTS.map((s) => ({ ...s, userId }));
        subjects = await Subject.insertMany(defaults);
      } catch (seedErr) {
        console.warn('[Auto-seed subjects warning]:', seedErr.message);
        subjects = await Subject.find({ userId }).sort({ name: 1 });
      }
    }

    // Count materials for each subject
    const subjectNames = subjects.map(s => s.name);
    const materialCounts = await StudyMaterial.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$subject', count: { $sum: 1 }, lastUpdated: { $max: '$createdAt' } } },
    ]);

    const countMap = {};
    const updatedMap = {};
    materialCounts.forEach(mc => {
      countMap[mc._id.toLowerCase()] = mc.count;
      updatedMap[mc._id.toLowerCase()] = mc.lastUpdated;
    });

    const result = subjects.map(s => ({
      _id: s._id,
      name: s.name,
      subject: s.name,
      description: s.description,
      color: s.color,
      icon: s.icon,
      count: countMap[s.name.toLowerCase()] || 0,
      lastUpdated: updatedMap[s.name.toLowerCase()] || s.createdAt,
      createdAt: s.createdAt,
    }));

    // If user has materials with subjects not in Subject collection, include them dynamically
    materialCounts.forEach(mc => {
      const found = subjects.some(s => s.name.toLowerCase() === mc._id.toLowerCase());
      if (!found && mc._id) {
        result.push({
          _id: null,
          name: mc._id,
          subject: mc._id,
          description: 'Auto-detected subject',
          color: '#4f46e5',
          icon: '📚',
          count: mc.count,
          lastUpdated: mc.lastUpdated,
          createdAt: mc.lastUpdated,
        });
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Subjects retrieved successfully',
      data: result,
    });
  } catch (error) {
    console.error('[Get Subjects Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error retrieving subjects',
    });
  }
};

// @desc    Create a new subject
// @route   POST /api/subjects
// @access  Protected
exports.createSubject = async (req, res) => {
  try {
    const { name, description, color, icon } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Subject name is required',
      });
    }

    const trimmedName = name.trim();
    const existing = await Subject.findOne({
      userId: req.user.userId,
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A subject with this name already exists',
      });
    }

    const subject = new Subject({
      userId: req.user.userId,
      name: trimmedName,
      description: description ? description.trim() : '',
      color: color || '#4f46e5',
      icon: icon || '📚',
    });

    await subject.save();

    return res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: subject,
    });
  } catch (error) {
    console.error('[Create Subject Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating subject',
    });
  }
};

// @desc    Get subject by ID or name
// @route   GET /api/subjects/:idOrName
// @access  Protected
exports.getSubjectById = async (req, res) => {
  try {
    const { subject: idOrName } = req.params;
    const userId = req.user.userId;

    let subjectDoc = null;
    if (mongoose.Types.ObjectId.isValid(idOrName)) {
      subjectDoc = await Subject.findOne({ _id: idOrName, userId });
    }

    if (!subjectDoc) {
      subjectDoc = await Subject.findOne({
        userId,
        name: { $regex: new RegExp(`^${idOrName}$`, 'i') },
      });
    }

    const subjectName = subjectDoc ? subjectDoc.name : idOrName;
    const materials = await StudyMaterial.find({
      userId,
      subject: { $regex: new RegExp(`^${subjectName}$`, 'i') },
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: `Materials for subject "${subjectName}" retrieved successfully`,
      data: {
        subject: subjectDoc || { name: subjectName, description: '', icon: '📚' },
        materials,
      },
    });
  } catch (error) {
    console.error('[Get Subject Materials Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Protected
exports.updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, icon } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subject ID',
      });
    }

    const subject = await Subject.findOne({ _id: id, userId: req.user.userId });
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    const oldName = subject.name;
    if (name && name.trim()) {
      subject.name = name.trim();
    }
    if (description !== undefined) subject.description = description.trim();
    if (color) subject.color = color;
    if (icon) subject.icon = icon;

    await subject.save();

    // If subject name changed, synchronize associated study materials
    if (name && name.trim() && name.trim().toLowerCase() !== oldName.toLowerCase()) {
      await StudyMaterial.updateMany(
        { userId: req.user.userId, subject: { $regex: new RegExp(`^${oldName}$`, 'i') } },
        { subject: name.trim() }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Subject updated successfully',
      data: subject,
    });
  } catch (error) {
    console.error('[Update Subject Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating subject',
    });
  }
};

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
// @access  Protected
exports.deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subject ID',
      });
    }

    const subject = await Subject.findOneAndDelete({ _id: id, userId: req.user.userId });
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Subject deleted successfully',
      data: { id, name: subject.name },
    });
  } catch (error) {
    console.error('[Delete Subject Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting subject',
    });
  }
};

// @desc    Seed default academic subjects for user
// @route   POST /api/subjects/defaults
// @access  Protected
exports.seedDefaultSubjects = async (req, res) => {
  try {
    const userId = req.user.userId;
    const existing = await Subject.find({ userId });
    const existingNames = existing.map((s) => s.name.toLowerCase());

    const toInsert = DEFAULT_SUBJECTS
      .filter((s) => !existingNames.includes(s.name.toLowerCase()))
      .map((s) => ({ ...s, userId }));

    let inserted = [];
    if (toInsert.length > 0) {
      inserted = await Subject.insertMany(toInsert);
    }

    const allSubjects = await Subject.find({ userId }).sort({ name: 1 });

    return res.status(200).json({
      success: true,
      message: `Added ${inserted.length} default subjects successfully`,
      data: allSubjects,
    });
  } catch (error) {
    console.error('[Seed Defaults Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error adding default subjects',
    });
  }
};

