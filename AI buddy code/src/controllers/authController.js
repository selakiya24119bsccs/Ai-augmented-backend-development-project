const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Subject = require('../models/Subject');
const { DEFAULT_SUBJECTS } = require('./subjectController');

const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'super_secret_ai_study_buddy_jwt_key_2025_secure_xyz';
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    secret,
    { expiresIn: '7d' }
  );
};

// @desc    Register a new student
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // Role is strictly forced to "student" for normal registration
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'student',
    });

    await user.save();

    // Auto-create default academic subjects for new user
    try {
      if (Array.isArray(DEFAULT_SUBJECTS) && DEFAULT_SUBJECTS.length > 0) {
        const userSubjects = DEFAULT_SUBJECTS.map((s) => ({ ...s, userId: user._id }));
        await Subject.insertMany(userSubjects);
      }
    } catch (subjErr) {
      console.warn('[Auto-create subjects on register warning]:', subjErr.message);
    }

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('[Auth Register Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration',
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('[Auth Login Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login',
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public / Protected
exports.logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
    data: {},
  });
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Protected
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('[Auth getMe Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};
