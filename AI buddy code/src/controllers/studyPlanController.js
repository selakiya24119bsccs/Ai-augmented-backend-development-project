const mongoose = require('mongoose');
const StudyPlan = require('../models/StudyPlan');
const StudyMaterial = require('../models/StudyMaterial');
const geminiService = require('../services/geminiService');

// @desc    Get all study plans / tasks for logged-in user
// @route   GET /api/study-plans
// @access  Protected
exports.getStudyPlans = async (req, res) => {
  try {
    const plans = await StudyPlan.find({ userId: req.user.userId }).sort({ date: 1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Study plans retrieved successfully',
      data: plans,
    });
  } catch (error) {
    console.error('[Get Study Plans Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get today's study tasks
// @route   GET /api/study-plans/today
// @access  Protected
exports.getTodayTasks = async (req, res) => {
  try {
    const userId = req.user.userId;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Return tasks specifically for today, or pending tasks
    const tasks = await StudyPlan.find({
      userId,
      $or: [
        { date: { $gte: startOfDay, $lte: endOfDay } },
        { date: null },
      ],
    }).sort({ isCompleted: 1, startTime: 1 });

    return res.status(200).json({
      success: true,
      message: "Today's study tasks retrieved successfully",
      data: tasks,
    });
  } catch (error) {
    console.error('[Get Today Tasks Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error retrieving today's tasks",
    });
  }
};

// @desc    Create/generate a new study plan or study task
// @route   POST /api/study-plans
// @access  Protected
exports.createStudyPlan = async (req, res) => {
  try {
    const { subject, topic, date, startTime, duration, examDate, availableTime, materialIds, isTaskOnly } = req.body;

    if (!subject) {
      return res.status(400).json({
        success: false,
        message: 'Subject is required',
      });
    }

    let parsedDate = date ? new Date(date) : (examDate ? new Date(examDate) : new Date());
    let aiPlan = null;

    // If it's a full AI Roadmap (or not task-only)
    if (!isTaskOnly) {
      let materialsContext = '';
      if (Array.isArray(materialIds) && materialIds.length > 0) {
        const materials = await StudyMaterial.find({
          _id: { $in: materialIds },
          userId: req.user.userId,
        });
        materialsContext = materials.map(m => `Title: ${m.title}\nContent: ${m.content}`).join('\n\n');
      } else {
        const materials = await StudyMaterial.find({
          userId: req.user.userId,
          subject: { $regex: new RegExp(`^${subject}$`, 'i') },
        });
        materialsContext = materials.map(m => m.content).join('\n\n');
      }

      aiPlan = await geminiService.generateStudyPlan(
        subject,
        materialsContext,
        availableTime || duration || '2 hours/day',
        examDate || date
      );
    }

    const studyPlan = new StudyPlan({
      userId: req.user.userId,
      subject: subject.trim(),
      topic: topic ? topic.trim() : (aiPlan ? aiPlan.title : subject),
      date: parsedDate,
      startTime: startTime || '09:00 AM',
      duration: duration || availableTime || '1 hour',
      examDate: examDate ? new Date(examDate) : parsedDate,
      availableTime: availableTime || duration || '2 hours/day',
      studyPlan: aiPlan || {
        title: topic || `Study Session: ${subject}`,
        schedule: [
          {
            day: 'Session 1',
            title: topic || subject,
            duration: duration || '1 hour',
            topics: [topic || subject],
            recommendedActions: 'Read notes and practice flashcards',
          },
        ],
      },
      isCompleted: false,
    });

    await studyPlan.save();

    return res.status(201).json({
      success: true,
      message: 'Study plan / task created successfully',
      data: studyPlan,
    });
  } catch (error) {
    console.error('[Create Study Plan Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate study plan',
    });
  }
};

// @desc    Toggle task completion status
// @route   PATCH /api/study-plans/:id/toggle
// @access  Protected
exports.toggleTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid study plan ID',
      });
    }

    const plan = await StudyPlan.findOne({
      _id: id,
      userId: req.user.userId,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Study task not found',
      });
    }

    plan.isCompleted = !plan.isCompleted;
    plan.completedAt = plan.isCompleted ? new Date() : null;
    await plan.save();

    return res.status(200).json({
      success: true,
      message: plan.isCompleted ? 'Study task marked completed! 🎉' : 'Study task marked pending',
      data: plan,
    });
  } catch (error) {
    console.error('[Toggle Study Task Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating task',
    });
  }
};

// @desc    Get study plan by ID
// @route   GET /api/study-plans/:id
// @access  Protected
exports.getStudyPlanById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid study plan ID',
      });
    }

    const plan = await StudyPlan.findOne({
      _id: id,
      userId: req.user.userId,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Study plan not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Study plan retrieved successfully',
      data: plan,
    });
  } catch (error) {
    console.error('[Get Study Plan By ID Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Update study plan
// @route   PUT /api/study-plans/:id
// @access  Protected
exports.updateStudyPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, topic, date, startTime, duration, examDate, availableTime, studyPlan: updatedContent, isCompleted } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid study plan ID',
      });
    }

    const plan = await StudyPlan.findOne({
      _id: id,
      userId: req.user.userId,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Study plan not found',
      });
    }

    if (subject) plan.subject = subject.trim();
    if (topic) plan.topic = topic.trim();
    if (date) plan.date = new Date(date);
    if (startTime) plan.startTime = startTime;
    if (duration) plan.duration = duration;
    if (examDate) plan.examDate = new Date(examDate);
    if (availableTime) plan.availableTime = availableTime;
    if (updatedContent) plan.studyPlan = updatedContent;
    if (isCompleted !== undefined) {
      plan.isCompleted = isCompleted;
      plan.completedAt = isCompleted ? new Date() : null;
    }

    await plan.save();

    return res.status(200).json({
      success: true,
      message: 'Study plan updated successfully',
      data: plan,
    });
  } catch (error) {
    console.error('[Update Study Plan Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Delete study plan
// @route   DELETE /api/study-plans/:id
// @access  Protected
exports.deleteStudyPlan = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid study plan ID',
      });
    }

    const plan = await StudyPlan.findOneAndDelete({
      _id: id,
      userId: req.user.userId,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Study plan not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Study plan deleted successfully',
      data: { id },
    });
  } catch (error) {
    console.error('[Delete Study Plan Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};
