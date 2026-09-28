// dashboard.js - Dashboard Metrics, 9 Live Metrics from MongoDB & Interactive Progress Chart

const Dashboard = {
  async init() {
    await this.loadStats();
    this.bindEvents();
  },

  bindEvents() {
    // Quick Actions
    const addMat = document.getElementById('qa-add-material');
    if (addMat) addMat.onclick = () => Notes.openAddModal();

    const genSum = document.getElementById('qa-gen-summary');
    if (genSum) genSum.onclick = () => SummaryModule.openGenerateModal();

    const genFc = document.getElementById('qa-gen-flashcards');
    if (genFc) genFc.onclick = () => Flashcards.openGenerateModal();

    const genQz = document.getElementById('qa-gen-quiz');
    if (genQz) genQz.onclick = () => QuizModule.openGenerateModal();

    const genPl = document.getElementById('qa-gen-plan');
    if (genPl) genPl.onclick = () => StudyPlanModule.openScheduleTaskModal();

    const askAi = document.getElementById('qa-ask-ai');
    if (askAi) askAi.onclick = () => App.navigateTo('chat');

    const heroAdd = document.getElementById('dash-btn-add-material');
    if (heroAdd) heroAdd.onclick = () => Notes.openAddModal();

    const heroAsk = document.getElementById('dash-btn-ask-ai');
    if (heroAsk) heroAsk.onclick = () => App.navigateTo('chat');
  },

  async loadStats() {
    try {
      const user = Auth.getUser();
      const welcomeHeader = document.getElementById('dash-welcome-text');
      if (welcomeHeader && user) {
        welcomeHeader.textContent = `Welcome back, ${user.name}! 🚀`;
      }

      const res = await fetch('/api/progress', { headers: Auth.getAuthHeaders() });
      const json = await res.json();

      if (res.ok && json.success) {
        const d = json.data;

        // 1. Total Study Materials
        const elMat = document.getElementById('dash-stat-materials');
        if (elMat) elMat.textContent = d.totalMaterials || 0;

        // 2. Total Subjects
        const elSubj = document.getElementById('dash-stat-subjects');
        if (elSubj) elSubj.textContent = d.totalSubjects || 0;

        // 3. AI Summaries Generated
        const elSum = document.getElementById('dash-stat-summaries');
        if (elSum) elSum.textContent = d.totalSummaries || 0;

        // 4. Flashcards Studied
        const elFc = document.getElementById('dash-stat-fc-studied');
        if (elFc) elFc.textContent = d.flashcardsStudied || 0;

        // 5. Quizzes Taken
        const elQz = document.getElementById('dash-stat-quizzes');
        if (elQz) elQz.textContent = d.quizzesTaken || 0;

        // 6. Average Quiz Score
        const elScore = document.getElementById('dash-stat-score');
        if (elScore) elScore.textContent = `${d.averageQuizScore || 0}%`;

        // 7. Study Plan Tasks
        const elTasks = document.getElementById('dash-stat-tasks');
        if (elTasks) elTasks.textContent = d.studyPlanTasks || 0;

        // 8. Completed Tasks
        const elCompleted = document.getElementById('dash-stat-tasks-completed');
        if (elCompleted) elCompleted.textContent = d.completedTasks || 0;

        // 9. Overall Study Progress %
        const elProg = document.getElementById('dash-stat-progress');
        const overall = d.overallProgress || 0;
        if (elProg) elProg.textContent = `${overall}%`;

        // Badge update
        const chartBadge = document.getElementById('chart-overall-badge');
        if (chartBadge) {
          if (overall >= 75) {
            chartBadge.textContent = '🌟 Master Scholar';
            chartBadge.style.background = '#dcfce7';
            chartBadge.style.color = '#15803d';
          } else if (overall >= 40) {
            chartBadge.textContent = '🚀 Active Learner';
            chartBadge.style.background = '#e0f2fe';
            chartBadge.style.color = '#0369a1';
          } else {
            chartBadge.textContent = '🌱 Getting Started';
            chartBadge.style.background = '#fef3c7';
            chartBadge.style.color = '#b45309';
          }
        }

        // Render progress chart and recent activities
        this.renderProgressChart(d.weeklyChart || []);
        this.renderRecentActivities(d.recentActivity || []);
      }
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    }
  },

  renderProgressChart(weeklyData) {
    const container = document.getElementById('dashboard-progress-chart');
    if (!container) return;

    if (!weeklyData || weeklyData.length === 0) {
      container.innerHTML = '<div class="empty-state-sm">Activity history will appear here as you study.</div>';
      return;
    }

    const maxCount = Math.max(...weeklyData.map((d) => d.count), 4);

    container.innerHTML = weeklyData
      .map((item) => {
        const heightPct = Math.max(14, Math.round((item.count / maxCount) * 100));
        const barColor = item.count > 0 ? 'var(--primary)' : '#e2e8f0';

        return `
          <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%;">
            <span style="font-size: 0.72rem; font-weight: 700; color: ${item.count > 0 ? 'var(--primary)' : 'var(--text-muted)'}; margin-bottom: 6px;">
              ${item.count}
            </span>
            <div style="width: 100%; max-width: 44px; height: ${heightPct}%; background: ${barColor}; border-radius: 6px 6px 0 0; transition: height 0.4s ease;" title="${item.day}: ${item.count} study actions"></div>
            <span style="font-size: 0.75rem; color: var(--text-muted); margin-top: 8px; font-weight: 600;">
              ${item.day}
            </span>
          </div>
        `;
      })
      .join('');
  },

  renderRecentActivities(activities) {
    const container = document.getElementById('dash-recent-activities');
    if (!container) return;

    if (!activities || activities.length === 0) {
      container.innerHTML = `
        <div class="empty-state-sm">
          No recent activity yet. Start by adding your first study material!
        </div>`;
      return;
    }

    container.innerHTML = activities
      .slice(0, 6)
      .map((item) => {
        let icon = '📝';
        if (item.type === 'summary') icon = '📄';
        if (item.type === 'quiz') icon = '❓';
        if (item.type === 'flashcard') icon = '🃏';
        if (item.type === 'task') icon = '📅';

        const timeStr = item.timestamp
          ? new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          : 'Recently';

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
  },
};

window.Dashboard = Dashboard;
