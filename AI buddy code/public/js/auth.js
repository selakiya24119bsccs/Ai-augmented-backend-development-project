// auth.js - Authentication & Session Management

const Auth = {
  TOKEN_KEY: 'ai_study_buddy_token',
  USER_KEY: 'ai_study_buddy_user',

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  setToken(token) {
    localStorage.setItem(this.TOKEN_KEY, token);
  },

  getUser() {
    try {
      return JSON.parse(localStorage.getItem(this.USER_KEY));
    } catch {
      return null;
    }
  },

  setUser(user) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  getAuthHeaders() {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  },

  async register(name, email, password) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Registration failed');
    }
    this.setToken(data.data.token);
    this.setUser(data.data.user);
    return data.data;
  },

  async login(email, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Login failed');
    }
    this.setToken(data.data.token);
    this.setUser(data.data.user);
    return data.data;
  },

  async logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
    } catch (e) {
      // Ignore network errors during logout
    }
    this.clearSession();
    window.location.hash = '';
    App.showAuth();
  },

  async fetchCurrentUser() {
    if (!this.getToken()) return null;
    try {
      const res = await fetch('/api/auth/me', {
        headers: this.getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        this.setUser(data.data.user);
        return data.data.user;
      }
      this.clearSession();
      return null;
    } catch (err) {
      console.error('Error fetching user profile:', err);
      return null;
    }
  },
};

window.Auth = Auth;
