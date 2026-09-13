// ===== STATE =====
const state = {
  lang: 'fa',           // 'fa' or 'en'
  model: 'gpt-4o-mini',
  apiKey: '',
  path: 'beginner',
  messages: [],         // conversation history for API
  isStreaming: false,
  sessionId: '',
};

// Boxer system prompt - adapts based on language and level
function getSystemPrompt() {
  const paths = {
    fa: {
      beginner: 'تو یه مربی بوکس حرفه‌ای و صبور هستی. داری با یه مبتدی کار می‌کنی. مفاهیم رو ساده توضیح بده، از مثال‌های عملی استفاده کن، و هر بار فقط یکی دو تا نکته بگو. لحن‌ت گرم و انگیزشی باشه.',
      intermediate: 'تو یه مربی بوکس باتجربه هستی. شاگردت اصول اولیه رو بلده. روی تکنیک‌ها، ترکیبات ضربات، و استراتژی مبارزه کار کنید. جزئیات فنی بده ولی قابل فهم.',
      advanced: 'تو یه مربی بوکس المپیکی هستی. شاگردت حرفه‌ایه. روی ریزه‌کاری‌های تکنیکی، تاکتیک‌های پیشرفته، تحلیل حریف، و آمادگی ذهنی تمرکز کن.',
      fitness: 'تو یه مربی بوکس فانکشنال هستی. هدف شاگردت تناسب اندام و کاهش چربی‌ه نه مسابقه. تمرینات پرفشار، کالیستنیکس بوکسی، و تمرینات طناب رو پیشنهاد بده.'
    },
    en: {
      beginner: 'You are a professional and patient boxing coach. Your student is a complete beginner. Explain concepts simply, use practical examples, and only cover 1-2 tips at a time. Keep your tone warm and motivating.',
      intermediate: 'You are an experienced boxing coach. Your student knows the basics. Focus on technique refinement, punch combinations, and fight strategy. Give technical details but keep them accessible.',
      advanced: 'You are an Olympic-level boxing coach. Your student is a professional. Focus on subtle technical details, advanced tactics, opponent analysis, and mental preparation.',
      fitness: 'You are a functional boxing fitness coach. Your client wants fitness and fat loss, not competition. Suggest high-intensity workouts, boxing calisthenics, and rope exercises.'
    }
  };

  return paths[state.lang][state.path] || paths.fa.beginner;
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  applyLanguage();
  generateSessionId();
  setupEventListeners();
  updateStats();
});

function generateSessionId() {
  state.sessionId = 'S' + Date.now().toString(36).toUpperCase();
  document.getElementById('sessionId').textContent = state.sessionId.slice(0, 6);
}

// ===== STORAGE =====
function saveToStorage() {
  localStorage.setItem('boxingCoach_state', JSON.stringify({
    lang: state.lang,
    model: state.model,
    apiKey: state.apiKey,
    path: state.path,
  }));
}

function loadFromStorage() {
  const saved = localStorage.getItem('boxingCoach_state');
  if (saved) {
    const s = JSON.parse(saved);
    state.lang = s.lang || 'fa';
    state.model = s.model || 'gpt-4o-mini';
    state.apiKey = s.apiKey || '';
    state.path = s.path || 'beginner';

    // Populate settings
    document.getElementById('apiKeyInput').value = state.apiKey;
    document.getElementById('modelSelect').value = state.model;
    document.getElementById('langSelect').value = state.lang;
  }
}

// ===== LANGUAGE =====
function applyLanguage() {
  const isFa = state.lang === 'fa';
  document.documentElement.lang = state.lang;
  document.documentElement.dir = isFa ? 'rtl' : 'ltr';

  // Update all translatable elements
  document.querySelectorAll('[data-fa]').forEach(el => {
    const text = el.getAttribute(`data-${state.lang}`);
    if (text) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = text;
      } else {
        el.textContent = text;
      }
    }
  });

  // Update input placeholder specifically
  const input = document.getElementById('userInput');
  input.placeholder = input.getAttribute(`data-placeholder-${state.lang}`) || input.placeholder;

  saveToStorage();
}

