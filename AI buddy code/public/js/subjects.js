// subjects.js - Subject Management

const SubjectsModule = {
  subjects: [],

  async init() {
    await this.loadSubjects();
    this.bindEvents();
  },

  bindEvents() {
    const searchInput = document.getElementById('subjects-search');
    if (searchInput) {
      searchInput.oninput = (e) => this.filterSubjects(e.target.value);
    }

    const btnCreateSubject = document.getElementById('btn-open-create-subject-modal');
    if (btnCreateSubject) {
      btnCreateSubject.onclick = () => this.openCreateModal();
    }

    const btnSeedDefaults = document.getElementById('btn-seed-default-subjects');
    if (btnSeedDefaults) {
      btnSeedDefaults.onclick = () => this.seedDefaultSubjects();
    }

    const btnAdd = document.getElementById('btn-subjects-add-material');
    if (btnAdd) {
      btnAdd.onclick = () => Notes.openAddModal();
    }
  },

  async loadSubjects() {
    try {
      const res = await fetch('/api/subjects', { headers: Auth.getAuthHeaders() });
      const json = await res.json();
      if (res.ok && json.success) {
        this.subjects = json.data || [];
        this.renderSubjects(this.subjects);
      }
    } catch (err) {
      console.error('Error loading subjects:', err);
    }
  },

  async seedDefaultSubjects() {
    try {
      const btn = document.getElementById('btn-seed-default-subjects');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Loading...';
      }
      const res = await fetch('/api/subjects/defaults', {
        method: 'POST',
        headers: Auth.getAuthHeaders(),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        App.toast(json.message || 'Default subjects loaded!', 'success');
        await this.loadSubjects();
        if (window.Notes) Notes.populateSubjectDropdown();
        if (window.Dashboard) Dashboard.loadStats();
      } else {
        App.toast(json.message || 'Failed to load default subjects', 'error');
      }
    } catch (err) {
      App.toast(err.message, 'error');
    } finally {
      const btn = document.getElementById('btn-seed-default-subjects');
      if (btn) {
        btn.disabled = false;
        btn.textContent = '⚡ Load Default Subjects';
      }
    }
  },

  filterSubjects(query) {
    const q = query.toLowerCase().trim();
    const filtered = this.subjects.filter(
      (s) =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.subject && s.subject.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q))
    );
    this.renderSubjects(filtered);
  },

  renderSubjects(list) {
    const container = document.getElementById('subjects-grid');
    if (!container) return;

    if (!list || list.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">📚</div>
          <h3>No Subjects Found</h3>
          <p>Create subjects or load the default academic curriculum (Computer Science, AI, Mathematics, DBMS, Node.js, MongoDB).</p>
          <div style="display: flex; gap: 10px; justify-content: center; margin-top: 14px; flex-wrap: wrap;">
            <button class="btn btn-primary" onclick="SubjectsModule.openCreateModal()">➕ Add Subject</button>
            <button class="btn btn-secondary" onclick="SubjectsModule.seedDefaultSubjects()">⚡ Load Default Subjects</button>
            <button class="btn btn-secondary" onclick="Notes.openAddModal()">Add Study Material</button>
          </div>
        </div>`;
      return;
    }

    const defaultIcons = ['💻', '🧠', '📐', '🗄️', '⚡', '🍃', '📚', '🔬', '🌐', '⚙️'];

    container.innerHTML = list
      .map((item, idx) => {
        const icon = item.icon || defaultIcons[idx % defaultIcons.length];
        const name = item.name || item.subject;
        const color = item.color || '#4f46e5';
        const lastUpdatedStr = item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString() : 'Recently';
        const count = item.count || 0;
        const desc = item.description || '';
        const id = item._id;

        return `
          <div class="subject-card" style="border-top: 4px solid ${color}; cursor: default;">
            <div class="subject-card-header" style="cursor: pointer;" onclick="SubjectsModule.openSubject('${App.escapeHtml(name)}')">
              <span class="subj-icon" style="background: ${color}15; color: ${color};">${icon}</span>
              <div class="subj-info">
                <h3>${App.escapeHtml(name)}</h3>
                <span>${count} material${count === 1 ? '' : 's'} • Active: ${lastUpdatedStr}</span>
              </div>
            </div>
            ${desc ? `<p style="font-size: 0.8125rem; color: var(--text-muted); margin: 8px 0 14px; line-height: 1.4;">${App.escapeHtml(desc)}</p>` : ''}
            <div class="subj-actions" onclick="event.stopPropagation()" style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--border-color);">
              <button class="btn btn-secondary" style="font-size: 0.75rem; padding: 4px 8px;" onclick="SubjectsModule.openSubject('${App.escapeHtml(name)}')">📖 View Notes</button>
              <button class="btn btn-secondary" style="font-size: 0.75rem; padding: 4px 8px;" onclick="QuizModule.openGenerateModalForSubject('${App.escapeHtml(name)}')">❓ Generate Quiz</button>
              ${
                id
                  ? `<button class="btn btn-secondary" style="font-size: 0.75rem; padding: 4px 8px;" onclick="SubjectsModule.openEditModal('${id}')">✏️ Edit</button>
                     <button class="btn btn-danger" style="font-size: 0.75rem; padding: 4px 8px;" onclick="SubjectsModule.deleteSubject('${id}', '${App.escapeHtml(name)}')">🗑️</button>`
                  : ''
              }
            </div>
          </div>
        `;
      })
      .join('');
  },

  fillPreset(name, icon, color, desc) {
    const nameInput = document.getElementById('create-subj-name');
    if (nameInput) nameInput.value = name;

    const descInput = document.getElementById('create-subj-desc');
    if (descInput) descInput.value = desc;

    const iconRadios = document.querySelectorAll('input[name="subj_icon_choice"]');
    iconRadios.forEach((r) => {
      if (r.value === icon) r.checked = true;
    });

    const colorRadios = document.querySelectorAll('input[name="subj_color_choice"]');
    colorRadios.forEach((r) => {
      if (r.value === color) r.checked = true;
    });
  },

  openCreateModal() {
    const iconPresets = ['💻', '🧠', '📐', '🗄️', '⚡', '🍃', '📚', '🔬', '🌐', '⚙️', '📖', '🧪'];
    const colorPresets = ['#4f46e5', '#0284c7', '#059669', '#7c3aed', '#e11d48', '#d97706', '#0d9488'];

    const iconRadios = iconPresets
      .map(
        (ic, i) => `
        <label style="cursor: pointer; font-size: 1.3rem; padding: 6px 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); display: inline-flex; align-items: center; justify-content: center;">
          <input type="radio" name="subj_icon_choice" value="${ic}" ${i === 0 ? 'checked' : ''} style="margin-right: 4px;">
          ${ic}
        </label>`
      )
      .join('');

    const colorRadios = colorPresets
      .map(
        (cl, i) => `
        <label style="cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
          <input type="radio" name="subj_color_choice" value="${cl}" ${i === 0 ? 'checked' : ''}>
          <span style="display: inline-block; width: 20px; height: 20px; border-radius: 50%; background: ${cl};"></span>
        </label>`
      )
      .join('');

    const content = `
      <h2 style="margin-bottom: 8px; font-size: 1.25rem;">Create New Subject</h2>
      <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 16px;">Organize your study materials, flashcards, quizzes, and revision plans.</p>

      <!-- Quick Preset Suggestions -->
      <div style="background: #f8fafc; padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); margin-bottom: 18px;">
        <span style="font-size: 0.8125rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 8px;">⚡ Quick Suggestions (1-Click Fill):</span>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          <button type="button" class="btn btn-secondary" style="font-size: 0.75rem; padding: 4px 8px;" onclick="SubjectsModule.fillPreset('Computer Science', '💻', '#4f46e5', 'Algorithms, data structures and core computing.')">💻 Computer Science</button>
          <button type="button" class="btn btn-secondary" style="font-size: 0.75rem; padding: 4px 8px;" onclick="SubjectsModule.fillPreset('Artificial Intelligence', '🧠', '#7c3aed', 'Machine learning, neural networks and intelligent agents.')">🧠 Artificial Intelligence</button>
          <button type="button" class="btn btn-secondary" style="font-size: 0.75rem; padding: 4px 8px;" onclick="SubjectsModule.fillPreset('Mathematics', '📐', '#0284c7', 'Linear algebra, calculus, and discrete mathematics.')">📐 Mathematics</button>
          <button type="button" class="btn btn-secondary" style="font-size: 0.75rem; padding: 4px 8px;" onclick="SubjectsModule.fillPreset('Database Management', '🗄️', '#059669', 'Relational schemas, normalization and ACID transactions.')">🗄️ Database Management</button>
          <button type="button" class="btn btn-secondary" style="font-size: 0.75rem; padding: 4px 8px;" onclick="SubjectsModule.fillPreset('Node.js', '⚡', '#16a34a', 'Event loop, Express REST APIs, and asynchronous programming.')">⚡ Node.js</button>
          <button type="button" class="btn btn-secondary" style="font-size: 0.75rem; padding: 4px 8px;" onclick="SubjectsModule.fillPreset('MongoDB', '🍃', '#0d9488', 'Document models, aggregation framework, and compound indexing.')">🍃 MongoDB</button>
        </div>
      </div>

      <form id="form-create-subject">
        <div class="form-group">
          <label for="create-subj-name">Subject Name *</label>
          <input type="text" id="create-subj-name" required placeholder="e.g. Computer Science, Artificial Intelligence, Node.js">
        </div>
        <div class="form-group">
          <label for="create-subj-desc">Description (Optional)</label>
          <textarea id="create-subj-desc" rows="3" placeholder="Brief notes about course objectives, exam dates, or syllabus..."></textarea>
        </div>
        <div class="form-group">
          <label>Select Subject Icon</label>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px;">
            ${iconRadios}
          </div>
        </div>
        <div class="form-group">
          <label>Accent Color</label>
          <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-top: 6px;">
            ${colorRadios}
          </div>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px;">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary" id="btn-submit-create-subj">Create Subject</button>
        </div>
      </form>
    `;

    App.openModal(content);

    const form = document.getElementById('form-create-subject');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const name = document.getElementById('create-subj-name').value.trim();
      const description = document.getElementById('create-subj-desc').value.trim();
      const iconInput = document.querySelector('input[name="subj_icon_choice"]:checked');
      const icon = iconInput ? iconInput.value : '📚';
      const colorInput = document.querySelector('input[name="subj_color_choice"]:checked');
      const color = colorInput ? colorInput.value : '#4f46e5';

      if (!name) {
        App.toast('Subject name is required', 'warning');
        return;
      }

      const submitBtn = document.getElementById('btn-submit-create-subj');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating...';

      try {
        const res = await fetch('/api/subjects', {
          method: 'POST',
          headers: Auth.getAuthHeaders(),
          body: JSON.stringify({ name, description, icon, color }),
        });

        const json = await res.json();
        if (res.ok && json.success) {
          App.toast(`Subject "${name}" created successfully!`, 'success');
          App.closeModal();
          await this.loadSubjects();
          if (window.Notes) Notes.populateSubjectDropdown();
          if (window.Dashboard) Dashboard.loadStats();
        } else {
          App.toast(json.message || 'Failed to create subject', 'error');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create Subject';
        }
      } catch (err) {
        App.toast(err.message, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Subject';
      }
    };
  },

  openEditModal(id) {
    const item = this.subjects.find((s) => s._id === id);
    if (!item) return;

    const iconPresets = ['💻', '🧠', '📐', '🗄️', '⚡', '🍃', '📚', '🔬', '🌐', '⚙️', '📖', '🧪'];
    const colorPresets = ['#4f46e5', '#0284c7', '#059669', '#7c3aed', '#e11d48', '#d97706', '#0d9488'];

    const iconRadios = iconPresets
      .map(
        (ic) => `
        <label style="cursor: pointer; font-size: 1.3rem; padding: 6px 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); display: inline-flex; align-items: center; justify-content: center;">
          <input type="radio" name="edit_subj_icon" value="${ic}" ${item.icon === ic ? 'checked' : ''} style="margin-right: 4px;">
          ${ic}
        </label>`
      )
      .join('');

    const colorRadios = colorPresets
      .map(
        (cl) => `
        <label style="cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
          <input type="radio" name="edit_subj_color" value="${cl}" ${item.color === cl ? 'checked' : ''}>
          <span style="display: inline-block; width: 20px; height: 20px; border-radius: 50%; background: ${cl};"></span>
        </label>`
      )
      .join('');

    const content = `
      <h2 style="margin-bottom: 8px; font-size: 1.25rem;">Edit Subject</h2>
      <form id="form-edit-subject">
        <div class="form-group">
          <label for="edit-subj-name">Subject Name *</label>
          <input type="text" id="edit-subj-name" required value="${App.escapeHtml(item.name || item.subject)}">
        </div>
        <div class="form-group">
          <label for="edit-subj-desc">Description</label>
          <textarea id="edit-subj-desc" rows="3">${App.escapeHtml(item.description || '')}</textarea>
        </div>
        <div class="form-group">
          <label>Select Subject Icon</label>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px;">
            ${iconRadios}
          </div>
        </div>
        <div class="form-group">
          <label>Accent Color</label>
          <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-top: 6px;">
            ${colorRadios}
          </div>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px;">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary" id="btn-submit-edit-subj">Save Changes</button>
        </div>
      </form>
    `;

    App.openModal(content);

    const form = document.getElementById('form-edit-subject');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const name = document.getElementById('edit-subj-name').value.trim();
      const description = document.getElementById('edit-subj-desc').value.trim();
      const iconInput = document.querySelector('input[name="edit_subj_icon"]:checked');
      const icon = iconInput ? iconInput.value : item.icon;
      const colorInput = document.querySelector('input[name="edit_subj_color"]:checked');
      const color = colorInput ? colorInput.value : item.color;

      const submitBtn = document.getElementById('btn-submit-edit-subj');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';

      try {
        const res = await fetch(`/api/subjects/${id}`, {
          method: 'PUT',
          headers: Auth.getAuthHeaders(),
          body: JSON.stringify({ name, description, icon, color }),
        });

        const json = await res.json();
        if (res.ok && json.success) {
          App.toast(`Subject updated successfully!`, 'success');
          App.closeModal();
          await this.loadSubjects();
          if (window.Notes) {
            await Notes.loadMaterials();
            Notes.populateSubjectDropdown();
          }
          if (window.Dashboard) Dashboard.loadStats();
        } else {
          App.toast(json.message || 'Failed to update subject', 'error');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Save Changes';
        }
      } catch (err) {
        App.toast(err.message, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Changes';
      }
    };
  },

  async deleteSubject(id, name) {
    if (!confirm(`Are you sure you want to delete the subject "${name}"?`)) return;

    try {
      const res = await fetch(`/api/subjects/${id}`, {
        method: 'DELETE',
        headers: Auth.getAuthHeaders(),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        App.toast(`Subject "${name}" deleted`, 'success');
        await this.loadSubjects();
        if (window.Notes) Notes.populateSubjectDropdown();
        if (window.Dashboard) Dashboard.loadStats();
      } else {
        App.toast(json.message || 'Failed to delete subject', 'error');
      }
    } catch (err) {
      App.toast(err.message, 'error');
    }
  },

  openSubject(subject) {
    App.navigateTo('materials');
    setTimeout(() => {
      const filterSelect = document.getElementById('materials-subject-filter');
      if (filterSelect) {
        filterSelect.value = subject;
        Notes.filterBySubject(subject);
      }
    }, 100);
  },
};

window.SubjectsModule = SubjectsModule;
