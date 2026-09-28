const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Malformed token.',
      });
    }

    const secret = process.env.JWT_SECRET || 'super_secret_ai_study_buddy_jwt_key_2025_secure_xyz';
    const decoded = jwt.verify(token, secret);

    req.user = {
      userId: decoded.userId || decoded.id,
      email: decoded.email,
      role: decoded.role || 'student',
      name: decoded.name,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication token has expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token.',
    });
  }
};

module.exports = authMiddleware;
