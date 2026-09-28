// flashcards.js - Interactive 3D Flashcards with Study Tracking

const Flashcards = {
  cards: [],
  currentIndex: 0,
  isFlipped: false,

  async init() {
    await this.loadMaterialsFilter();
    await this.loadFlashcards();
    this.bindEvents();
  },

  bindEvents() {
    const filterSelect = document.getElementById('flashcard-material-filter');
    if (filterSelect) {
      filterSelect.onchange = (e) => this.loadFlashcards(e.target.value);
    }

    const btnOpenGen = document.getElementById('btn-open-gen-flashcards-modal');
    if (btnOpenGen) {
      btnOpenGen.onclick = () => this.openGenerateModal();
    }

    const btnEmptyGen = document.getElementById('btn-empty-gen-fc');
    if (btnEmptyGen) {
      btnEmptyGen.onclick = () => this.openGenerateModal();
    }

    // Flip, Prev, Next, Mark as Studied buttons
    const btnFlip = document.getElementById('btn-fc-flip');
    if (btnFlip) btnFlip.onclick = () => this.flipCurrentCard();

    const btnPrev = document.getElementById('btn-fc-prev');
    if (btnPrev) btnPrev.onclick = () => this.prevCard();

    const btnNext = document.getElementById('btn-fc-next');
    if (btnNext) btnNext.onclick = () => this.nextCard();

    const btnStudy = document.getElementById('btn-fc-study');
    if (btnStudy) btnStudy.onclick = () => this.toggleCurrentStudied();

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      // Only active if flashcards view is active
      const view = document.getElementById('view-flashcards');
      if (!view || !view.classList.contains('active')) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        this.flipCurrentCard();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        this.nextCard();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        this.prevCard();
      } else if (e.code === 'KeyS') {
        e.preventDefault();
        this.toggleCurrentStudied();
      }
    });
  },

  async loadMaterialsFilter() {
    try {
      if (!window.Notes || !Notes.materials || Notes.materials.length === 0) {
        await Notes.loadMaterials();
      }
      const filterSelect = document.getElementById('flashcard-material-filter');
      if (!filterSelect) return;

      filterSelect.innerHTML = '<option value="">All Materials</option>' +
        Notes.materials.map((m) => `<option value="${m._id}">${App.escapeHtml(m.title)}</option>`).join('');
    } catch (err) {
      console.error('Error populating flashcards filter:', err);
    }
  },

  async loadFlashcards(materialId = '') {
    try {
      let url = '/api/flashcards';
      if (materialId) url += `?materialId=${materialId}`;

      const res = await fetch(url, { headers: Auth.getAuthHeaders() });
      const json = await res.json();
      if (res.ok && json.success) {
        this.cards = json.data || [];
        this.currentIndex = 0;
        this.isFlipped = false;
        this.renderCard();
      }
    } catch (err) {
      console.error('Error loading flashcards:', err);
    }
  },

  renderCard() {
    const scene = document.getElementById('flashcard-scene');
    const controls = document.getElementById('flashcard-controls');
    const counter = document.getElementById('fc-counter');
    const btnStudy = document.getElementById('btn-fc-study');

    if (!this.cards || this.cards.length === 0) {
      if (controls) controls.classList.add('hidden');
      if (scene) {
        scene.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">🃏</div>
            <h3>No Flashcards Available</h3>
            <p>Generate high-yield recall flashcards from your study materials with Gemini AI.</p>
            <button class="btn btn-primary" onclick="Flashcards.openGenerateModal()">Generate Flashcards</button>
          </div>`;
      }
      return;
    }

    if (controls) controls.classList.remove('hidden');
    const card = this.cards[this.currentIndex];
    this.isFlipped = false;

    if (counter) {
      counter.textContent = `Card ${this.currentIndex + 1} of ${this.cards.length}`;
    }

    // Update Studied button appearance
    if (btnStudy) {
      if (card.isStudied) {
        btnStudy.innerHTML = '✅ Studied (S)';
        btnStudy.style.background = '#059669';
        btnStudy.title = 'Click to unmark as studied';
      } else {
        btnStudy.innerHTML = 'Mark as Studied (S)';
        btnStudy.style.background = 'var(--primary)';
        btnStudy.title = 'Click to mark as studied';
      }
    }

    const materialTitle = card.materialId ? card.materialId.title : 'Study Deck';
    const studiedBadge = card.isStudied
      ? `<span class="badge" style="background: #dcfce7; color: #15803d; font-size: 0.72rem;">✅ Mastered</span>`
      : `<span class="badge" style="background: #fef3c7; color: #b45309; font-size: 0.72rem;">To Review</span>`;

    scene.innerHTML = `
      <div id="active-card-3d" class="card-3d" onclick="Flashcards.flipCurrentCard()">
        <!-- Front Side (Question) -->
        <div class="card-face card-face-front">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="card-tag">Question • ${App.escapeHtml(materialTitle)}</span>
              ${studiedBadge}
            </div>
            <button class="btn-icon" title="Delete Flashcard" onclick="event.stopPropagation(); Flashcards.deleteCard('${card._id}')" style="color: var(--danger);">🗑️</button>
          </div>
          <div class="card-body-text">
            ${App.escapeHtml(card.question)}
          </div>
          <div class="card-hint">💡 Click or press Space to reveal answer • Press S to mark studied</div>
        </div>

        <!-- Back Side (Answer) -->
        <div class="card-face card-face-back">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="card-tag">Answer • Academic Explanation</span>
              ${studiedBadge}
            </div>
            <button class="btn-icon" title="Delete Flashcard" onclick="event.stopPropagation(); Flashcards.deleteCard('${card._id}')" style="color: var(--danger);">🗑️</button>
          </div>
          <div class="card-body-text">
            ${App.escapeHtml(card.answer)}
          </div>
          <div class="card-hint">🔄 Click or press Space to flip back • Press S to mark studied</div>
        </div>
      </div>
    `;
  },

  flipCurrentCard() {
    const cardEl = document.getElementById('active-card-3d');
    if (!cardEl) return;
    this.isFlipped = !this.isFlipped;
    if (this.isFlipped) {
      cardEl.classList.add('is-flipped');
    } else {
      cardEl.classList.remove('is-flipped');
    }
  },

  nextCard() {
    if (this.cards.length === 0) return;
    if (this.currentIndex < this.cards.length - 1) {
      this.currentIndex++;
    } else {
      this.currentIndex = 0; // wrap around
    }
    this.renderCard();
  },

  prevCard() {
    if (this.cards.length === 0) return;
    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else {
      this.currentIndex = this.cards.length - 1; // wrap to end
    }
    this.renderCard();
  },

  async toggleCurrentStudied() {
    if (!this.cards || this.cards.length === 0) return;
    const card = this.cards[this.currentIndex];
    if (!card) return;

    try {
      const res = await fetch(`/api/flashcards/${card._id}/study`, {
        method: 'PATCH',
        headers: Auth.getAuthHeaders(),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        card.isStudied = json.data.isStudied;
        card.studyCount = json.data.studyCount;
        App.toast(json.message || (card.isStudied ? 'Card marked as studied!' : 'Card marked for review'), 'success');
        this.renderCard();
        if (window.Dashboard) Dashboard.loadStats();
      } else {
        App.toast(json.message || 'Failed to update study status', 'error');
      }
    } catch (err) {
      App.toast(err.message, 'error');
    }
  },

  async deleteCard(id) {
    if (!confirm('Are you sure you want to delete this flashcard?')) return;

    try {
      const res = await fetch(`/api/flashcards/${id}`, {
        method: 'DELETE',
        headers: Auth.getAuthHeaders(),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        App.toast('Flashcard deleted', 'success');
        this.cards = this.cards.filter((c) => c._id !== id);
        if (this.currentIndex >= this.cards.length) {
          this.currentIndex = Math.max(0, this.cards.length - 1);
        }
        this.renderCard();
        if (window.Dashboard) Dashboard.loadStats();
      } else {
        App.toast(json.message || 'Failed to delete card', 'error');
      }
    } catch (err) {
      App.toast(err.message, 'error');
    }
  },

  async openGenerateModal(preselectedMaterialId = '') {
    if (!window.Notes || !Notes.materials || Notes.materials.length === 0) {
      await Notes.loadMaterials();
    }

    const materials = Notes.materials;
    if (!materials || materials.length === 0) {
      App.toast('Please add at least one study material first before generating flashcards!', 'warning');
      Notes.openAddModal();
      return;
    }

    const optionsHtml = materials
      .map(
        (m) => `<option value="${m._id}" ${m._id === preselectedMaterialId ? 'selected' : ''}>${App.escapeHtml(m.title)} (${App.escapeHtml(m.subject)})</option>`
      )
      .join('');

    const content = `
      <h2 style="margin-bottom: 8px; font-size: 1.25rem;">Generate AI Flashcards</h2>
      <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 20px;">Gemini AI will extract core concepts, definitions, and questions for active recall.</p>
      <form id="form-gen-flashcards">
        <div class="form-group">
          <label for="fc-mat-select">Select Study Material</label>
          <select id="fc-mat-select" required>
            ${optionsHtml}
          </select>
        </div>
        <div class="form-group">
          <label for="fc-count-select">Number of Flashcards</label>
          <select id="fc-count-select">
            <option value="3">3 Flashcards (Quick review)</option>
            <option value="5" selected>5 Flashcards (Recommended)</option>
            <option value="8">8 Flashcards (Comprehensive)</option>
            <option value="10">10 Flashcards (Deep dive)</option>
          </select>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px;">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary" id="btn-submit-gen-fc">✨ Generate with Gemini</button>
        </div>
      </form>
    `;

    App.openModal(content);

    const form = document.getElementById('form-gen-flashcards');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const materialId = document.getElementById('fc-mat-select').value;
      const count = parseInt(document.getElementById('fc-count-select').value, 10);
      const submitBtn = document.getElementById('btn-submit-gen-fc');

      submitBtn.disabled = true;
      submitBtn.textContent = 'Generating with Gemini...';

      try {
        const res = await fetch('/api/flashcards', {
          method: 'POST',
          headers: Auth.getAuthHeaders(),
          body: JSON.stringify({ materialId, count }),
        });

        const json = await res.json();
        if (res.ok && json.success) {
          App.toast(`Generated ${json.data.length} flashcards!`, 'success');
          App.closeModal();
          await this.loadFlashcards(materialId);
          if (window.Dashboard) Dashboard.loadStats();
        } else {
          App.toast(json.message || 'Failed to generate flashcards', 'error');
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
};

window.Flashcards = Flashcards;
