// studyPlan.js - AI Personalized Study Plan Generation, Task Scheduling & Daily Checklist

const StudyPlanModule = {
  plans: [],
  todayTasks: [],

  async init() {
    await this.loadPlans();
    await this.loadTodayTasks();
    this.bindEvents();
  },

  bindEvents() {
    const btnOpenGen = document.getElementById('btn-open-gen-plan-modal');
    if (btnOpenGen) {
      btnOpenGen.onclick = () => this.openGenerateModal();
    }

    const btnOpenTask = document.getElementById('btn-open-create-task-modal');
    if (btnOpenTask) {
      btnOpenTask.onclick = () => this.openScheduleTaskModal();
    }
  },

  async loadPlans() {
    try {
      const res = await fetch('/api/study-plans', { headers: Auth.getAuthHeaders() });
      const json = await res.json();
      if (res.ok && json.success) {
        this.plans = json.data || [];
        this.renderPlans(this.plans);
      }
    } catch (err) {
      console.error('Error loading study plans:', err);
    }
  },

  async loadTodayTasks() {
    try {
      const res = await fetch('/api/study-plans/today', { headers: Auth.getAuthHeaders() });
      const json = await res.json();
      if (res.ok && json.success) {
        this.todayTasks = json.data || [];
        this.renderTodayTasks(this.todayTasks);
      }
    } catch (err) {
      console.error('Error loading today study tasks:', err);
    }
  },

  renderTodayTasks(tasks) {
    const container = document.getElementById('today-tasks-list');
    const counter = document.getElementById('today-tasks-counter');
    if (!container) return;

    const total = tasks.length;
    const completed = tasks.filter((t) => t.isCompleted).length;

    if (counter) {
      counter.textContent = `${completed} / ${total} Completed`;
      if (total > 0 && completed === total) {
        counter.className = 'badge badge-success';
      } else {
        counter.className = 'badge badge-primary';
      }
    }

    if (!tasks || tasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state-sm" style="display: flex; justify-content: space-between; align-items: center;">
          <span>No study tasks scheduled for today yet.</span>
          <button class="btn btn-secondary" style="font-size: 0.75rem; padding: 4px 8px;" onclick="StudyPlanModule.openScheduleTaskModal()">➕ Schedule Task</button>
        </div>`;
      return;
    }

    container.innerHTML = tasks
      .map((t) => {
        const isDone = !!t.isCompleted;
        const taskTitle = t.topic || (t.studyPlan && t.studyPlan.title) || t.subject || 'Study Task';
        const timeDisplay = t.startTime ? `${t.startTime} (${t.duration || '1 hour'})` : (t.duration || '1 hour');

        return `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: ${isDone ? '#f0fdf4' : '#ffffff'}; border: 1px solid ${isDone ? '#bbf7d0' : 'var(--border-color)'}; border-radius: var(--radius-sm); transition: all 0.2s ease;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <input type="checkbox" id="task-chk-${t._id}" ${isDone ? 'checked' : ''} onchange="StudyPlanModule.toggleTaskCompletion('${t._id}')" style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--primary);">
              <div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <strong style="font-size: 0.9375rem; text-decoration: ${isDone ? 'line-through' : 'none'}; color: ${isDone ? 'var(--text-muted)' : 'var(--text-main)'};">
                    ${App.escapeHtml(taskTitle)}
                  </strong>
                  <span class="badge" style="font-size: 0.7rem; padding: 2px 6px;">${App.escapeHtml(t.subject)}</span>
                </div>
                <div style="font-size: 0.8125rem; color: var(--text-muted); margin-top: 2px;">
                  <span>⏰ ${App.escapeHtml(timeDisplay)}</span>
                  ${isDone ? '<span style="color: #166534; font-weight: 600; margin-left: 8px;">✓ Done</span>' : ''}
                </div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <button class="btn-icon" title="Delete Task" onclick="StudyPlanModule.deletePlan('${t._id}')" style="color: var(--danger); font-size: 0.85rem;">🗑️</button>
            </div>
          </div>
        `;
      })
      .join('');
  },

  async toggleTaskCompletion(id) {
    try {
      const res = await fetch(`/api/study-plans/${id}/toggle`, {
        method: 'PATCH',
        headers: Auth.getAuthHeaders(),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        App.toast(json.message || 'Task status updated!', 'success');
        await this.loadTodayTasks();
        await this.loadPlans();
        if (window.Dashboard) Dashboard.loadStats();
      } else {
        App.toast(json.message || 'Failed to update task', 'error');
      }
    } catch (err) {
      App.toast(err.message, 'error');
    }
  },

  renderPlans(list) {
    const container = document.getElementById('study-plans-list');
    if (!container) return;

    if (!list || list.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📅</div>
          <h3>No Study Plans Yet</h3>
          <p>Prepare strategically for exams with a structured daily study roadmap created by Gemini AI.</p>
          <div style="display: flex; gap: 10px; justify-content: center; margin-top: 14px;">
            <button class="btn btn-primary" onclick="StudyPlanModule.openGenerateModal()">Create AI Study Plan</button>
            <button class="btn btn-secondary" onclick="StudyPlanModule.openScheduleTaskModal()">Schedule Study Task</button>
          </div>
        </div>`;
      return;
    }

    container.innerHTML = list
      .map((plan) => {
        const examDateStr = plan.examDate ? new Date(plan.examDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Upcoming';
        const planData = typeof plan.studyPlan === 'object' ? plan.studyPlan : { title: 'Study Plan', schedule: [] };
        const scheduleList = planData.schedule || [];

        const timelineHtml = scheduleList
          .map((step) => {
            const topicsHtml = (step.topics || []).map((t) => `<li>${App.escapeHtml(t)}</li>`).join('');
            return `
              <div class="timeline-step">
                <div class="step-day">${App.escapeHtml(step.day || 'Session')}</div>
                <div class="step-content" style="flex: 1;">
                  <div style="display: flex; justify-content: space-between; align-items: baseline;">
                    <strong>${App.escapeHtml(step.title || 'Focus Area')}</strong>
                    <span style="font-size: 0.75rem; color: var(--primary); font-weight: 600;">⏱️ ${App.escapeHtml(step.duration || plan.availableTime || plan.duration || '1 hour')}</span>
                  </div>
                  <p style="margin-top: 4px;">${App.escapeHtml(step.recommendedActions || '')}</p>
                  ${topicsHtml ? `<ul style="color: var(--text-main); margin-top: 6px;">${topicsHtml}</ul>` : ''}
                </div>
              </div>
            `;
          })
          .join('');

        const isTaskDone = !!plan.isCompleted;

        return `
          <div class="plan-card">
            <div class="plan-header">
              <div>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                  <span class="badge">${App.escapeHtml(plan.subject)}</span>
                  ${
                    isTaskDone
                      ? '<span class="badge" style="background: #dcfce7; color: #15803d;">✅ Completed</span>'
                      : '<span class="badge" style="background: #fef3c7; color: #b45309;">In Progress</span>'
                  }
                </div>
                <h2 style="font-size: 1.35rem; font-weight: 800;">${App.escapeHtml(planData.title || plan.topic || `Study Plan for ${plan.subject}`)}</h2>
                <p style="color: var(--text-muted); font-size: 0.875rem; margin-top: 4px;">
                  🎯 <strong>Date:</strong> ${examDateStr} • ⏰ <strong>Time:</strong> ${App.escapeHtml(plan.startTime || 'Scheduled')} • ⏱️ <strong>Commitment:</strong> ${App.escapeHtml(plan.availableTime || plan.duration || '1 hour')}
                </p>
                ${planData.overview ? `<p style="margin-top: 8px; font-size: 0.9375rem; color: var(--text-main);">${App.escapeHtml(planData.overview)}</p>` : ''}
              </div>
              <div style="display: flex; gap: 8px; align-items: center;">
                <button class="btn btn-secondary" style="font-size: 0.8125rem; padding: 6px 10px;" onclick="StudyPlanModule.toggleTaskCompletion('${plan._id}')">
                  ${isTaskDone ? 'Mark Pending' : 'Mark Done'}
                </button>
                <button class="btn btn-danger" style="font-size: 0.8125rem; padding: 6px 10px;" onclick="StudyPlanModule.deletePlan('${plan._id}')">Delete</button>
              </div>
            </div>

            <div class="plan-timeline">
              ${timelineHtml || '<p style="color: var(--text-muted);">No schedule details available.</p>'}
            </div>
          </div>
        `;
      })
      .join('');
  },

  async openScheduleTaskModal() {
    if (!window.Notes || !Notes.materials || Notes.materials.length === 0) {
      await Notes.loadMaterials();
    }

    const materials = Notes.materials || [];
    const subjects = Array.from(new Set(materials.map((m) => m.subject).filter(Boolean)));
    const subjectDatalist = subjects.map((s) => `<option value="${App.escapeHtml(s)}">`).join('');

    const todayStr = new Date().toISOString().split('T')[0];

    const content = `
      <h2 style="margin-bottom: 8px; font-size: 1.25rem;">Schedule Study Task</h2>
      <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 20px;">Set up a focused study session for today or an upcoming study date.</p>
      <form id="form-schedule-task">
        <div class="form-group">
          <label for="task-subject-input">Subject *</label>
          <input type="text" id="task-subject-input" required list="task-subjects-list" placeholder="e.g. Computer Science, Database Management">
          <datalist id="task-subjects-list">${subjectDatalist}</datalist>
        </div>
        <div class="form-group">
          <label for="task-topic-input">Topic / Objective *</label>
          <input type="text" id="task-topic-input" required placeholder="e.g. Review B-Trees and Indexing, Solve 20 Flashcards">
        </div>
        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label for="task-date-input">Date *</label>
            <input type="date" id="task-date-input" required value="${todayStr}">
          </div>
          <div class="form-group">
            <label for="task-time-input">Start Time</label>
            <input type="time" id="task-time-input" value="10:00">
          </div>
        </div>
        <div class="form-group">
          <label for="task-duration-select">Duration</label>
          <select id="task-duration-select">
            <option value="30 minutes">30 minutes</option>
            <option value="45 minutes">45 minutes</option>
            <option value="1 hour" selected>1 hour</option>
            <option value="1.5 hours">1.5 hours</option>
            <option value="2 hours">2 hours</option>
            <option value="3 hours">3 hours</option>
          </select>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px;">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary" id="btn-submit-schedule-task">Schedule Task</button>
        </div>
      </form>
    `;

    App.openModal(content);

    const form = document.getElementById('form-schedule-task');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const subject = document.getElementById('task-subject-input').value.trim();
      const topic = document.getElementById('task-topic-input').value.trim();
      const date = document.getElementById('task-date-input').value;
      const rawTime = document.getElementById('task-time-input').value;
      const duration = document.getElementById('task-duration-select').value;

      // Format time to 12h AM/PM
      let startTime = '10:00 AM';
      if (rawTime) {
        const [h, m] = rawTime.split(':');
        const hour = parseInt(h, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedH = hour % 12 || 12;
        startTime = `${formattedH}:${m} ${ampm}`;
      }

      const submitBtn = document.getElementById('btn-submit-schedule-task');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Scheduling...';

      try {
        const res = await fetch('/api/study-plans', {
          method: 'POST',
          headers: Auth.getAuthHeaders(),
          body: JSON.stringify({
            subject,
            topic,
            date,
            startTime,
            duration,
            isTaskOnly: true,
          }),
        });

        const json = await res.json();
        if (res.ok && json.success) {
          App.toast('Study task scheduled successfully!', 'success');
          App.closeModal();
          await this.loadTodayTasks();
          await this.loadPlans();
          if (window.Dashboard) Dashboard.loadStats();
        } else {
          App.toast(json.message || 'Failed to schedule task', 'error');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Schedule Task';
        }
      } catch (err) {
        App.toast(err.message, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Schedule Task';
      }
    };
  },

  async openGenerateModal() {
    if (!window.Notes || !Notes.materials || Notes.materials.length === 0) {
      await Notes.loadMaterials();
    }

    const materials = Notes.materials || [];
    const subjects = Array.from(new Set(materials.map((m) => m.subject).filter(Boolean)));

    const matCheckboxes = materials
      .map(
        (m) => `
        <label style="display: flex; align-items: center; gap: 8px; font-size: 0.875rem; margin-bottom: 6px; cursor: pointer;">
          <input type="checkbox" name="plan_material_checkbox" value="${m._id}">
          <span>${App.escapeHtml(m.title)} (${App.escapeHtml(m.subject)})</span>
        </label>`
      )
      .join('');

    const subjectDatalist = subjects.map((s) => `<option value="${App.escapeHtml(s)}">`).join('');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDateStr = tomorrow.toISOString().split('T')[0];

    const content = `
      <h2 style="margin-bottom: 8px; font-size: 1.25rem;">Create AI Study Plan</h2>
      <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 20px;">Gemini will build a personalized day-by-day roadmap tailored to your target exam date.</p>
      <form id="form-gen-plan">
        <div class="form-group">
          <label for="plan-subject-input">Subject Name</label>
          <input type="text" id="plan-subject-input" required list="plan-subjects-list" placeholder="e.g. Computer Networks">
          <datalist id="plan-subjects-list">${subjectDatalist}</datalist>
        </div>
        <div class="form-group">
          <label for="plan-exam-date">Exam Date</label>
          <input type="date" id="plan-exam-date" required min="${minDateStr}">
        </div>
        <div class="form-group">
          <label for="plan-time-select">Available Daily Study Time</label>
          <select id="plan-time-select">
            <option value="1 hour/day">1 hour/day</option>
            <option value="1.5 hours/day">1.5 hours/day</option>
            <option value="2 hours/day" selected>2 hours/day (Recommended)</option>
            <option value="3 hours/day">3 hours/day (Intensive)</option>
            <option value="4+ hours/day">4+ hours/day (Crash course)</option>
          </select>
        </div>
        ${
          materials.length > 0
            ? `<div class="form-group">
                <label>Include Study Materials Context (Optional)</label>
                <div style="max-height: 120px; overflow-y: auto; border: 1px solid var(--border-color); padding: 10px; border-radius: var(--radius-sm); background: #ffffff;">
                  ${matCheckboxes}
                </div>
               </div>`
            : ''
        }
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px;">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary" id="btn-submit-gen-plan">✨ Generate Plan</button>
        </div>
      </form>
    `;

    App.openModal(content);

    const form = document.getElementById('form-gen-plan');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const subject = document.getElementById('plan-subject-input').value.trim();
      const examDate = document.getElementById('plan-exam-date').value;
      const availableTime = document.getElementById('plan-time-select').value;

      const checkedCheckboxes = document.querySelectorAll('input[name="plan_material_checkbox"]:checked');
      const materialIds = Array.from(checkedCheckboxes).map((cb) => cb.value);

      const submitBtn = document.getElementById('btn-submit-gen-plan');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Generating Study Plan with Gemini...';

      try {
        const res = await fetch('/api/study-plans', {
          method: 'POST',
          headers: Auth.getAuthHeaders(),
          body: JSON.stringify({ subject, examDate, availableTime, materialIds }),
        });

        const json = await res.json();
        if (res.ok && json.success) {
          App.toast('Study plan created successfully!', 'success');
          App.closeModal();
          await this.loadPlans();
          await this.loadTodayTasks();
          if (window.Dashboard) Dashboard.loadStats();
        } else {
          App.toast(json.message || 'Failed to generate plan', 'error');
          submitBtn.disabled = false;
          submitBtn.textContent = '✨ Generate Plan';
        }
      } catch (err) {
        App.toast(err.message, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = '✨ Generate Plan';
      }
    };
  },

  async deletePlan(id) {
    if (!confirm('Are you sure you want to delete this study plan / task?')) return;

    try {
      const res = await fetch(`/api/study-plans/${id}`, {
        method: 'DELETE',
        headers: Auth.getAuthHeaders(),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        App.toast('Study plan / task deleted', 'success');
        await this.loadPlans();
        await this.loadTodayTasks();
        if (window.Dashboard) Dashboard.loadStats();
      } else {
        App.toast(json.message || 'Failed to delete plan', 'error');
      }
    } catch (err) {
      App.toast(err.message, 'error');
    }
  },
};

window.StudyPlanModule = StudyPlanModule;
