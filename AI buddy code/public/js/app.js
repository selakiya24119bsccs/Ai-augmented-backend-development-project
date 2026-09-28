// app.js - Master SPA Controller & Navigation

const App = {
  currentView: 'dashboard',

  async init() {
    this.bindAuthEvents();
    this.bindNavigation();
    this.bindModals();

    // Check existing authentication
    if (Auth.isAuthenticated()) {
      const user = await Auth.fetchCurrentUser();
      if (user) {
        this.showApp();
        const initialHash = window.location.hash.replace('#', '') || 'dashboard';
        this.navigateTo(initialHash);
      } else {
        this.showAuth();
      }
    } else {
      this.showAuth();
    }

    // Listen to browser hash changes
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && Auth.isAuthenticated()) {
        this.navigateTo(hash, false);
      }
    });
  },

  showAuth() {
    document.getElementById('view-auth').classList.remove('hidden');
    document.getElementById('app-shell').classList.add('hidden');
  },

  showApp() {
    document.getElementById('view-auth').classList.add('hidden');
    document.getElementById('app-shell').classList.remove('hidden');
    this.updateUserInterface();
  },

  updateUserInterface() {
    const user = Auth.getUser();
    if (!user) return;

    const initial = user.name ? user.name.charAt(0).toUpperCase() : 'S';

    // Sidebar
    const sideAvatar = document.getElementById('sidebar-user-avatar');
    const sideName = document.getElementById('sidebar-user-name');
    const sideRole = document.getElementById('sidebar-user-role');
    if (sideAvatar) sideAvatar.textContent = initial;
    if (sideName) sideName.textContent = user.name;
    if (sideRole) sideRole.textContent = user.role;

    // Mobile avatar
    const mobileAvatar = document.getElementById('mobile-user-initials');
    if (mobileAvatar) mobileAvatar.textContent = initial;

    // Profile View
    const profAvatar = document.getElementById('profile-avatar');
    const profName = document.getElementById('profile-name');
    const profEmail = document.getElementById('profile-email');
    const profRole = document.getElementById('profile-role');
    const profJoined = document.getElementById('profile-joined');

    if (profAvatar) profAvatar.textContent = initial;
    if (profName) profName.textContent = user.name;
    if (profEmail) profEmail.textContent = user.email;
    if (profRole) profRole.textContent = user.role.toUpperCase();
    if (profJoined) {
      profJoined.textContent = user.createdAt ? `Joined ${new Date(user.createdAt).toLocaleDateString()}` : 'Student Member';
    }
  },

  bindAuthEvents() {
    const linkToReg = document.getElementById('link-to-register');
    const linkToLog = document.getElementById('link-to-login');
    const loginBox = document.getElementById('login-box');
    const regBox = document.getElementById('register-box');

    if (linkToReg && linkToLog) {
      linkToReg.onclick = (e) => {
        e.preventDefault();
        loginBox.classList.add('hidden');
        regBox.classList.remove('hidden');
      };

      linkToLog.onclick = (e) => {
        e.preventDefault();
        regBox.classList.add('hidden');
        loginBox.classList.remove('hidden');
      };
    }

    // Login Form Submit
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
      formLogin.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const btn = document.getElementById('btn-login-submit');

        btn.disabled = true;
        btn.innerHTML = '<span>Logging in...</span>';

        try {
          await Auth.login(email, password);
          this.toast('Welcome back! Logged in successfully.', 'success');
          this.showApp();
          this.navigateTo('dashboard');
        } catch (err) {
          this.toast(err.message, 'error');
        } finally {
          btn.disabled = false;
          btn.innerHTML = '<span>Log In</span>';
        }
      };
    }

    // 1-Click Demo Account Login
    const btnDemoLogin = document.getElementById('btn-demo-login');
    if (btnDemoLogin) {
      btnDemoLogin.onclick = async () => {
        btnDemoLogin.disabled = true;
        btnDemoLogin.innerHTML = '<span>Logging into demo account...</span>';
        try {
          await Auth.login('alex@university.edu', 'password123');
          this.toast('Logged in as Alex Johnson (Demo Account)!', 'success');
          this.showApp();
          this.navigateTo('dashboard');
        } catch (err) {
          this.toast(err.message || 'Demo login failed', 'error');
        } finally {
          btnDemoLogin.disabled = false;
          btnDemoLogin.innerHTML = '<span>⚡ 1-Click Demo Account (Alex Johnson)</span>';
        }
      };
    }

    // Register Form Submit
    const formRegister = document.getElementById('form-register');
    if (formRegister) {
      formRegister.onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const btn = document.getElementById('btn-register-submit');

        btn.disabled = true;
        btn.innerHTML = '<span>Creating Account...</span>';

        try {
          await Auth.register(name, email, password);
          this.toast('Account created! Welcome to AI Study Buddy.', 'success');
          this.showApp();
          this.navigateTo('dashboard');
        } catch (err) {
          this.toast(err.message, 'error');
        } finally {
          btn.disabled = false;
          btn.innerHTML = '<span>Create Student Account</span>';
        }
      };
    }

    // Logout
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.onclick = () => Auth.logout();
    }

    const btnProfLogout = document.getElementById('btn-profile-logout');
    if (btnProfLogout) {
      btnProfLogout.onclick = () => Auth.logout();
    }
  },

  bindNavigation() {
    // Nav Items click
    document.querySelectorAll('.sidebar-nav .nav-item').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = link.getAttribute('data-view');
        this.navigateTo(targetView);

        // Close mobile drawer on item click
        const sidebar = document.getElementById('app-sidebar');
        if (sidebar) sidebar.classList.remove('open');
      });
    });

    // Mobile Sidebar Drawer Toggle
    const toggleBtn = document.getElementById('btn-sidebar-toggle');
    const sidebar = document.getElementById('app-sidebar');
    if (toggleBtn && sidebar) {
      toggleBtn.onclick = () => {
        sidebar.classList.toggle('open');
      };
    }
  },

  navigateTo(viewName, updateHash = true) {
    const validViews = [
      'dashboard',
      'subjects',
      'materials',
      'chat',
      'summaries',
      'flashcards',
      'quiz',
      'study-plan',
      'progress',
      'profile',
    ];

    if (!validViews.includes(viewName)) {
      viewName = 'dashboard';
    }

    this.currentView = viewName;

    // Update active nav link
    document.querySelectorAll('.sidebar-nav .nav-item').forEach((el) => {
      if (el.getAttribute('data-view') === viewName) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // Update page title & description
    const titles = {
      dashboard: ['Dashboard', 'Track your daily learning activities and AI study tools.'],
      subjects: ['Academic Subjects', 'Browse and organize study materials by curriculum subject.'],
      materials: ['Study Materials & Notes', 'Upload, search, and manage your course notes and reference texts.'],
      chat: ['AI Study Buddy', 'Ask academic questions, request proofs, and receive student-friendly explanations.'],
      summaries: ['AI Summaries', 'High-yield syntheses and key takeaways extracted with Gemini.'],
      flashcards: ['Interactive 3D Flashcards', 'Practice active recall and test definitions with 3D flip cards.'],
      quiz: ['AI Quiz Practice', 'Challenge yourself with AI multiple-choice quizzes and detailed answer reviews.'],
      'study-plan': ['Personalized Study Plan', 'Generate a structured day-by-day roadmap targeting your exam date.'],
      progress: ['Learning Analytics & Progress', 'Monitor your mastery, quiz accuracy, and completed study materials.'],
      profile: ['Student Profile', 'View account details, learning statistics, and account settings.'],
    };

    const titleEl = document.getElementById('page-title');
    const descEl = document.getElementById('page-description');
    if (titleEl && titles[viewName]) titleEl.textContent = titles[viewName][0];
    if (descEl && titles[viewName]) descEl.textContent = titles[viewName][1];

    // Show active content section
    document.querySelectorAll('.content-view').forEach((sec) => {
      sec.classList.remove('active');
    });

    const activeSec = document.getElementById(`view-${viewName}`);
    if (activeSec) {
      activeSec.classList.add('active');
    }

    if (updateHash) {
      window.location.hash = viewName;
    }

    // Trigger module initialization or refresh
    if (viewName === 'dashboard' && window.Dashboard) Dashboard.init();
    if (viewName === 'subjects' && window.SubjectsModule) SubjectsModule.init();
    if (viewName === 'materials' && window.Notes) Notes.init();
    if (viewName === 'chat' && window.ChatModule) ChatModule.init();
    if (viewName === 'summaries' && window.SummaryModule) SummaryModule.init();
    if (viewName === 'flashcards' && window.Flashcards) Flashcards.init();
    if (viewName === 'quiz' && window.QuizModule) QuizModule.init();
    if (viewName === 'study-plan' && window.StudyPlanModule) StudyPlanModule.init();
    if (viewName === 'progress' && window.ProgressModule) ProgressModule.init();
    if (viewName === 'profile') this.updateProfileStats();
  },

  async updateProfileStats() {
    this.updateUserInterface();
    try {
      const res = await fetch('/api/progress', { headers: Auth.getAuthHeaders() });
      const json = await res.json();
      if (res.ok && json.success) {
        const d = json.data;
        document.getElementById('prof-stat-materials').textContent = d.totalMaterials || 0;
        document.getElementById('prof-stat-quizzes').textContent = d.totalQuizzes || 0;
        document.getElementById('prof-stat-flashcards').textContent = d.totalFlashcards || 0;
        document.getElementById('prof-stat-plans').textContent = d.totalStudyPlans || 0;
      }
    } catch (e) {
      console.error('Error fetching profile stats:', e);
    }
  },

  // --- Modal Helpers ---
  bindModals() {
    const overlay = document.getElementById('modal-overlay');
    const closeBtn = document.getElementById('modal-close-btn');

    if (closeBtn) closeBtn.onclick = () => this.closeModal();

    if (overlay) {
      overlay.onclick = (e) => {
        if (e.target === overlay) this.closeModal();
      };
    }
  },

  openModal(contentHtml) {
    const overlay = document.getElementById('modal-overlay');
    const body = document.getElementById('modal-body');
    if (body) body.innerHTML = contentHtml;
    if (overlay) overlay.classList.remove('hidden');
  },

  closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.classList.add('hidden');
    const body = document.getElementById('modal-body');
    if (body) body.innerHTML = '';
  },

  // --- Toast Notifications ---
  toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `
      <span>${icon}</span>
      <span style="flex: 1;">${this.escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  escapeHtml(str) {
    if (typeof str !== 'string') return str == null ? '' : String(str);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },
};

window.App = App;

// Launch App on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
