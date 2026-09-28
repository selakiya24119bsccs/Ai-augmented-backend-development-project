const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const StudyMaterial = require('../models/StudyMaterial');
const Subject = require('../models/Subject');
const Summary = require('../models/Summary');
const Flashcard = require('../models/Flashcard');
const Quiz = require('../models/Quiz');

let pdfParse = null;
try {
  pdfParse = require('pdf-parse');
} catch (e) {
  console.warn('[Material Controller] pdf-parse optional module not loaded yet');
}

// @desc    Get all study materials for logged-in user
// @route   GET /api/materials
// @access  Protected
exports.getMaterials = async (req, res) => {
  try {
    const { search, subject } = req.query;
    const query = { userId: req.user.userId };

    if (subject && subject.trim()) {
      query.subject = { $regex: new RegExp(`^${subject.trim()}$`, 'i') };
    }

    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { content: { $regex: search.trim(), $options: 'i' } },
        { subject: { $regex: search.trim(), $options: 'i' } },
        { originalFileName: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const materials = await StudyMaterial.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Study materials retrieved successfully',
      data: materials,
    });
  } catch (error) {
    console.error('[Get Materials Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Create a new study material (supports JSON notes or multipart file uploads)
// @route   POST /api/materials
// @access  Protected
exports.createMaterial = async (req, res) => {
  try {
    let { title, subject, content, subjectId } = req.body;
    let fileType = 'notes';
    let originalFileName = null;
    let fileUrl = null;
    let fileSize = 0;

    // Handle file upload if present
    if (req.file) {
      originalFileName = req.file.originalname;
      fileSize = req.file.size;
      fileUrl = `/uploads/${req.file.filename}`;

      const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
      fileType = ext || 'file';

      if (!title || !title.trim()) {
        title = path.basename(req.file.originalname, path.extname(req.file.originalname));
      }

      // Extract text content from file
      try {
        const filePath = req.file.path;
        if (ext === 'txt' || ext === 'md' || ext === 'csv' || ext === 'json') {
          const fileText = fs.readFileSync(filePath, 'utf8');
          content = content ? `${content}\n\n${fileText}` : fileText;
        } else if (ext === 'pdf' && pdfParse) {
          const dataBuffer = fs.readFileSync(filePath);
          const pdfData = await pdfParse(dataBuffer);
          const extractedText = pdfData.text ? pdfData.text.trim() : '';
          content = content ? `${content}\n\n${extractedText}` : (extractedText || `PDF Document: ${originalFileName}`);
        } else {
          if (!content) {
            content = `Uploaded ${ext.toUpperCase()} document: ${originalFileName}. Contents ready for AI study synthesis.`;
          }
        }
      } catch (extractErr) {
        console.warn('[Text Extraction Warning]:', extractErr.message);
        if (!content) content = `Uploaded file: ${originalFileName}`;
      }
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Title is required',
      });
    }

    if (!subject || !subject.trim()) {
      subject = 'General';
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Content or uploaded file text is required',
      });
    }

    // Auto-create Subject in Subject collection if not yet present
    try {
      const existingSubj = await Subject.findOne({
        userId: req.user.userId,
        name: { $regex: new RegExp(`^${subject.trim()}$`, 'i') },
      });
      if (!existingSubj) {
        const newSubj = new Subject({
          userId: req.user.userId,
          name: subject.trim(),
        });
        await newSubj.save();
        subjectId = newSubj._id;
      } else {
        subjectId = existingSubj._id;
      }
    } catch (e) {
      // Ignore subject auto-create errors
    }

    const material = new StudyMaterial({
      userId: req.user.userId,
      subjectId: subjectId && mongoose.Types.ObjectId.isValid(subjectId) ? subjectId : null,
      title: title.trim(),
      subject: subject.trim(),
      content: content.trim(),
      fileType,
      originalFileName,
      fileUrl,
      fileSize,
    });

    await material.save();

    return res.status(201).json({
      success: true,
      message: 'Study material created successfully',
      data: material,
    });
  } catch (error) {
    console.error('[Create Material Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating study material',
    });
  }
};

// @desc    Get study material by ID
// @route   GET /api/materials/:id
// @access  Protected
exports.getMaterialById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid study material ID',
      });
    }

    const material = await StudyMaterial.findOne({
      _id: id,
      userId: req.user.userId,
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Study material not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Study material retrieved successfully',
      data: material,
    });
  } catch (error) {
    console.error('[Get Material By ID Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Update study material
// @route   PUT /api/materials/:id
// @access  Protected
exports.updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subject, content, subjectId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid study material ID',
      });
    }

    const material = await StudyMaterial.findOne({
      _id: id,
      userId: req.user.userId,
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Study material not found',
      });
    }

    if (title) material.title = title.trim();
    if (subject) material.subject = subject.trim();
    if (content) material.content = content.trim();
    if (subjectId && mongoose.Types.ObjectId.isValid(subjectId)) {
      material.subjectId = subjectId;
    }

    await material.save();

    return res.status(200).json({
      success: true,
      message: 'Study material updated successfully',
      data: material,
    });
  } catch (error) {
    console.error('[Update Material Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Delete study material
// @route   DELETE /api/materials/:id
// @access  Protected
exports.deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid study material ID',
      });
    }

    const material = await StudyMaterial.findOneAndDelete({
      _id: id,
      userId: req.user.userId,
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Study material not found',
      });
    }

    // Cascade delete associated summaries and flashcards
    await Promise.all([
      Summary.deleteMany({ materialId: id, userId: req.user.userId }),
      Flashcard.deleteMany({ materialId: id, userId: req.user.userId }),
      Quiz.deleteMany({ materialId: id, userId: req.user.userId }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Study material and associated items deleted successfully',
      data: { id },
    });
  } catch (error) {
    console.error('[Delete Material Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Seed comprehensive course study materials for user
// @route   POST /api/materials/defaults
// @access  Protected
exports.seedDefaultMaterials = async (req, res) => {
  try {
    const DEFAULT_COURSE_MATERIALS = require('../data/defaultCourseMaterials');
    const userId = req.user.userId;
    const subjects = await Subject.find({ userId });
    const subjectMap = {};
    subjects.forEach((s) => {
      subjectMap[s.name.toLowerCase()] = s._id;
    });

    const inserted = [];
    for (const m of DEFAULT_COURSE_MATERIALS) {
      const existing = await StudyMaterial.findOne({ userId, title: m.title });
      if (!existing) {
        const doc = new StudyMaterial({
          ...m,
          userId,
          subjectId: subjectMap[m.subject.toLowerCase()] || null,
          fileType: 'notes',
          createdAt: new Date(),
        });
        await doc.save();
        inserted.push(doc);
      }
    }

    const allMaterials = await StudyMaterial.find({ userId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: `Added ${inserted.length} course study materials`,
      data: allMaterials,
    });
  } catch (error) {
    console.error('[Seed Default Materials Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error loading course materials',
    });
  }
};

