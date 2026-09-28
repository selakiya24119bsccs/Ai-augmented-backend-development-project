// quiz.js - Quiz Generation, Interactive Taking, Scoring, and Attempts History

const QuizModule = {
  quizzes: [],
  attemptsHistory: [],
  activeQuiz: null,
  currentQuestionIndex: 0,
  userAnswers: {}, // { 0: "Option text", 1: "Option text" }

  async init() {
    await this.loadQuizzes();
    await this.loadAttemptsHistory();
    this.bindEvents();
  },

  bindEvents() {
    const btnOpenGen = document.getElementById('btn-open-gen-quiz-modal');
    if (btnOpenGen) {
      btnOpenGen.onclick = () => this.openGenerateModal();
    }

    const btnPrev = document.getElementById('btn-quiz-prev');
    if (btnPrev) {
      btnPrev.onclick = () => this.prevQuestion();
    }

    const btnNext = document.getElementById('btn-quiz-next');
    if (btnNext) {
      btnNext.onclick = () => this.nextQuestion();
    }

    const btnSubmit = document.getElementById('btn-quiz-submit');
    if (btnSubmit) {
      btnSubmit.onclick = () => this.submitQuiz();
    }
  },

  async loadQuizzes() {
    try {
      const res = await fetch('/api/quizzes', { headers: Auth.getAuthHeaders() });
      const json = await res.json();
      if (res.ok && json.success) {
        this.quizzes = json.data || [];
        this.renderQuizzesList(this.quizzes);
      }
    } catch (err) {
      console.error('Error loading quizzes:', err);
    }
  },

  async loadAttemptsHistory() {
    try {
      const res = await fetch('/api/quizzes/attempts/history', { headers: Auth.getAuthHeaders() });
      const json = await res.json();
      if (res.ok && json.success) {
        this.attemptsHistory = json.data || [];
        this.renderAttemptsHistory(this.attemptsHistory);
      }
    } catch (err) {
      console.error('Error loading quiz attempts history:', err);
    }
  },

  renderQuizzesList(list) {
    const container = document.getElementById('quizzes-list');
    if (!container) return;

    if (!list || list.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">❓</div>
          <h3>No Quizzes Generated Yet</h3>
          <p>Test your academic mastery by generating a tailored AI quiz from your notes.</p>
          <button class="btn btn-primary" onclick="QuizModule.openGenerateModal()">Generate New Quiz</button>
        </div>`;
      return;
    }

    container.innerHTML = list
      .map((q) => {
        const dateStr = q.createdAt ? new Date(q.createdAt).toLocaleDateString() : '';
        const attempt = q.lastAttempt && q.lastAttempt.percentage !== null
          ? `${q.lastAttempt.percentage}% (${q.lastAttempt.score}/${q.lastAttempt.totalQuestions})`
          : 'Not attempted';

        return `
          <div class="quiz-card">
            <div>
              <div class="mat-header">
                <span class="badge">${App.escapeHtml(q.subject || 'General')}</span>
                <span style="font-size: 0.75rem; color: var(--text-muted);">${dateStr}</span>
              </div>
              <h3 class="mat-title">${App.escapeHtml(q.title || 'AI Quiz')}</h3>
              <p style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 12px;">
                ${q.questions ? q.questions.length : 0} Multiple Choice Questions
              </p>
              <p style="font-size: 0.8125rem; margin-bottom: 16px;">
                <strong>Best / Last Score:</strong> <span style="color: var(--primary); font-weight: 700;">${attempt}</span>
              </p>
            </div>
            <div class="mat-footer">
              <button class="btn btn-primary" style="font-size: 0.8125rem; padding: 6px 12px;" onclick="QuizModule.startQuiz('${q._id}')">
                ${q.lastAttempt && q.lastAttempt.percentage !== null ? 'Retake Quiz' : 'Take Quiz'}
              </button>
              <button class="btn btn-danger" style="font-size: 0.8125rem; padding: 6px 10px;" onclick="QuizModule.deleteQuiz('${q._id}')">Delete</button>
            </div>
          </div>
        `;
      })
      .join('');
  },

  renderAttemptsHistory(history) {
    const container = document.getElementById('quiz-attempts-history');
    if (!container) return;

    if (!history || history.length === 0) {
      container.innerHTML = `<div class="empty-state-sm">No quiz attempts recorded yet. Take your first quiz above!</div>`;
      return;
    }

    container.innerHTML = history
      .map((att) => {
        const quizTitle = att.quizId ? att.quizId.title : 'AI Quiz';
        const quizSubj = att.quizId ? att.quizId.subject : 'General';
        const dateStr = att.submittedAt
          ? new Date(att.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          : 'Recently';

        const pct = att.percentage || 0;
        let scoreBg = '#ecfdf5';
        let scoreColor = '#059669';
        if (pct < 50) {
          scoreBg = '#fef2f2';
          scoreColor = '#dc2626';
        } else if (pct < 70) {
          scoreBg = '#fffbeb';
          scoreColor = '#d97706';
        }

        return `
          <div class="timeline-item" style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span class="tl-icon" style="background: ${scoreBg}; color: ${scoreColor}; font-weight: 800; font-size: 0.85rem;">
                ${pct}%
              </span>
              <div class="tl-content">
                <strong>${App.escapeHtml(quizTitle)}</strong>
                <span>${App.escapeHtml(quizSubj)} • ${att.score}/${att.totalQuestions} Correct (${att.wrong} wrong) • ${dateStr}</span>
              </div>
            </div>
            <button class="btn btn-secondary" style="font-size: 0.75rem; padding: 4px 8px;" onclick="QuizModule.reviewPastAttempt('${att._id}')">
              Review Answers
            </button>
          </div>
        `;
      })
      .join('');
  },

  reviewPastAttempt(attemptId) {
    const att = this.attemptsHistory.find((a) => a._id === attemptId);
    if (!att) return;

    const quizTitle = att.quizId ? att.quizId.title : 'Quiz Review';
    const reviewsHtml = (att.answersReview || [])
      .map((item, idx) => {
        const statusClass = item.isCorrect ? 'correct' : 'wrong';
        const statusText = item.isCorrect ? '✅ Correct' : '❌ Incorrect';
        return `
          <div class="review-item ${statusClass}" style="margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <strong>Question ${idx + 1}</strong>
              <span style="font-weight: 700; font-size: 0.8125rem;">${statusText}</span>
            </div>
            <h4>${App.escapeHtml(item.question)}</h4>
            <div style="margin-top: 10px;">
              <div style="margin-bottom: 4px;">
                <span class="review-answer-pill ${item.isCorrect ? 'pill-correct' : 'pill-wrong'}">Your Answer:</span>
                <span>${App.escapeHtml(item.userAnswer || 'No answer')}</span>
              </div>
              ${
                !item.isCorrect
                  ? `<div>
                      <span class="review-answer-pill pill-correct">Correct Answer:</span>
                      <span>${App.escapeHtml(item.correctAnswer || '')}</span>
                     </div>`
                  : ''
              }
            </div>
          </div>
        `;
      })
      .join('');

    const content = `
      <div style="margin-bottom: 16px;">
        <span class="badge">Quiz Review</span>
        <h2 style="font-size: 1.35rem; margin-top: 8px;">Attempt: ${App.escapeHtml(quizTitle)}</h2>
        <p style="color: var(--text-muted); font-size: 0.875rem;">
          Final Score: <strong style="color: var(--primary);">${att.percentage}%</strong> (${att.score} of ${att.totalQuestions} correct)
        </p>
      </div>

      <div style="max-height: 60vh; overflow-y: auto; padding-right: 6px;">
        ${reviewsHtml || '<p style="color: var(--text-muted);">No question details saved for this attempt.</p>'}
      </div>

      <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
        <button class="btn btn-secondary" onclick="App.closeModal()">Close Review</button>
      </div>
    `;

    App.openModal(content);
  },

  async openGenerateModal(presetSubject = '', presetMaterialId = '') {
    if (!window.Notes || !Notes.materials || Notes.materials.length === 0) {
      await Notes.loadMaterials();
    }

    const materials = Notes.materials || [];
    const subjects = Array.from(new Set(materials.map((m) => m.subject).filter(Boolean)));

    const matOptions = '<option value="">Select from uploaded material...</option>' +
      materials.map((m) => `<option value="${m._id}" ${m._id === presetMaterialId ? 'selected' : ''}>${App.escapeHtml(m.title)} (${App.escapeHtml(m.subject)})</option>`).join('');

    const subjOptions = '<option value="">Or select a subject...</option>' +
      subjects.map((s) => `<option value="${App.escapeHtml(s)}" ${s === presetSubject ? 'selected' : ''}>${App.escapeHtml(s)}</option>`).join('');

    const content = `
      <h2 style="margin-bottom: 8px; font-size: 1.25rem;">Generate AI Quiz</h2>
      <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 20px;">Gemini will create challenging multiple-choice questions with full answer keys.</p>
      <form id="form-gen-quiz">
        <div class="form-group">
          <label for="quiz-mat-select">Study Material</label>
          <select id="quiz-mat-select">
            ${matOptions}
          </select>
        </div>
        <div class="form-group">
          <label for="quiz-subj-select">Subject (Optional if material is selected)</label>
          <select id="quiz-subj-select">
            ${subjOptions}
          </select>
        </div>
        <div class="form-group">
          <label for="quiz-count-select">Number of Questions</label>
          <select id="quiz-count-select">
            <option value="3">3 Questions (Quick check)</option>
            <option value="5" selected>5 Questions (Standard)</option>
            <option value="10">10 Questions (Full exam rehearsal)</option>
          </select>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px;">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary" id="btn-submit-gen-quiz">✨ Generate Quiz</button>
        </div>
      </form>
    `;

    App.openModal(content);

    const form = document.getElementById('form-gen-quiz');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const materialId = document.getElementById('quiz-mat-select').value;
      const subject = document.getElementById('quiz-subj-select').value;
      const count = parseInt(document.getElementById('quiz-count-select').value, 10);

      if (!materialId && !subject) {
        App.toast('Please select either a study material or a subject', 'warning');
        return;
      }

      const submitBtn = document.getElementById('btn-submit-gen-quiz');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Generating Quiz with Gemini...';

      try {
        const payload = { count };
        if (materialId) payload.materialId = materialId;
        if (subject) payload.subject = subject;

        const res = await fetch('/api/quizzes', {
          method: 'POST',
          headers: Auth.getAuthHeaders(),
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (res.ok && json.success) {
          App.toast('Quiz generated successfully!', 'success');
          App.closeModal();
          await this.loadQuizzes();
          this.startQuiz(json.data._id);
          if (window.Dashboard) Dashboard.loadStats();
        } else {
          App.toast(json.message || 'Failed to generate quiz', 'error');
          submitBtn.disabled = false;
          submitBtn.textContent = '✨ Generate Quiz';
        }
      } catch (err) {
        App.toast(err.message, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = '✨ Generate Quiz';
      }
    };
  },

  openGenerateModalForSubject(subject) {
    App.navigateTo('quiz');
    this.openGenerateModal(subject);
  },

  startQuiz(id) {
    const quiz = this.quizzes.find((q) => q._id === id);
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      App.toast('Could not find quiz questions', 'error');
      return;
    }

    this.activeQuiz = quiz;
    this.currentQuestionIndex = 0;
    this.userAnswers = {};

    // Hide history and results, show runner
    document.getElementById('quizzes-history-section').classList.add('hidden');
    document.getElementById('quiz-result-container').classList.add('hidden');
    const runner = document.getElementById('quiz-runner-container');
    runner.classList.remove('hidden');

    document.getElementById('active-quiz-title').textContent = quiz.title || 'AI Quiz';
    document.getElementById('active-quiz-subject').textContent = quiz.subject || 'Academic';

    this.renderActiveQuestion();
  },

  renderActiveQuestion() {
    if (!this.activeQuiz) return;
    const q = this.activeQuiz.questions[this.currentQuestionIndex];
    const total = this.activeQuiz.questions.length;

    document.getElementById('active-quiz-counter').textContent = `Question ${this.currentQuestionIndex + 1} of ${total}`;
    document.getElementById('active-quiz-question-text').textContent = q.question;

    const optionsContainer = document.getElementById('active-quiz-options');
    const selectedAnswer = this.userAnswers[this.currentQuestionIndex] || '';

    optionsContainer.innerHTML = q.options
      .map((opt, idx) => {
        const isChecked = selectedAnswer === opt;
        return `
          <label class="quiz-option-label ${isChecked ? 'selected' : ''}">
            <input type="radio" name="quiz_question_opt" value="${App.escapeHtml(opt)}" ${isChecked ? 'checked' : ''} onchange="QuizModule.selectOption('${App.escapeHtml(opt)}')">
            <span><strong>${String.fromCharCode(65 + idx)}.</strong> ${App.escapeHtml(opt)}</span>
          </label>
        `;
      })
      .join('');

    // Update buttons
    const btnPrev = document.getElementById('btn-quiz-prev');
    const btnNext = document.getElementById('btn-quiz-next');
    const btnSubmit = document.getElementById('btn-quiz-submit');

    btnPrev.disabled = this.currentQuestionIndex === 0;

    if (this.currentQuestionIndex === total - 1) {
      btnNext.classList.add('hidden');
      btnSubmit.classList.remove('hidden');
    } else {
      btnNext.classList.remove('hidden');
      btnSubmit.classList.add('hidden');
    }
  },

  selectOption(opt) {
    this.userAnswers[this.currentQuestionIndex] = opt;
    // Re-highlight labels
    const labels = document.querySelectorAll('.quiz-option-label');
    labels.forEach((lbl) => {
      const radio = lbl.querySelector('input[type="radio"]');
      if (radio && radio.checked) {
        lbl.classList.add('selected');
      } else {
        lbl.classList.remove('selected');
      }
    });
  },

  nextQuestion() {
    if (!this.activeQuiz) return;
    if (this.currentQuestionIndex < this.activeQuiz.questions.length - 1) {
      this.currentQuestionIndex++;
      this.renderActiveQuestion();
    }
  },

  prevQuestion() {
    if (!this.activeQuiz) return;
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.renderActiveQuestion();
    }
  },

  async submitQuiz() {
    if (!this.activeQuiz) return;

    // Check if any questions unanswered
    const total = this.activeQuiz.questions.length;
    const answeredCount = Object.keys(this.userAnswers).length;
    if (answeredCount < total) {
      if (!confirm(`You have answered ${answeredCount} of ${total} questions. Are you sure you want to submit?`)) {
        return;
      }
    }

    const btnSubmit = document.getElementById('btn-quiz-submit');
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Grading Quiz...';

    try {
      const res = await fetch(`/api/quizzes/${this.activeQuiz._id}/submit`, {
        method: 'POST',
        headers: Auth.getAuthHeaders(),
        body: JSON.stringify({ answers: this.userAnswers }),
      });

      const json = await res.json();
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Submit Quiz';

      if (res.ok && json.success) {
        this.renderResults(json.data);
        await this.loadQuizzes();
        await this.loadAttemptsHistory();
        if (window.Dashboard) Dashboard.loadStats();
      } else {
        App.toast(json.message || 'Error submitting quiz', 'error');
      }
    } catch (err) {
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Submit Quiz';
      App.toast(err.message, 'error');
    }
  },

  renderResults(result) {
    // Hide runner
    document.getElementById('quiz-runner-container').classList.add('hidden');
    const container = document.getElementById('quiz-result-container');
    container.classList.remove('hidden');

    const reviewsHtml = (result.review || [])
      .map((item, idx) => {
        const statusClass = item.isCorrect ? 'correct' : 'wrong';
        const statusText = item.isCorrect ? '✅ Correct' : '❌ Incorrect';
        return `
          <div class="review-item ${statusClass}">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <strong>Question ${idx + 1}</strong>
              <span style="font-weight: 700; font-size: 0.8125rem;">${statusText}</span>
            </div>
            <h4>${App.escapeHtml(item.question)}</h4>
            <div style="margin-top: 10px;">
              <div style="margin-bottom: 4px;">
                <span class="review-answer-pill ${item.isCorrect ? 'pill-correct' : 'pill-wrong'}">Your Answer:</span>
                <span>${App.escapeHtml(item.userAnswer)}</span>
              </div>
              ${
                !item.isCorrect
                  ? `<div>
                      <span class="review-answer-pill pill-correct">Correct Answer:</span>
                      <span>${App.escapeHtml(item.correctAnswer)}</span>
                     </div>`
                  : ''
              }
            </div>
          </div>
        `;
      })
      .join('');

    container.innerHTML = `
      <div class="quiz-result-card">
        <h2>Quiz Completed! 🎉</h2>
        <p style="color: var(--text-muted); margin-bottom: 24px;">Here is how you performed on this quiz.</p>

        <div class="score-circle">
          <span class="score-num">${result.percentage}%</span>
          <span class="score-sub">${result.score} / ${result.totalQuestions}</span>
        </div>

        <div class="result-breakdown">
          <div class="res-box">
            <strong style="color: var(--primary);">${result.totalQuestions}</strong>
            <span>Total Questions</span>
          </div>
          <div class="res-box">
            <strong style="color: var(--success);">${result.correct}</strong>
            <span>Correct</span>
          </div>
          <div class="res-box">
            <strong style="color: var(--danger);">${result.wrong}</strong>
            <span>Wrong</span>
          </div>
        </div>

        <div style="display: flex; justify-content: center; gap: 12px; margin-bottom: 32px;">
          <button class="btn btn-secondary" onclick="QuizModule.exitQuiz()">Back to Quizzes</button>
          <button class="btn btn-primary" onclick="QuizModule.startQuiz('${this.activeQuiz._id}')">Retake Quiz</button>
        </div>

        <div class="review-list">
          <h3 style="font-size: 1.125rem; font-weight: 700;">Detailed Answer Review</h3>
          ${reviewsHtml}
        </div>
      </div>
    `;
  },

  exitQuiz() {
    this.activeQuiz = null;
    document.getElementById('quiz-runner-container').classList.add('hidden');
    document.getElementById('quiz-result-container').classList.add('hidden');
    document.getElementById('quizzes-history-section').classList.remove('hidden');
  },

  async deleteQuiz(id) {
    if (!confirm('Are you sure you want to delete this quiz?')) return;

    try {
      const res = await fetch(`/api/quizzes/${id}`, {
        method: 'DELETE',
        headers: Auth.getAuthHeaders(),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        App.toast('Quiz deleted', 'success');
        await this.loadQuizzes();
        await this.loadAttemptsHistory();
        if (window.Dashboard) Dashboard.loadStats();
      } else {
        App.toast(json.message || 'Failed to delete quiz', 'error');
      }
    } catch (err) {
      App.toast(err.message, 'error');
    }
  },
};

window.QuizModule = QuizModule;
