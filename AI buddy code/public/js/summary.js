// summary.js - AI Summaries Management

const SummaryModule = {
  summaries: [],

  async init() {
    await this.loadSummaries();
    this.bindEvents();
  },

  bindEvents() {
    const btnOpenGen = document.getElementById('btn-open-gen-summary-modal');
    if (btnOpenGen) {
      btnOpenGen.onclick = () => this.openGenerateModal();
    }
  },

  async loadSummaries() {
    try {
      const res = await fetch('/api/summaries', { headers: Auth.getAuthHeaders() });
      const json = await res.json();
      if (res.ok && json.success) {
        this.summaries = json.data || [];
        this.renderSummaries(this.summaries);
      }
    } catch (err) {
      console.error('Error loading summaries:', err);
    }
  },

  renderSummaries(list) {
    const container = document.getElementById('summaries-list');
    if (!container) return;

    if (!list || list.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">📄</div>
          <h3>No AI Summaries Yet</h3>
          <p>Generate your first structured academic summary with Short Summary, Important Points, Key Terms, and Main Concepts using Gemini AI.</p>
          <button class="btn btn-primary" onclick="SummaryModule.openGenerateModal()">Generate AI Summary</button>
        </div>`;
      return;
    }

    container.innerHTML = list
      .map((item) => {
        const materialTitle = item.materialId ? item.materialId.title : 'Study Material';
        const subject = item.materialId ? item.materialId.subject : 'General';
        const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '';
        const shortSummaryText = item.shortSummary || item.summary || '';
        const pointsCount = (item.importantPoints && item.importantPoints.length) || (item.keyPoints && item.keyPoints.length) || 0;
        const termsCount = (item.keyTerms && item.keyTerms.length) || 0;
        const conceptsCount = (item.mainConcepts && item.mainConcepts.length) || 0;

        return `
          <div class="material-card" style="display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div class="mat-header">
                <span class="badge">${App.escapeHtml(subject)}</span>
                <span style="font-size: 0.75rem; color: var(--text-muted);">${dateStr}</span>
              </div>
              <h3 class="mat-title">Summary: ${App.escapeHtml(materialTitle)}</h3>
              <div class="mat-snippet" style="margin-bottom: 12px;">${App.escapeHtml(shortSummaryText)}</div>
              
              <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px;">
                ${pointsCount > 0 ? `<span class="badge" style="background: #e0e7ff; color: #4338ca; font-size: 0.7rem;">📌 ${pointsCount} Key Points</span>` : ''}
                ${termsCount > 0 ? `<span class="badge" style="background: #fef3c7; color: #b45309; font-size: 0.7rem;">🔑 ${termsCount} Terms</span>` : ''}
                ${conceptsCount > 0 ? `<span class="badge" style="background: #dcfce7; color: #15803d; font-size: 0.7rem;">💡 ${conceptsCount} Concepts</span>` : ''}
              </div>
            </div>
            <div class="mat-footer" style="padding-top: 10px; border-top: 1px solid var(--border-color);">
              <button class="btn btn-secondary" style="font-size: 0.8125rem; padding: 5px 10px;" onclick="SummaryModule.viewFullSummary('${item._id}')">Read Full Summary</button>
              <button class="btn btn-danger" style="font-size: 0.8125rem; padding: 5px 10px;" onclick="SummaryModule.deleteSummary('${item._id}')">Delete</button>
            </div>
          </div>
        `;
      })
      .join('');
  },

  async openGenerateModal(preselectedMaterialId = '') {
    if (!window.Notes || !Notes.materials || Notes.materials.length === 0) {
      await Notes.loadMaterials();
    }

    const materials = Notes.materials;
    if (!materials || materials.length === 0) {
      App.toast('Please add at least one study material first before generating summaries!', 'warning');
      Notes.openAddModal();
      return;
    }

    const optionsHtml = materials
      .map(
        (m) => `<option value="${m._id}" ${m._id === preselectedMaterialId ? 'selected' : ''}>${App.escapeHtml(m.title)} (${App.escapeHtml(m.subject)})</option>`
      )
      .join('');

    const content = `
      <h2 style="margin-bottom: 8px; font-size: 1.25rem;">Generate Structured AI Summary</h2>
      <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 20px;">Gemini AI will synthesize a complete study summary divided into: Short Summary, Important Points, Key Terms, and Main Concepts.</p>
      <form id="form-gen-summary">
        <div class="form-group">
          <label for="sum-mat-select">Select Study Material</label>
          <select id="sum-mat-select" required>
            ${optionsHtml}
          </select>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px;">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary" id="btn-submit-gen-sum">✨ Generate with Gemini</button>
        </div>
      </form>
    `;

    App.openModal(content);

    const form = document.getElementById('form-gen-summary');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const materialId = document.getElementById('sum-mat-select').value;
      const submitBtn = document.getElementById('btn-submit-gen-sum');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Generating with Gemini...';

      try {
        const res = await fetch('/api/summaries', {
          method: 'POST',
          headers: Auth.getAuthHeaders(),
          body: JSON.stringify({ materialId }),
        });

        const json = await res.json();
        if (res.ok && json.success) {
          App.toast('Structured AI Summary created successfully!', 'success');
          App.closeModal();
          await this.loadSummaries();
          if (window.Dashboard) Dashboard.loadStats();
          if (json.data && json.data._id) {
            this.viewFullSummary(json.data._id);
          }
        } else {
          App.toast(json.message || 'Failed to generate summary', 'error');
          submitBtn.disabled = false;
          submitBtn.textContent = '✨ Generate with Gemini';
        }
      } catch (err) {
        App.toast(err.message, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = '✨ Generate with Gemini';
      }
    };
  },

  openGenerateModalForMaterial(materialId) {
    App.navigateTo('summaries');
    this.openGenerateModal(materialId);
  },

  viewFullSummary(id) {
    const item = this.summaries.find((s) => s._id === id);
    if (!item) return;

    const title = item.materialId ? item.materialId.title : 'Study Material';
    const subject = item.materialId ? item.materialId.subject : 'General';

    const shortSummary = item.shortSummary || item.summary || 'No summary available.';
    const importantPoints = (item.importantPoints && item.importantPoints.length > 0)
      ? item.importantPoints
      : (item.keyPoints || []);

    const keyTerms = item.keyTerms || [];
    const mainConcepts = item.mainConcepts || [];

    // Render Important Points HTML
    const pointsHtml = importantPoints.length > 0
      ? `<ul style="margin: 8px 0 0 18px; line-height: 1.6;">
          ${importantPoints.map((pt) => `<li>${App.escapeHtml(pt)}</li>`).join('')}
         </ul>`
      : '<p style="color: var(--text-muted); font-size: 0.875rem;">None recorded.</p>';

    // Render Key Terms HTML
    const termsHtml = keyTerms.length > 0
      ? `<div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
          ${keyTerms.map((kt) => {
            if (typeof kt === 'object' && kt.term) {
              return `
                <div style="background: #ffffff; padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                  <strong style="color: var(--primary);">${App.escapeHtml(kt.term)}</strong>: 
                  <span>${App.escapeHtml(kt.definition || '')}</span>
                </div>`;
            }
            return `
              <div style="background: #ffffff; padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                <span>${App.escapeHtml(kt)}</span>
              </div>`;
          }).join('')}
         </div>`
      : '<p style="color: var(--text-muted); font-size: 0.875rem;">None recorded.</p>';

    // Render Main Concepts HTML
    const conceptsHtml = mainConcepts.length > 0
      ? `<ul style="margin: 8px 0 0 18px; line-height: 1.6;">
          ${mainConcepts.map((mc) => `<li>${App.escapeHtml(mc)}</li>`).join('')}
         </ul>`
      : '<p style="color: var(--text-muted); font-size: 0.875rem;">None recorded.</p>';

    const content = `
      <div style="margin-bottom: 16px;">
        <span class="badge">${App.escapeHtml(subject)}</span>
        <h2 style="font-size: 1.35rem; margin-top: 8px;">AI Study Summary: ${App.escapeHtml(title)}</h2>
      </div>

      <div style="max-height: 65vh; overflow-y: auto; padding-right: 6px; display: flex; flex-direction: column; gap: 16px;">
        <!-- 1. Short Summary -->
        <div style="background: #f8fafc; padding: 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
          <h4 style="font-size: 0.9375rem; font-weight: 700; color: var(--primary-text); margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <span>📝</span> Short Summary
          </h4>
          <p style="font-size: 0.875rem; line-height: 1.6; color: var(--text-main);">${App.escapeHtml(shortSummary).replace(/\n/g, '<br>')}</p>
        </div>

        <!-- 2. Important Points -->
        <div style="background: #f0fdf4; padding: 16px; border-radius: var(--radius-sm); border: 1px solid #bbf7d0;">
          <h4 style="font-size: 0.9375rem; font-weight: 700; color: #166534; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <span>📌</span> Important Points
          </h4>
          ${pointsHtml}
        </div>

        <!-- 3. Key Terms & Definitions -->
        <div style="background: #fffbeb; padding: 16px; border-radius: var(--radius-sm); border: 1px solid #fde68a;">
          <h4 style="font-size: 0.9375rem; font-weight: 700; color: #92400e; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <span>🔑</span> Key Terms &amp; Definitions
          </h4>
          ${termsHtml}
        </div>

        <!-- 4. Main Concepts -->
        <div style="background: #f5f3ff; padding: 16px; border-radius: var(--radius-sm); border: 1px solid #ddd6fe;">
          <h4 style="font-size: 0.9375rem; font-weight: 700; color: #5b21b6; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <span>💡</span> Main Concepts
          </h4>
          ${conceptsHtml}
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; padding-top: 14px; border-top: 1px solid var(--border-color);">
        <button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
      </div>
    `;

    App.openModal(content);
  },

  async deleteSummary(id) {
    if (!confirm('Are you sure you want to delete this AI summary?')) return;

    try {
      const res = await fetch(`/api/summaries/${id}`, {
        method: 'DELETE',
        headers: Auth.getAuthHeaders(),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        App.toast('Summary deleted', 'success');
        await this.loadSummaries();
        if (window.Dashboard) Dashboard.loadStats();
      } else {
        App.toast(json.message || 'Failed to delete summary', 'error');
      }
    } catch (err) {
      App.toast(err.message, 'error');
    }
  },
};

window.SummaryModule = SummaryModule;
