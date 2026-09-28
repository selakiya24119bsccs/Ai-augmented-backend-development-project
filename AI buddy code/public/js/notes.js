// notes.js - Study Materials Management

const Notes = {
  materials: [],

  async init() {
    await this.loadMaterials();
    this.bindEvents();
  },

  bindEvents() {
    const searchInput = document.getElementById('materials-search');
    if (searchInput) {
      searchInput.oninput = (e) => this.filterMaterials();
    }

    const filterSelect = document.getElementById('materials-subject-filter');
    if (filterSelect) {
      filterSelect.onchange = () => this.filterMaterials();
    }

    const btnOpenAdd = document.getElementById('btn-open-add-material-modal');
    if (btnOpenAdd) {
      btnOpenAdd.onclick = () => this.openAddModal();
    }

    const btnSeedMat = document.getElementById('btn-seed-default-materials');
    if (btnSeedMat) {
      btnSeedMat.onclick = () => this.seedDefaultMaterials();
    }
  },

  async loadMaterials() {
    try {
      const res = await fetch('/api/materials', { headers: Auth.getAuthHeaders() });
      const json = await res.json();
      if (res.ok && json.success) {
        this.materials = json.data || [];
        this.populateSubjectDropdown();
        this.renderMaterials(this.materials);
      }
    } catch (err) {
      console.error('Error loading materials:', err);
    }
  },

  async seedDefaultMaterials() {
    const btn = document.getElementById('btn-seed-default-materials');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Loading Materials...';
    }
    try {
      const res = await fetch('/api/materials/defaults', {
        method: 'POST',
        headers: Auth.getAuthHeaders(),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        App.toast(json.message || 'Course materials loaded successfully!', 'success');
        await this.loadMaterials();
        if (window.SubjectsModule) SubjectsModule.loadSubjects();
        if (window.Dashboard) Dashboard.loadStats();
      } else {
        App.toast(json.message || 'Failed to load course materials', 'error');
      }
    } catch (err) {
      App.toast(err.message, 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '⚡ Load Course Materials';
      }
    }
  },

  populateSubjectDropdown() {
    const filterSelect = document.getElementById('materials-subject-filter');
    if (!filterSelect) return;

    let subjects = Array.from(new Set(this.materials.map((m) => m.subject).filter(Boolean)));
    if (window.SubjectsModule && Array.isArray(SubjectsModule.subjects) && SubjectsModule.subjects.length > 0) {
      const moduleSubjs = SubjectsModule.subjects.map((s) => s.name || s.subject).filter(Boolean);
      subjects = Array.from(new Set([...subjects, ...moduleSubjs]));
    }
    const currentVal = filterSelect.value;

    filterSelect.innerHTML = '<option value="">All Subjects</option>' +
      subjects.map((s) => `<option value="${App.escapeHtml(s)}">${App.escapeHtml(s)}</option>`).join('');

    if (subjects.includes(currentVal)) {
      filterSelect.value = currentVal;
    }
  },

  filterMaterials() {
    const search = (document.getElementById('materials-search')?.value || '').toLowerCase().trim();
    const subject = document.getElementById('materials-subject-filter')?.value || '';

    const filtered = this.materials.filter((m) => {
      const matchesSearch = !search ||
        (m.title && m.title.toLowerCase().includes(search)) ||
        (m.subject && m.subject.toLowerCase().includes(search)) ||
        (m.content && m.content.toLowerCase().includes(search));

      const matchesSubject = !subject || (m.subject && m.subject.toLowerCase() === subject.toLowerCase());

      return matchesSearch && matchesSubject;
    });

    this.renderMaterials(filtered);
  },

  filterBySubject(subjectName) {
    const filterSelect = document.getElementById('materials-subject-filter');
    if (filterSelect) {
      filterSelect.value = subjectName;
    }
    this.filterMaterials();
  },

  renderMaterials(list) {
    const container = document.getElementById('materials-list');
    if (!container) return;

    if (!list || list.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">📝</div>
          <h3>No Study Materials Found</h3>
          <p>Add notes, textbook chapters, or lecture summaries to start generating flashcards and quizzes.</p>
          <div style="display: flex; gap: 10px; justify-content: center; margin-top: 14px; flex-wrap: wrap;">
            <button class="btn btn-primary" onclick="Notes.openAddModal()">➕ Add Study Material</button>
            <button class="btn btn-secondary" onclick="Notes.seedDefaultMaterials()">⚡ Load Course Materials</button>
          </div>
        </div>`;
      return;
    }

    container.innerHTML = list
      .map((item) => {
        const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '';
        const fileBadge = item.fileType === 'pdf' ? '📄 PDF' : (item.fileType === 'docx' || item.fileType === 'doc' ? '📘 DOC' : (item.fileType === 'txt' ? '📝 TXT' : '✍️ Notes'));

        return `
          <div class="material-card">
            <div class="mat-header">
              <div style="display: flex; gap: 6px; align-items: center;">
                <span class="badge">${App.escapeHtml(item.subject)}</span>
                <span class="badge" style="background: #f1f5f9; color: var(--text-muted);">${fileBadge}</span>
              </div>
              <span style="font-size: 0.75rem; color: var(--text-muted);">${dateStr}</span>
            </div>
            <h3 class="mat-title">${App.escapeHtml(item.title)}</h3>
            ${item.originalFileName ? `<p style="font-size: 0.75rem; color: var(--primary); margin-bottom: 6px;">📎 ${App.escapeHtml(item.originalFileName)}</p>` : ''}
            <p class="mat-snippet">${App.escapeHtml(item.content)}</p>
            <div class="mat-footer">
              <div class="mat-tools">
                <button class="btn btn-secondary" style="font-size: 0.8125rem; padding: 4px 8px;" onclick="Notes.viewMaterial('${item._id}')">View</button>
                <button class="btn btn-secondary" style="font-size: 0.8125rem; padding: 4px 8px;" onclick="Notes.openEditModal('${item._id}')">Edit</button>
                <button class="btn btn-danger" style="font-size: 0.8125rem; padding: 4px 8px;" onclick="Notes.deleteMaterial('${item._id}')">Delete</button>
              </div>
              <button class="btn btn-primary" style="font-size: 0.8125rem; padding: 4px 8px;" onclick="SummaryModule.openGenerateModalForMaterial('${item._id}')">AI Summary</button>
            </div>
          </div>
        `;
      })
      .join('');
  },

  openAddModal(presetSubject = '') {
    const content = `
      <h2 style="margin-bottom: 8px; font-size: 1.25rem;">Add Study Material</h2>
      <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 20px;">Upload a file (PDF, DOC/DOCX, TXT) or paste your notes directly.</p>
      <form id="form-add-material">
        <div class="form-group">
          <label for="mat-input-file">Upload Document (Optional: PDF, DOC, DOCX, TXT)</label>
          <input type="file" id="mat-input-file" accept=".pdf,.doc,.docx,.txt,.md">
          <span style="font-size: 0.75rem; color: var(--text-muted);">Text will be extracted automatically for AI summaries & quizzes.</span>
        </div>
        <div class="form-group">
          <label for="mat-input-title">Title</label>
          <input type="text" id="mat-input-title" required placeholder="e.g. TCP/IP Architecture and Layers">
        </div>
        <div class="form-group">
          <label for="mat-input-subject">Subject</label>
          <input type="text" id="mat-input-subject" required value="${App.escapeHtml(presetSubject)}" placeholder="e.g. Computer Networks">
        </div>
        <div class="form-group">
          <label for="mat-input-content">Content / Lecture Notes (Optional if uploading file)</label>
          <textarea id="mat-input-content" rows="6" placeholder="Paste study notes or additional context here..."></textarea>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary" id="btn-submit-add-mat">Save Material</button>
        </div>
      </form>
    `;

    App.openModal(content);

    const fileInput = document.getElementById('mat-input-file');
    const titleInput = document.getElementById('mat-input-title');

    if (fileInput && titleInput) {
      fileInput.onchange = () => {
        if (fileInput.files && fileInput.files[0]) {
          const fileName = fileInput.files[0].name;
          if (!titleInput.value.trim()) {
            titleInput.value = fileName.replace(/\.[^/.]+$/, '');
          }
        }
      };
    }

    const form = document.getElementById('form-add-material');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const title = document.getElementById('mat-input-title').value.trim();
      const subject = document.getElementById('mat-input-subject').value.trim();
      const textContent = document.getElementById('mat-input-content').value.trim();
      const file = fileInput.files ? fileInput.files[0] : null;

      if (!file && !textContent) {
        App.toast('Please provide either text content or a file to upload.', 'warning');
        return;
      }

      const submitBtn = document.getElementById('btn-submit-add-mat');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving Material...';

      try {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('subject', subject);
        if (textContent) formData.append('content', textContent);
        if (file) formData.append('file', file);

        const token = Auth.getToken();
        const res = await fetch('/api/materials', {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        });

        const json = await res.json();
        if (res.ok && json.success) {
          App.toast('Study material added successfully!', 'success');
          App.closeModal();
          await this.loadMaterials();
          if (window.Dashboard) Dashboard.loadStats();
          if (window.SubjectsModule) SubjectsModule.loadSubjects();
        } else {
          App.toast(json.message || 'Failed to add material', 'error');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Save Material';
        }
      } catch (err) {
        App.toast(err.message, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Material';
      }
    };
  },

  openEditModal(id) {
    const item = this.materials.find((m) => m._id === id);
    if (!item) return;

    const content = `
      <h2 style="margin-bottom: 8px; font-size: 1.25rem;">Edit Study Material</h2>
      <form id="form-edit-material">
        <div class="form-group">
          <label for="edit-mat-title">Title</label>
          <input type="text" id="edit-mat-title" required value="${App.escapeHtml(item.title)}">
        </div>
        <div class="form-group">
          <label for="edit-mat-subject">Subject</label>
          <input type="text" id="edit-mat-subject" required value="${App.escapeHtml(item.subject)}">
        </div>
        <div class="form-group">
          <label for="edit-mat-content">Content</label>
          <textarea id="edit-mat-content" rows="8" required>${App.escapeHtml(item.content)}</textarea>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Update Material</button>
        </div>
      </form>
    `;

    App.openModal(content);

    const form = document.getElementById('form-edit-material');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const title = document.getElementById('edit-mat-title').value.trim();
      const subject = document.getElementById('edit-mat-subject').value.trim();
      const textContent = document.getElementById('edit-mat-content').value.trim();

      try {
        const res = await fetch(`/api/materials/${id}`, {
          method: 'PUT',
          headers: Auth.getAuthHeaders(),
          body: JSON.stringify({ title, subject, content: textContent }),
        });
        const json = await res.json();
        if (res.ok && json.success) {
          App.toast('Study material updated!', 'success');
          App.closeModal();
          await this.loadMaterials();
        } else {
          App.toast(json.message || 'Failed to update material', 'error');
        }
      } catch (err) {
        App.toast(err.message, 'error');
      }
    };
  },

  viewMaterial(id) {
    const item = this.materials.find((m) => m._id === id);
    if (!item) return;

    const content = `
      <div style="margin-bottom: 16px;">
        <span class="badge">${App.escapeHtml(item.subject)}</span>
        <h2 style="font-size: 1.35rem; margin-top: 8px;">${App.escapeHtml(item.title)}</h2>
      </div>
      <div style="white-space: pre-wrap; line-height: 1.7; color: var(--text-main); max-height: 50vh; overflow-y: auto; padding: 14px; background: #f8fafc; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
        ${App.escapeHtml(item.content)}
      </div>
      <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
        <button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
        <button class="btn btn-primary" onclick="Flashcards.openGenerateModalForMaterial('${item._id}'); App.closeModal();">Generate Flashcards</button>
      </div>
    `;

    App.openModal(content);
  },

  async deleteMaterial(id) {
    if (!confirm('Are you sure you want to delete this study material and associated AI summaries/flashcards?')) {
      return;
    }

    try {
      const res = await fetch(`/api/materials/${id}`, {
        method: 'DELETE',
        headers: Auth.getAuthHeaders(),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        App.toast('Study material deleted', 'success');
        await this.loadMaterials();
        if (window.Dashboard) Dashboard.loadStats();
        if (window.SubjectsModule) SubjectsModule.loadSubjects();
      } else {
        App.toast(json.message || 'Failed to delete material', 'error');
      }
    } catch (err) {
      App.toast(err.message, 'error');
    }
  },
};

window.Notes = Notes;
