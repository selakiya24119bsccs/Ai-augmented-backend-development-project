# AI Study Buddy 🧠

**AI Study Buddy** is a complete, full-stack, AI-powered academic learning platform built with Node.js, Express.js, MongoDB/Mongoose, Google Gemini AI, and a responsive HTML5/CSS3/JavaScript frontend.

The platform allows students to register and log in, upload and organize study materials across academic subjects, generate AI summaries, create 3D interactive flashcards, take AI-generated quizzes with instant scoring and detailed review, build personalized study plans for upcoming exams, chat in real-time with an AI study assistant, and track their comprehensive learning progress.

---

## 🌟 Features

- 🔐 **Authentication & Security:**
  - Secure student registration & login with hashed passwords (`bcryptjs`).
  - Strict role enforcement (`student` role default).
  - Protected API routes and authenticated session management using JSON Web Tokens (JWT).
  - Strict data isolation: students can only access, view, edit, and delete their own study materials and AI-generated content.

- 📝 **Study Materials & Subject Organization:**
  - Create, view, edit, search, and delete course notes and materials.
  - Automatic curriculum subject grouping and filtering.
  - Full-text search across titles, subjects, and lecture contents.

- 📄 **Gemini AI Summaries:**
  - Generate structured academic summaries with key takeaways and bullet points.
  - Save, read, and delete generated summaries.

- 🃏 **Interactive 3D Flashcards:**
  - Generate flashcard decks from study materials using Gemini AI.
  - Realistic 3D flip card animations (`CSS perspective` and `rotateY`).
  - Keyboard shortcuts (Space to flip, Arrow keys to navigate) and touch support.
  - Active recall counter ("Card X of Y").

- ❓ **AI Quiz Generator & Grader:**
  - Generate customizable multiple-choice quizzes (3, 5, or 10 questions) based on uploaded notes or specific subjects.
  - Interactive multi-step quiz taker with radio choices.
  - Instant automated grading with total questions, correct/wrong counts, score, and percentage.
  - In-depth answer review highlighting chosen answers vs correct answers.

- 📅 **AI Study Plan Generator:**
  - Create structured, personalized day-by-day exam roadmaps.
  - Configurable target exam dates, daily study hours, and contextual materials.
  - Timeline card visualization with daily objectives and recommended actions.

- 🤖 **AI Study Buddy Chat:**
  - Real-time academic chat assistant with preset prompt starters.
  - Formatted explanations, markdown support, code blocks, and formula breakdowns.
  - Session history and instant context clearing.

- 📊 **Progress & Learning Analytics:**
  - Real-time aggregated statistics: study materials uploaded, summaries created, flashcards generated, quizzes completed, and average quiz mastery score.
  - Visual progress tracking bars and subject distribution tags.
  - Chronological activity log.

- 📱 **Modern & Responsive UI/UX:**
  - Clean desktop layout with sidebar navigation.
  - Mobile off-canvas drawer navigation.
  - Dynamic modal dialogs, loading states, empty state guidance, and toast notifications.

---

## 🛠️ Technology Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose ODM
- **AI Service:** Google Gemini API (`@google/generative-ai`)
- **Authentication:** JWT (`jsonwebtoken`), `bcryptjs`
- **Frontend:** HTML5, CSS3 (Modern Flexbox/Grid/3D transforms), Vanilla JavaScript (Modular SPA)

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory (refer to `.env.example`):

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/ai_study_buddy
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=your_secure_jwt_secret_key_here
```

*(Note: The system includes intelligent fallback generation if `GEMINI_API_KEY` is not provided or quota-limited, ensuring the application remains fully testable and operational).*

---

## 🚀 Quick Start

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Start the Application:**
   ```bash
   npm start
   ```

3. **Access the Application:**
   - Web App: [http://localhost:5000](http://localhost:5000)
   - Health Check: [http://localhost:5000/api/health](http://localhost:5000/api/health)

4. **Run Automated Test Suite:**
   ```bash
   npm test
   ```

---

## 📡 API Overview

| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `GET` | `/api/health` | Service health status check | No |
| `POST` | `/api/auth/register` | Register new student account | No |
| `POST` | `/api/auth/login` | Log in and receive JWT token | No |
| `POST` | `/api/auth/logout` | End session | Yes |
| `GET` | `/api/auth/me` | Current authenticated user profile | Yes |
| `GET` | `/api/materials` | List user materials (search & filter) | Yes |
| `POST` | `/api/materials` | Upload new study material | Yes |
| `GET` | `/api/materials/:id` | View specific study material | Yes |
| `PUT` | `/api/materials/:id` | Update study material | Yes |
| `DELETE` | `/api/materials/:id` | Delete study material | Yes |
| `GET` | `/api/summaries` | List user summaries | Yes |
| `POST` | `/api/summaries` | Generate AI summary from material | Yes |
| `GET` | `/api/summaries/:id` | View specific summary | Yes |
| `DELETE` | `/api/summaries/:id` | Delete summary | Yes |
| `GET` | `/api/flashcards` | List flashcards (filter by material) | Yes |
| `POST` | `/api/flashcards` | Generate AI flashcards | Yes |
| `GET` | `/api/flashcards/:id` | Get specific flashcard | Yes |
| `DELETE` | `/api/flashcards/:id` | Delete flashcard | Yes |
| `GET` | `/api/quizzes` | List user quizzes | Yes |
| `POST` | `/api/quizzes` | Generate AI quiz | Yes |
| `GET` | `/api/quizzes/:id` | Get quiz questions | Yes |
| `POST` | `/api/quizzes/:id/submit` | Submit answers & get graded review | Yes |
| `DELETE` | `/api/quizzes/:id` | Delete quiz | Yes |
| `GET` | `/api/study-plans` | List user study plans | Yes |
| `POST` | `/api/study-plans` | Generate AI study plan | Yes |
| `GET` | `/api/study-plans/:id` | View study plan | Yes |
| `PUT` | `/api/study-plans/:id` | Update study plan | Yes |
| `DELETE` | `/api/study-plans/:id` | Delete study plan | Yes |
| `POST` | `/api/ai/chat` | Chat with AI Study Buddy | Yes |
| `POST` | `/api/ai/explain` | Get academic concept explanation | Yes |
| `GET` | `/api/subjects` | List subjects with material count | Yes |
| `GET` | `/api/subjects/:subject` | Get materials under subject | Yes |
| `GET` | `/api/progress` | Get user analytics & activity timeline | Yes |
