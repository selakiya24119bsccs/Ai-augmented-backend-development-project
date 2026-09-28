const mongoose = require('mongoose');
const Summary = require('../models/Summary');
const StudyMaterial = require('../models/StudyMaterial');
const geminiService = require('../services/geminiService');

// @desc    Get all summaries for logged-in user
// @route   GET /api/summaries
// @access  Protected
exports.getSummaries = async (req, res) => {
  try {
    const { materialId } = req.query;
    const query = { userId: req.user.userId };
    if (materialId && mongoose.Types.ObjectId.isValid(materialId)) {
      query.materialId = materialId;
    }

    const summaries = await Summary.find(query)
      .populate('materialId', 'title subject')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Summaries retrieved successfully',
      data: summaries,
    });
  } catch (error) {
    console.error('[Get Summaries Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Create/generate summary from study material
// @route   POST /api/summaries
// @access  Protected
exports.createSummary = async (req, res) => {
  try {
    const { materialId, customPrompt } = req.body;

    if (!materialId || !mongoose.Types.ObjectId.isValid(materialId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid materialId is required',
      });
    }

    const material = await StudyMaterial.findOne({
      _id: materialId,
      userId: req.user.userId,
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Study material not found',
      });
    }

    // Call Gemini AI
    const aiResult = await geminiService.generateSummary(material.content, material.title);

    const summary = new Summary({
      userId: req.user.userId,
      materialId: material._id,
      summary: aiResult.summary || (typeof aiResult === 'string' ? aiResult : ''),
      shortSummary: aiResult.shortSummary || '',
      importantPoints: Array.isArray(aiResult.importantPoints) ? aiResult.importantPoints : (Array.isArray(aiResult.keyPoints) ? aiResult.keyPoints : []),
      keyTerms: Array.isArray(aiResult.keyTerms) ? aiResult.keyTerms : [],
      mainConcepts: Array.isArray(aiResult.mainConcepts) ? aiResult.mainConcepts : [],
      keyPoints: Array.isArray(aiResult.keyPoints) ? aiResult.keyPoints : (Array.isArray(aiResult.importantPoints) ? aiResult.importantPoints : []),
    });

    await summary.save();
    await summary.populate('materialId', 'title subject');

    return res.status(201).json({
      success: true,
      message: 'Summary generated and saved successfully',
      data: summary,
    });
  } catch (error) {
    console.error('[Create Summary Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate summary',
    });
  }
};

// @desc    Get summary by ID
// @route   GET /api/summaries/:id
// @access  Protected
exports.getSummaryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid summary ID',
      });
    }

    const summary = await Summary.findOne({
      _id: id,
      userId: req.user.userId,
    }).populate('materialId', 'title subject');

    if (!summary) {
      return res.status(404).json({
        success: false,
        message: 'Summary not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Summary retrieved successfully',
      data: summary,
    });
  } catch (error) {
    console.error('[Get Summary By ID Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Delete summary
// @route   DELETE /api/summaries/:id
// @access  Protected
exports.deleteSummary = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid summary ID',
      });
    }

    const summary = await Summary.findOneAndDelete({
      _id: id,
      userId: req.user.userId,
    });

    if (!summary) {
      return res.status(404).json({
        success: false,
        message: 'Summary not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Summary deleted successfully',
      data: { id },
    });
  } catch (error) {
    console.error('[Delete Summary Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};
