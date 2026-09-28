require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

// Import route modules
const authRoutes = require('./routes/authRoutes');
const materialRoutes = require('./routes/materialRoutes');
const summaryRoutes = require('./routes/summaryRoutes');
const flashcardRoutes = require('./routes/flashcardRoutes');
const quizRoutes = require('./routes/quizRoutes');
const studyPlanRoutes = require('./routes/studyPlanRoutes');
const aiRoutes = require('./routes/aiRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const progressRoutes = require('./routes/progressRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Core Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static frontend assets & uploaded files
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health Check Endpoint (Required format: { "status": "online", "app": "AI Study Buddy" })
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    app: 'AI Study Buddy',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/summaries', summaryRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/study-plans', studyPlanRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/progress', progressRoutes);

// Fallback for SPA navigation - serve index.html for non-API GET requests
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      message: `API endpoint ${req.method} ${req.path} not found`,
    });
  }
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Process Exception & Signal Handlers
process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection]:', reason);
});

// Start Server
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`  AI Study Buddy Server is running!`);
    console.log(`  URL: http://localhost:${PORT}`);
    console.log(`  Health: http://localhost:${PORT}/api/health`);
    console.log(`=========================================`);
  });

  server.on('error', (err) => {
    console.error('[Server Listen Error]:', err);
  });
}

module.exports = app;

