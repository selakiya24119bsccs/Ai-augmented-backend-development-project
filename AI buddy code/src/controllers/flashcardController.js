const mongoose = require('mongoose');
const Flashcard = require('../models/Flashcard');
const StudyMaterial = require('../models/StudyMaterial');
const geminiService = require('../services/geminiService');

// @desc    Get all flashcards for logged-in user
// @route   GET /api/flashcards
// @access  Protected
exports.getFlashcards = async (req, res) => {
  try {
    const { materialId } = req.query;
    const query = { userId: req.user.userId };

    if (materialId && mongoose.Types.ObjectId.isValid(materialId)) {
      query.materialId = materialId;
    }

    const flashcards = await Flashcard.find(query)
      .populate('materialId', 'title subject')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Flashcards retrieved successfully',
      data: flashcards,
    });
  } catch (error) {
    console.error('[Get Flashcards Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Generate and save flashcards from study material
// @route   POST /api/flashcards
// @access  Protected
exports.createFlashcards = async (req, res) => {
  try {
    const { materialId, count = 5 } = req.body;

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

    const cardsData = await geminiService.generateFlashcards(material.content, count);

    const createdCards = [];
    for (const card of cardsData) {
      if (card.question && card.answer) {
        const fc = new Flashcard({
          userId: req.user.userId,
          materialId: material._id,
          question: card.question,
          answer: card.answer,
        });
        await fc.save();
        createdCards.push(fc);
      }
    }

    return res.status(201).json({
      success: true,
      message: `Generated and saved ${createdCards.length} flashcards`,
      data: createdCards,
    });
  } catch (error) {
    console.error('[Create Flashcards Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate flashcards',
    });
  }
};

// @desc    Get flashcard by ID
// @route   GET /api/flashcards/:id
// @access  Protected
exports.getFlashcardById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid flashcard ID',
      });
    }

    const flashcard = await Flashcard.findOne({
      _id: id,
      userId: req.user.userId,
    }).populate('materialId', 'title subject');

    if (!flashcard) {
      return res.status(404).json({
        success: false,
        message: 'Flashcard not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Flashcard retrieved successfully',
      data: flashcard,
    });
  } catch (error) {
    console.error('[Get Flashcard By ID Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Delete flashcard
// @route   DELETE /api/flashcards/:id
// @access  Protected
exports.deleteFlashcard = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid flashcard ID',
      });
    }

    const flashcard = await Flashcard.findOneAndDelete({
      _id: id,
      userId: req.user.userId,
    });

    if (!flashcard) {
      return res.status(404).json({
        success: false,
        message: 'Flashcard not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Flashcard deleted successfully',
      data: { id },
    });
  } catch (error) {
    console.error('[Delete Flashcard Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Toggle studied status of a flashcard
// @route   PATCH /api/flashcards/:id/study
// @access  Protected
exports.toggleStudied = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid flashcard ID',
      });
    }

    const flashcard = await Flashcard.findOne({
      _id: id,
      userId: req.user.userId,
    });

    if (!flashcard) {
      return res.status(404).json({
        success: false,
        message: 'Flashcard not found',
      });
    }

    flashcard.isStudied = !flashcard.isStudied;
    if (flashcard.isStudied) {
      flashcard.studyCount = (flashcard.studyCount || 0) + 1;
      flashcard.studiedAt = new Date();
    }
    await flashcard.save();

    return res.status(200).json({
      success: true,
      message: flashcard.isStudied ? 'Flashcard marked as studied!' : 'Flashcard marked for review',
      data: flashcard,
    });
  } catch (error) {
    console.error('[Toggle Studied Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating flashcard',
    });
  }
};