function toggleLanguage() {
  state.lang = state.lang === 'fa' ? 'en' : 'fa';
  applyLanguage();
  updateQuickActions();
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
  // Send
  document.getElementById('sendBtn').addEventListener('click', sendMessage);
  document.getElementById('userInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Auto-resize textarea
  document.getElementById('userInput').addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 150) + 'px';
  });

  // Language toggle
  document.getElementById('langToggle').addEventListener('click', toggleLanguage);

  // Clear chat
  document.getElementById('clearChat').addEventListener('click', clearChat);

  // Settings
  document.getElementById('settingsBtn').addEventListener('click', () => {
    document.getElementById('settingsModal').classList.add('active');
  });
  document.getElementById('closeSettings').addEventListener('click', () => {
    document.getElementById('settingsModal').classList.remove('active');
  });
  document.getElementById('saveSettings').addEventListener('click', saveSettings);
  document.getElementById('settingsModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      document.getElementById('settingsModal').classList.remove('active');
    }
  });

  // Training paths
  document.querySelectorAll('.path-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.path-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.path = btn.dataset.path;
      saveToStorage();
      addSystemMessage(`🔄 ${state.lang === 'fa' ? 'مسیر تغییر کرد به' : 'Switched path to'}: ${btn.querySelector('.path-name').textContent}`);
    });
  });

  // Topic buttons
  document.querySelectorAll('.topic-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const prompts = {
        'jab-cross': state.lang === 'fa' ? 'جَب و کراس رو کامل توضیح بده' : 'Explain jab and cross in detail',
        'footwork': state.lang === 'fa' ? 'فوت‌ورک بوکس چیه و چطور یاد بگیرم؟' : 'What is boxing footwork and how do I learn it?',
        'defense': state.lang === 'fa' ? 'راه‌های دفاع در بوکس رو بگو' : 'Tell me about boxing defense techniques',
        'conditioning': state.lang === 'fa' ? 'تمرینات استقامتی بوکس رو بگو' : 'Tell me about boxing conditioning exercises',
        'combination': state.lang === 'fa' ? 'یه کمبینیشن سه ضربه‌ای یادم بده' : 'Teach me a 3-punch combination',
        'weight-loss': state.lang === 'fa' ? 'تمرین بوکس برای کاهش وزن' : 'Boxing training for weight loss'
      };
      document.getElementById('userInput').value = prompts[btn.dataset.topic] || btn.textContent;
      sendMessage();
    });
  });

  // Quick action buttons
  document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.prompt;
      document.getElementById('userInput').value = key;
      sendMessage();
    });
  });

  // Voice
  document.getElementById('voiceBtn').addEventListener('click', toggleVoice);
}

// ===== MESSAGING =====
async function sendMessage() {
  const input = document.getElementById('userInput');
  const text = input.value.trim();
  if (!text || state.isStreaming) return;

  // Check API key
  if (!state.apiKey) {
    document.getElementById('settingsModal').classList.add('active');
    showNotification(state.lang === 'fa' ? '⚠️ لطفاً اول کلید API رو تنظیم کن!' : '⚠️ Please set your API key first!');
    return;
  }

  // Add user message
  appendUserMessage(text);
  state.messages.push({ role: 'user', content: text });
  input.value = '';
  input.style.height = 'auto';
  updateStats();

  // Call AI
  state.isStreaming = true;
  updateSendButton();
  showTyping();

  try {
    const reply = await callAI(text);
    removeTyping();
    appendBotMessage(reply);
    state.messages.push({ role: 'assistant', content: reply });
  } catch (err) {
    removeTyping();
    appendErrorMessage(err.message);
  } finally {
    state.isStreaming = false;
    updateSendButton();
  }
}

