// chat.js - AI Study Buddy Chat Interface

const ChatModule = {
  messages: [],
  isWaiting: false,

  init() {
    this.bindEvents();
  },

  bindEvents() {
    const sendBtn = document.getElementById('btn-send-chat');
    const inputArea = document.getElementById('chat-input');
    const clearBtn = document.getElementById('btn-clear-chat');

    if (sendBtn && inputArea) {
      sendBtn.onclick = () => this.sendMessage();
      inputArea.onkeydown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      };
    }

    if (clearBtn) {
      clearBtn.onclick = () => this.clearHistory();
    }

    // Bind academic starter chips
    document.querySelectorAll('.prompt-chip').forEach((chip) => {
      chip.onclick = () => {
        const prompt = chip.getAttribute('data-prompt');
        if (prompt && inputArea) {
          inputArea.value = prompt;
          inputArea.focus();
        }
      };
    });
  },

  async sendMessage() {
    const inputArea = document.getElementById('chat-input');
    if (!inputArea) return;

    const text = inputArea.value.trim();
    if (!text || this.isWaiting) return;

    inputArea.value = '';

    // Add user message
    this.messages.push({ role: 'user', content: text });
    this.appendMessage('user', text);

    // Show AI loading indicator
    this.isWaiting = true;
    const loadingId = this.showLoadingIndicator();

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: Auth.getAuthHeaders(),
        body: JSON.stringify({
          messages: this.messages,
        }),
      });

      const json = await res.json();
      this.removeLoadingIndicator(loadingId);

      if (res.ok && json.success) {
        const reply = json.data.reply;
        this.messages.push({ role: 'assistant', content: reply });
        this.appendMessage('ai', reply);
      } else {
        this.appendMessage('ai', `⚠️ Error: ${json.message || 'Could not reach AI assistant'}`);
      }
    } catch (err) {
      this.removeLoadingIndicator(loadingId);
      this.appendMessage('ai', `⚠️ Connection error: ${err.message}`);
    } finally {
      this.isWaiting = false;
    }
  },

  appendMessage(role, content) {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role}`;

    const avatar = role === 'user' ? '🧑‍🎓' : '🤖';
    const formattedContent = this.formatMarkdown(content);

    bubble.innerHTML = `
      <div class="chat-avatar">${avatar}</div>
      <div class="chat-content">${formattedContent}</div>
    `;

    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
  },

  showLoadingIndicator() {
    const container = document.getElementById('chat-messages');
    if (!container) return null;

    const id = 'loading-' + Date.now();
    const bubble = document.createElement('div');
    bubble.id = id;
    bubble.className = 'chat-bubble ai';
    bubble.innerHTML = `
      <div class="chat-avatar">🤖</div>
      <div class="chat-content" style="color: var(--text-muted);">
        <span class="typing-dots">AI Study Buddy is thinking...</span>
      </div>
    `;

    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
    return id;
  },

  removeLoadingIndicator(id) {
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.remove();
  },

  clearHistory() {
    this.messages = [];
    const container = document.getElementById('chat-messages');
    if (container) {
      container.innerHTML = `
        <div class="chat-bubble ai">
          <div class="chat-avatar">🤖</div>
          <div class="chat-content">
            <p>Chat history cleared. What would you like to explore next?</p>
          </div>
        </div>
      `;
    }
    App.toast('Chat session cleared', 'info');
  },

  formatMarkdown(text) {
    if (!text) return '';
    let escaped = App.escapeHtml(text);
    // Bold: **text**
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic: *text*
    escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Bullet lines: - text
    escaped = escaped.replace(/(?:^|\n)- (.*)/g, '<br>• $1');
    // Line breaks
    escaped = escaped.replace(/\n/g, '<br>');
    return `<p>${escaped}</p>`;
  },
};

window.ChatModule = ChatModule;
