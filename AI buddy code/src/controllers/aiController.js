const geminiService = require('../services/geminiService');

// @desc    Chat with AI Study Buddy
// @route   POST /api/ai/chat
// @access  Protected
exports.chat = async (req, res) => {
  try {
    const { messages, message, context } = req.body;
    const conversation = messages || (message ? [{ role: 'user', content: message }] : []);

    if (!conversation || conversation.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'A message or messages array is required',
      });
    }

    const reply = await geminiService.chatWithAI(conversation, context);

    return res.status(200).json({
      success: true,
      message: 'AI response generated successfully',
      data: { reply },
    });
  } catch (error) {
    console.error('[AI Chat Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error generating AI chat response',
    });
  }
};

// @desc    Generate summary from raw text
// @route   POST /api/ai/summary
// @access  Protected
exports.generateSummary = async (req, res) => {
  try {
    const { content, title } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required for summary generation',
      });
    }

    const summaryResult = await geminiService.generateSummary(content, title || 'Study Material');

    return res.status(200).json({
      success: true,
      message: 'Summary generated successfully',
      data: summaryResult,
    });
  } catch (error) {
    console.error('[AI Summary Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error generating AI summary',
    });
  }
};

// @desc    Explain an academic topic
// @route   POST /api/ai/explain
// @access  Protected
exports.explainTopic = async (req, res) => {
  try {
    const { topic, level } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: 'Topic is required',
      });
    }

    const explanation = await geminiService.explainTopic(topic, level || 'undergraduate');

    return res.status(200).json({
      success: true,
      message: 'Topic explained successfully',
      data: { explanation },
    });
  } catch (error) {
    console.error('[AI Explain Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error generating explanation',
    });
  }
};

// @desc    Generate flashcards from raw content
// @route   POST /api/ai/flashcards
// @access  Protected
exports.generateFlashcards = async (req, res) => {
  try {
    const { content, count = 5 } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required to generate flashcards',
      });
    }

    const flashcards = await geminiService.generateFlashcards(content, parseInt(count, 10) || 5);

    return res.status(200).json({
      success: true,
      message: 'Flashcards generated successfully',
      data: flashcards,
    });
  } catch (error) {
    console.error('[AI Flashcards Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error generating flashcards',
    });
  }
};

// @desc    Generate quiz from raw content
// @route   POST /api/ai/quiz
// @access  Protected
exports.generateQuiz = async (req, res) => {
  try {
    const { content, subject, count = 5 } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required to generate quiz',
      });
    }

    const questions = await geminiService.generateQuiz(content, subject || 'General', parseInt(count, 10) || 5);

    return res.status(200).json({
      success: true,
      message: 'Quiz generated successfully',
      data: questions,
    });
  } catch (error) {
    console.error('[AI Quiz Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error generating quiz',
    });
  }
};

// @desc    Generate study plan
// @route   POST /api/ai/study-plan
// @access  Protected
exports.generateStudyPlan = async (req, res) => {
  try {
    const { subject, materials, dailyHours, examDate } = req.body;

    if (!subject) {
      return res.status(400).json({
        success: false,
        message: 'Subject is required to generate study plan',
      });
    }

    const plan = await geminiService.generateStudyPlan(subject, materials, dailyHours, examDate);

    return res.status(200).json({
      success: true,
      message: 'Study plan generated successfully',
      data: plan,
    });
  } catch (error) {
    console.error('[AI Study Plan Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error generating study plan',
    });
  }
};