async function callAI(userMessage) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${state.apiKey}`,
    },
    body: JSON.stringify({
      model: state.model,
      messages: [
        { role: 'system', content: getSystemPrompt() },
        ...state.messages.slice(-20) // Keep last 20 messages for context
      ],
      temperature: 0.8,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

// ===== UI HELPERS =====
function appendUserMessage(text) {
  const container = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'message user-message';
  div.innerHTML = `<div class="avatar">🥊</div><div class="bubble"><p>${escapeHtml(text)}</p></div>`;
  container.appendChild(div);
  scrollToBottom();
}

function appendBotMessage(text) {
  const container = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'message bot-message';
  div.innerHTML = `<div class="avatar">🤖</div><div class="bubble">${formatText(text)}</div>`;
  container.appendChild(div);
  scrollToBottom();
}

function showTyping() {
  const container = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'message bot-message';
  div.id = 'typingMsg';
  div.innerHTML = `<div class="avatar">🤖</div><div class="bubble"><div class="typing-indicator"><span></span><span></span><span></span></div></div>`;
  container.appendChild(div);
  scrollToBottom();
}

function removeTyping() {
  const el = document.getElementById('typingMsg');
  if (el) el.remove();
}

function appendErrorMessage(errText) {
  const container = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'message bot-message';
  div.innerHTML = `<div class="avatar">⚠️</div><div class="bubble" style="color:#ff6b6b"><p>${escapeHtml(errText)}</p><p style="font-size:0.8rem;color:#888">${state.lang === 'fa' ? 'برای ادامه از تنظیمات کلید API اضافه کنید.' : 'Add your API key in settings to continue.'}</p></div>`;
  container.appendChild(div);
  scrollToBottom();
}

function addSystemMessage(text) {
  const container = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.style.cssText = 'text-align:center;padding:8px;font-size:0.8rem;color:var(--text-muted);';
  div.textContent = text;
  container.appendChild(div);
  scrollToBottom();
}

function formatText(text) {
  // Basic markdown-like formatting
  let html = escapeHtml(text);
  // Bold: **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Code: `text`
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');
  // Line breaks
  html = html.replace(/\n/g, '<br>');
  return html;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function scrollToBottom() {
  const container = document.getElementById('chatMessages');
  container.scrollTop = container.scrollHeight;
}

function clearChat() {
  if (!confirm(state.lang === 'fa' ? 'همه پیام‌ها پاک بشن؟' : 'Clear all messages?')) return;
  state.messages = [];
  document.getElementById('chatMessages').innerHTML = '';
  // Add welcome message again
  const welcome = state.lang === 'fa'
    ? state.lang === 'fa' ? 'سلام! من مربی هوش مصنوعی بوکس تو هستم. 🤜 هر سوالی درباره بوکس داری بپرس!'
    : 'Hi! I\'m your AI Boxing Coach. 🤜 Ask me anything about boxing!'
    : welcome;
  addSystemMessage(welcome);
  updateStats();
}

function updateSendButton() {
  const btn = document.getElementById('sendBtn');
  btn.disabled = state.isStreaming;
}

function updateStats() {
  document.getElementById('msgCount').textContent = state.messages.length;
}

function showNotification(msg) {
  // Simple toast
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.cssText = `position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:10px 20px;border-radius:8px;font-size:0.85rem;z-index:999;animation:fadeIn 0.3s ease;`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ===== SETTINGS =====
function saveSettings() {
  state.apiKey = document.getElementById('apiKeyInput').value.trim();
  state.model = document.getElementById('modelSelect').value;
  state.lang = document.getElementById('langSelect').value;
  saveToStorage();
  applyLanguage();
  document.getElementById('settingsModal').classList.remove('active');
  showNotification(state.lang === 'fa' ? '✅ تنظیمات ذخیره شد!' : '✅ Settings saved!');
}

// ===== VOICE INPUT =====
let recognition = null;
function toggleVoice() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    showNotification(state.lang === 'fa' ? '🚫 مرورگرت پشتیبانی نمی‌کنه' : '🚫 Browser doesn\'t support speech');
    return;
  }

  const btn = document.getElementById('voiceBtn');
  if (recognition && recognition.active) {
    recognition.stop();
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = state.lang === 'fa' ? 'fa-IR' : 'en-US';
  recognition.interimResults = false;

  recognition.onstart = () => btn.classList.add('recording');
  recognition.onend = () => btn.classList.remove('recording');

  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    document.getElementById('userInput').value = transcript;
    document.getElementById('userInput').dispatchEvent(new Event('input'));
  };

  recognition.onerror = () => showNotification(state.lang === 'fa' ? '❌ خطا در تشخیص صدا' : '❌ Speech recognition error');
  recognition.start();
}

function updateQuickActions() {
  const quickActions = document.querySelectorAll('.quick-btn');
  // Could swap text based on language, but keeping simple for now
}
