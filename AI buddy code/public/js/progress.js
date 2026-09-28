// progress.js - Learning Analytics & Progress Visualization

const ProgressModule = {
  async init() {
    await this.loadProgressData();
  },

  async loadProgressData() {
    try {
      const res = await fetch('/api/progress', { headers: Auth.getAuthHeaders() });
      const json = await res.json();

      if (res.ok && json.success) {
        const d = json.data;

        // Stat cards
        document.getElementById('prog-materials').textContent = d.totalMaterials || 0;
        document.getElementById('prog-summaries').textContent = d.totalSummaries || 0;
        document.getElementById('prog-flashcards').textContent = d.totalFlashcards || 0;
        document.getElementById('prog-score').textContent = `${d.averageQuizScore || 0}%`;

        // Progress bars
        const quizPct = d.averageQuizScore || 0;
        document.getElementById('bar-quiz-accuracy').style.width = `${quizPct}%`;
        document.getElementById('bar-quiz-accuracy-text').textContent = `${quizPct}% avg`;

        const fcCount = d.totalFlashcards || 0;
        const fcWidth = Math.min(100, Math.round((fcCount / 30) * 100));
        document.getElementById('bar-flashcards').style.width = `${fcWidth}%`;
        document.getElementById('bar-flashcards-text').textContent = `${fcCount} created`;

        const matCount = d.totalMaterials || 0;
        const matWidth = Math.min(100, Math.round((matCount / 10) * 100));
        document.getElementById('bar-materials').style.width = `${matWidth}%`;
        document.getElementById('bar-materials-text').textContent = `${matCount} uploaded`;

        // Subjects Studied
        const subjectsContainer = document.getElementById('prog-subjects-list');
        if (subjectsContainer) {
          if (d.subjects && d.subjects.length > 0) {
            subjectsContainer.innerHTML = d.subjects
              .map((s) => `<span class="subject-tag">📚 ${App.escapeHtml(s)}</span>`)
              .join('');
          } else {
            subjectsContainer.innerHTML = '<p class="empty-state-sm">No subjects recorded yet.</p>';
          }
        }

        // Full Timeline
        const timelineContainer = document.getElementById('prog-full-timeline');
        if (timelineContainer) {
          if (d.recentActivity && d.recentActivity.length > 0) {
            timelineContainer.innerHTML = d.recentActivity
              .map((item) => {
                let icon = '📝';
                if (item.type === 'summary') icon = '📄';
                if (item.type === 'quiz') icon = '❓';

                const timeStr = item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Recently';

                return `
                  <div class="timeline-item">
                    <span class="tl-icon">${icon}</span>
                    <div class="tl-content">
                      <strong>${App.escapeHtml(item.title)}</strong>
                      <span>${App.escapeHtml(item.subtitle)} • ${timeStr}</span>
                    </div>
                  </div>
                `;
              })
              .join('');
          } else {
            timelineContainer.innerHTML = '<div class="empty-state-sm">No activity recorded yet.</div>';
          }
        }
      }
    } catch (err) {
      console.error('Error loading progress metrics:', err);
    }
  },
};

window.ProgressModule = ProgressModule;
