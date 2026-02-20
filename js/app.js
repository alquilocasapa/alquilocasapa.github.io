/* =====================================================
   HappyFamily – Main Application
   Vanilla JS · Bulma CSS · localStorage PWA
   ===================================================== */
'use strict';

// ╔══════════════════════════════════════════════════════╗
// ║                    CONSTANTS                         ║
// ╚══════════════════════════════════════════════════════╝

const KID_COLORS = [
  '#FF6584','#6C63FF','#43D8C9','#FF9F43',
  '#48C774','#3298DC','#F97316','#8B5CF6'
];

const KID_EMOJIS = [
  '👦','👧','🧒','👶','🦊','🐻','🐼','🦁',
  '🐸','🦄','🐯','🐶','🐱','🐰','🐤','🦋'
];

const CATEGORIES = {
  homework:  { label: 'Homework',   icon: '📚', color: '#3298DC' },
  reading:   { label: 'Reading',    icon: '📖', color: '#48C774' },
  exercise:  { label: 'Exercise',   icon: '🏃', color: '#FF9F43' },
  chores:    { label: 'Chores',     icon: '🧹', color: '#FF6584' },
  music:     { label: 'Music',      icon: '🎵', color: '#9B59B6' },
  art:       { label: 'Art',        icon: '🎨', color: '#E74C3C' },
  nutrition: { label: 'Nutrition',  icon: '🥗', color: '#27AE60' },
  other:     { label: 'Other',      icon: '⭐', color: '#95A5A6' }
};

const RECURRENCES = [
  { value: 'daily',    label: 'Every Day' },
  { value: 'weekdays', label: 'Weekdays (Mon–Fri)' },
  { value: 'weekly',   label: 'Selected Days of Week' },
  { value: 'once',     label: 'One Time Only' }
];

const DAY_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const REWARDS = [
  { min: 50, emoji: '🚀', label: 'Superstar!',  desc: 'Out of this world! You\'re incredible!',      color: '#6C63FF' },
  { min: 30, emoji: '🥇', label: 'Champion!',   desc: 'True champion! Keep it up!',                  color: '#FFD700' },
  { min: 15, emoji: '🏆', label: 'Amazing!',    desc: 'Incredible work! You\'re on fire!',            color: '#C0C0C0' },
  { min:  7, emoji: '🌟', label: 'Great Job!',  desc: 'You\'re doing great! Almost there!',           color: '#FFA500' },
  { min:  3, emoji: '⭐', label: 'Good Start!', desc: 'Nice start! Keep completing activities!',      color: '#48C774' },
  { min:  1, emoji: '👍', label: 'Keep Going!', desc: 'Great first step! More activities await!',     color: '#3298DC' },
  { min:  0, emoji: '💪', label: 'Let\'s Go!',  desc: 'Complete activities to earn your reward!',     color: '#95A5A6' }
];

// ╔══════════════════════════════════════════════════════╗
// ║                    UTILITIES                         ║
// ╚══════════════════════════════════════════════════════╝

function formatDate(d) {
  const dt = d instanceof Date ? d : new Date(d);
  return [dt.getFullYear(),
    String(dt.getMonth()+1).padStart(2,'0'),
    String(dt.getDate()).padStart(2,'0')
  ].join('-');
}

function today() { return formatDate(new Date()); }

function fmtDisplay(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US',
    { month:'short', day:'numeric', year:'numeric' });
}

function fmtTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2,'0');
  const s = (secs % 60).toString().padStart(2,'0');
  return `${m}:${s}`;
}

function fmtTimeRange(act) {
  if (!act.beginTime && !act.endTime) return '';
  return act.beginTime + (act.endTime ? ' – ' + act.endTime : '');
}

function sortByTime(acts) {
  return [...acts].sort((a, b) => {
    const ta = a.beginTime || '';
    const tb = b.beginTime || '';
    if (!ta && !tb) return 0;
    if (!ta) return 1;   // untimed activities go to the bottom
    if (!tb) return -1;
    return ta.localeCompare(tb);
  });
}

function fmtShortDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US',
    { month:'short', day:'numeric' });
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function hexRgb(hex) {
  const v = parseInt(hex.replace('#',''), 16);
  return `${(v>>16)&255}, ${(v>>8)&255}, ${v&255}`;
}

function isActiveOn(act, dateStr) {
  if (dateStr < act.startDate) return false;
  if (act.endDate && dateStr > act.endDate) return false;
  const dow = new Date(dateStr + 'T12:00:00').getDay();
  switch (act.recurrence) {
    case 'once':     return dateStr === act.startDate;
    case 'daily':    return true;
    case 'weekdays': return dow >= 1 && dow <= 5;
    case 'weekly':   return (act.weekDays || []).includes(dow);
    default:         return true;
  }
}

function getStatus(act, dateStr) {
  const c = (act.completions || []).find(x => x.date === dateStr);
  return c ? c.status : 'pending';
}

function kidStats(kidId, daysBack = 7) {
  const acts = Store.getKidActivities(kidId);
  let happy = 0, sad = 0, pending = 0;
  const daily = [];
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = formatDate(d);
    let dh = 0, ds2 = 0;
    acts.forEach(a => {
      if (!isActiveOn(a, ds)) return;
      const st = getStatus(a, ds);
      if (st === 'happy') { happy++; dh++; }
      else if (st === 'sad') { sad++; ds2++; }
      else if (i === 0) pending++;
    });
    daily.push({ date: ds, happy: dh, sad: ds2 });
  }
  return { happy, sad, pending, daily };
}

function getReward(happyCount) {
  return REWARDS.find(r => happyCount >= r.min) || REWARDS[REWARDS.length - 1];
}

function kidById(id) {
  return Store.getKids().find(k => k.id === id);
}

// ╔══════════════════════════════════════════════════════╗
// ║                      ROUTER                          ║
// ╚══════════════════════════════════════════════════════╝

const Router = {
  routes: [],

  on(pattern, fn) {
    this.routes.push({ pattern, fn });
    return this;
  },

  navigate(path) {
    window.location.hash = '#' + path;
  },

  resolve() {
    const hash = decodeURIComponent(window.location.hash.slice(1) || '/');
    for (const { pattern, fn } of this.routes) {
      const keys = [];
      const re = new RegExp('^' + pattern.replace(/:([^/]+)/g, (_, k) => {
        keys.push(k); return '([^/]+)';
      }) + '/?$');
      const m = hash.match(re);
      if (m) {
        const params = {};
        keys.forEach((k, i) => params[k] = m[i + 1]);
        fn(params);
        return;
      }
    }
    // 404 fallback
    renderDashboard();
  },

  init() {
    window.addEventListener('hashchange', () => this.resolve());
    this.resolve();
  }
};

// ╔══════════════════════════════════════════════════════╗
// ║                    UI HELPERS                        ║
// ╚══════════════════════════════════════════════════════╝

const UI = {
  setContent(html) {
    document.getElementById('page-content').innerHTML = html;
    window.scrollTo(0, 0);
  },

  toast(msg, type = 'info', ms = 3200) {
    const root = document.getElementById('toast-root');
    const el = document.createElement('div');
    const icons = { success:'fa-check-circle', danger:'fa-exclamation-circle',
      warning:'fa-bell', info:'fa-info-circle' };
    el.className = `hf-toast hf-toast-${type}`;
    el.innerHTML = `<span class="icon"><i class="fas ${icons[type]||icons.info}"></i></span><span>${msg}</span>`;
    root.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 400);
    }, ms);
  },

  confirm(msg, title = 'Please confirm') {
    return new Promise(resolve => {
      const id = 'conf-' + Date.now();
      const el = document.createElement('div');
      el.className = 'modal is-active';
      el.innerHTML = `
        <div class="modal-background"></div>
        <div class="modal-card" style="max-width:420px">
          <header class="modal-card-head">
            <p class="modal-card-title">${esc(title)}</p>
          </header>
          <section class="modal-card-body">
            <p>${esc(msg)}</p>
          </section>
          <footer class="modal-card-foot">
            <button class="button is-danger" id="${id}-ok">Yes, confirm</button>
            <button class="button" id="${id}-no">Cancel</button>
          </footer>
        </div>`;
      document.getElementById('modal-root').appendChild(el);
      el.querySelector(`#${id}-ok`).onclick = () => { el.remove(); resolve(true); };
      el.querySelector(`#${id}-no`).onclick = () => { el.remove(); resolve(false); };
      el.querySelector('.modal-background').onclick = () => { el.remove(); resolve(false); };
    });
  },

  modal(titleHtml, bodyHtml, footerHtml = '') {
    this.closeModal();
    const el = document.createElement('div');
    el.className = 'modal is-active';
    el.id = 'hf-modal';
    el.innerHTML = `
      <div class="modal-background"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">${titleHtml}</p>
          <button class="delete" id="modal-close" aria-label="close"></button>
        </header>
        <section class="modal-card-body">${bodyHtml}</section>
        ${footerHtml ? `<footer class="modal-card-foot">${footerHtml}</footer>` : ''}
      </div>`;
    document.getElementById('modal-root').appendChild(el);
    el.querySelector('.modal-background').onclick = () => this.closeModal();
    el.querySelector('#modal-close').onclick = () => this.closeModal();
    return el;
  },

  closeModal() {
    const m = document.getElementById('hf-modal');
    if (m) m.remove();
  },

  setActiveNav(route) {
    document.querySelectorAll('.hf-nav-link').forEach(a => {
      a.classList.toggle('is-active', a.dataset.route === route);
    });
  }
};

// ╔══════════════════════════════════════════════════════╗
// ║                   TIMER ENGINE                       ║
// ╚══════════════════════════════════════════════════════╝

const TimerEngine = {
  _iv: {},   // { id: intervalId }
  _remaining: {}, // { id: remainingSeconds }

  init() {
    // Restore running state on page load
    Store.getTimers().forEach(t => {
      if (t.running && t.startedAt) {
        const elapsed = Math.floor((Date.now() - t.startedAt) / 1000);
        const rem = Math.max(0, t.remaining - elapsed);
        this._remaining[t.id] = rem;
        if (rem > 0) {
          this._startInterval(t.id);
          Store.updateTimer(t.id, { remaining: rem, startedAt: Date.now() });
        } else {
          Store.updateTimer(t.id, { running: false, remaining: 0 });
          this._onComplete(t.id);
        }
      } else {
        this._remaining[t.id] = t.remaining;
      }
    });
  },

  start(id) {
    const timers = Store.getTimers();
    const t = timers.find(x => x.id === id);
    if (!t || t.remaining <= 0) return;
    if (this._iv[id]) return; // already running
    Store.updateTimer(id, { running: true, startedAt: Date.now() });
    this._remaining[id] = t.remaining;
    this._startInterval(id);
    this._updateDisplay(id);
  },

  _startInterval(id) {
    this._iv[id] = setInterval(() => this._tick(id), 1000);
  },

  pause(id) {
    clearInterval(this._iv[id]);
    delete this._iv[id];
    const rem = this._remaining[id] ?? 0;
    Store.updateTimer(id, { running: false, remaining: rem, startedAt: null });
    this._updateDisplay(id);
  },

  reset(id) {
    clearInterval(this._iv[id]);
    delete this._iv[id];
    const t = Store.getTimers().find(x => x.id === id);
    if (!t) return;
    this._remaining[id] = t.duration;
    Store.updateTimer(id, { running: false, remaining: t.duration, startedAt: null });
    this._updateDisplay(id);
    const card = document.querySelector(`[data-timer-id="${id}"]`);
    if (card) card.classList.remove('timer-done');
  },

  _tick(id) {
    this._remaining[id] = Math.max(0, (this._remaining[id] ?? 0) - 1);
    Store.updateTimer(id, { remaining: this._remaining[id] });
    this._updateDisplay(id);
    if (this._remaining[id] <= 0) {
      clearInterval(this._iv[id]);
      delete this._iv[id];
      Store.updateTimer(id, { running: false });
      this._onComplete(id);
    }
  },

  _onComplete(id) {
    AppAudio.playTimerEnd();
    UI.toast('⏰ Timer complete!', 'success', 5000);
    const card = document.querySelector(`[data-timer-id="${id}"]`);
    if (card) card.classList.add('timer-done');
    // Request notification
    if (Notification.permission === 'granted') {
      const t = Store.getTimers().find(x => x.id === id);
      new Notification('HappyFamily – Timer Done! ⏰', {
        body: t ? t.label : 'Timer finished!',
        icon: 'icons/icon.svg'
      });
    }
  },

  _updateDisplay(id) {
    const rem = this._remaining[id] ?? 0;
    const el = document.querySelector(`[data-timer-id="${id}"] .timer-countdown`);
    if (el) el.textContent = fmtTime(rem);

    const t = Store.getTimers().find(x => x.id === id);
    if (t) {
      const pct = t.duration > 0 ? ((t.duration - rem) / t.duration) * 100 : 0;
      const bar = document.querySelector(`[data-timer-id="${id}"] .timer-progress-fill`);
      if (bar) bar.style.width = pct + '%';
      const running = !!this._iv[id];
      const btnPlay  = document.querySelector(`[data-timer-id="${id}"] .btn-timer-play`);
      const btnPause = document.querySelector(`[data-timer-id="${id}"] .btn-timer-pause`);
      if (btnPlay)  btnPlay.classList.toggle('is-hidden', running || rem === 0);
      if (btnPause) btnPause.classList.toggle('is-hidden', !running);
    }
  },

  isRunning(id) { return !!this._iv[id]; },

  getRemaining(id) { return this._remaining[id] ?? 0; }
};

// ╔══════════════════════════════════════════════════════╗
// ║                  REMINDER ENGINE                     ║
// ╚══════════════════════════════════════════════════════╝

const ReminderEngine = {
  _iv: null,

  init() {
    this._iv = setInterval(() => this.check(), 30000);
    this.check();
  },

  check() {
    const now = new Date();
    const hhmm = now.toTimeString().slice(0, 5); // "HH:MM"
    const dateStr = formatDate(now);
    const dow = now.getDay();

    Store.getReminders().forEach(r => {
      if (!r.enabled) return;
      if (!this.shouldFire(r, dateStr, hhmm, dow)) return;
      // Debounce: don't fire twice in same minute
      if (r.lastTriggered) {
        const last = new Date(r.lastTriggered);
        const diffMin = (now - last) / 60000;
        if (diffMin < 1) return;
      }
      this.fire(r);
      Store.updateReminder(r.id, { lastTriggered: now.toISOString() });
    });
  },

  shouldFire(r, dateStr, hhmm, dow) {
    switch (r.type) {
      case 'once':
        return r.date === dateStr && r.time === hhmm;
      case 'daily':
        return r.time === hhmm;
      case 'weekly':
        return (r.weekDays || []).includes(dow) && r.time === hhmm;
      default:
        return false;
    }
  },

  fire(r) {
    const kid = kidById(r.kidId);
    const name = kid ? kid.name : 'Your kid';
    AppAudio.playReminder();
    UI.toast(`🔔 ${esc(r.title)} — ${esc(name)}`, 'warning', 7000);
    if (Notification.permission === 'granted') {
      new Notification(`HappyFamily 🔔 — ${name}`, {
        body: r.title,
        icon: 'icons/icon.svg'
      });
    }
  }
};

// ╔══════════════════════════════════════════════════════╗
// ║             PAGE: DASHBOARD                          ║
// ╚══════════════════════════════════════════════════════╝

function renderDashboard() {
  UI.setActiveNav('dashboard');
  const kids = Store.getKids();
  const td = today();

  if (kids.length === 0) {
    UI.setContent(`
      <div class="hf-empty-hero">
        <div class="hf-empty-inner">
          <div class="hf-empty-emoji">👨‍👩‍👧‍👦</div>
          <h1 class="title is-3">Welcome to HappyFamily!</h1>
          <p class="subtitle">Start tracking your kids' activities and celebrate every achievement.</p>
          <button class="button is-primary is-medium" data-action="open-kid-form">
            <span class="icon"><i class="fas fa-user-plus"></i></span>
            <span>Add Your First Kid</span>
          </button>
        </div>
      </div>`);
    return;
  }

  const cards = kids.map(k => kidDashboardCard(k, td)).join('');
  UI.setContent(`
    <div class="hf-page-hero">
      <div class="hf-hero-left">
        <h1 class="hf-hero-title">${greeting()} 👋</h1>
        <p class="hf-hero-sub">${fmtDisplay(td)} &nbsp;·&nbsp; ${kids.length} kid${kids.length !== 1 ? 's' : ''} tracked</p>
      </div>
      <div class="hf-hero-right">
        <button class="button is-white is-outlined" data-action="open-kid-form">
          <span class="icon"><i class="fas fa-user-plus"></i></span>
          <span>Add Kid</span>
        </button>
      </div>
    </div>
    <div class="hf-dashboard-grid">${cards}</div>
  `);
}

function kidDashboardCard(kid, td) {
  const acts   = Store.getKidActivities(kid.id);
  const todayA = sortByTime(acts.filter(a => isActiveOn(a, td)));
  const stats  = kidStats(kid.id, 7);
  const rate   = (stats.happy + stats.sad) > 0
    ? Math.round(stats.happy / (stats.happy + stats.sad) * 100) : 0;

  const actRows = todayA.length === 0
    ? `<div class="hf-no-acts">
        <i class="fas fa-clipboard-list"></i>
        <span>No activities today</span>
        <button class="button is-small is-primary is-light mt-2"
          data-action="open-activity-form" data-kid-id="${kid.id}">+ Add Activity</button>
       </div>`
    : todayA.map(a => {
        const st  = getStatus(a, td);
        const cat = CATEGORIES[a.category] || CATEGORIES.other;
        return `
        <div class="act-row act-row--${st}" data-activity-id="${a.id}">
          <span class="act-cat-icon" title="${cat.label}">${cat.icon}</span>
          <span class="act-title">${esc(a.title)}</span>
          ${fmtTimeRange(a) ? `<span class="act-time-badge">${fmtTimeRange(a)}</span>` : ''}
          ${a.hasTimer && a.timerId ? `
            <button class="button is-tiny is-light mr-1" data-action="quick-timer"
              data-timer-id="${a.timerId}" title="Open timer">⏱</button>` : ''}
          <div class="act-faces">
            <button class="face-btn ${st==='happy'?'face-active':''}"
              data-action="mark-status" data-aid="${a.id}" data-date="${td}" data-status="happy"
              title="Mark happy">😊</button>
            <button class="face-btn ${st==='sad'?'face-active':''}"
              data-action="mark-status" data-aid="${a.id}" data-date="${td}" data-status="sad"
              title="Mark sad">😢</button>
          </div>
        </div>`;
      }).join('');

  const happyPct = Math.min(rate, 100);
  return `
    <div class="kid-card" style="--kc:${kid.color};--kc-rgb:${hexRgb(kid.color)}">
      <div class="kid-card-head">
        <div class="kid-avatar" style="background:${kid.color}">${kid.emoji}</div>
        <div class="kid-meta">
          <h2 class="kid-name">${esc(kid.name)}</h2>
          <div class="kid-week-stats">
            <span class="ws-badge ws-happy"><span>😊</span> ${stats.happy}</span>
            <span class="ws-badge ws-sad"><span>😢</span> ${stats.sad}</span>
            <span class="ws-rate">${rate}% 7-day</span>
          </div>
        </div>
        <div class="kid-card-btns">
          <a href="#/summary/${kid.id}" class="button is-small is-light" title="Summary">
            <i class="fas fa-chart-pie"></i></a>
        </div>
      </div>
      <div class="kid-progress-bar">
        <div class="kid-progress-fill" style="width:${happyPct}%;background:${kid.color}"></div>
      </div>
      <div class="kid-acts-wrap">
        <div class="kid-acts-label">
          <i class="fas fa-sun"></i> Today
          <span class="acts-count">${todayA.length}</span>
        </div>
        <div class="kid-acts-list">${actRows}</div>
      </div>
      <div class="kid-card-foot">
        <button class="button is-small is-primary is-light"
          data-action="open-activity-form" data-kid-id="${kid.id}">
          <span class="icon"><i class="fas fa-plus"></i></span><span>Activity</span>
        </button>
        <a href="#/kids/${kid.id}" class="button is-small is-info is-light">
          <span class="icon"><i class="fas fa-eye"></i></span><span>View All</span>
        </a>
        <a href="#/reminders/${kid.id}" class="button is-small is-warning is-light">
          <span class="icon"><i class="fas fa-bell"></i></span><span>Remind</span>
        </a>
      </div>
    </div>`;
}

// ╔══════════════════════════════════════════════════════╗
// ║             PAGE: KIDS                               ║
// ╚══════════════════════════════════════════════════════╝

function renderKids() {
  UI.setActiveNav('kids');
  const kids = Store.getKids();

  const cards = kids.map(k => {
    const acts = Store.getKidActivities(k.id).length;
    return `
      <div class="box kid-list-card" style="border-left:5px solid ${k.color}">
        <div class="kid-list-inner">
          <div class="kid-avatar" style="background:${k.color}">${k.emoji}</div>
          <div class="kid-list-meta">
            <p class="kid-list-name">${esc(k.name)}</p>
            <p class="kid-list-sub">${acts} activit${acts !== 1 ? 'ies' : 'y'}</p>
          </div>
          <div class="kid-list-actions">
            <a href="#/kids/${k.id}" class="button is-small is-info is-light" title="View">
              <i class="fas fa-eye"></i></a>
            <button class="button is-small is-warning is-light" data-action="edit-kid"
              data-kid-id="${k.id}" title="Edit"><i class="fas fa-edit"></i></button>
            <button class="button is-small is-danger is-light" data-action="delete-kid"
              data-kid-id="${k.id}" title="Delete"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      </div>`;
  }).join('');

  UI.setContent(`
    <div class="hf-page-header">
      <h1 class="hf-page-title"><i class="fas fa-child"></i> Kids</h1>
      <button class="button is-primary" data-action="open-kid-form">
        <span class="icon"><i class="fas fa-plus"></i></span><span>Add Kid</span>
      </button>
    </div>
    ${kids.length === 0 ? `
      <div class="hf-empty">
        <div class="hf-empty-emoji">👧👦</div>
        <p>No kids yet. Add your first kid to get started!</p>
      </div>` : `<div class="hf-list">${cards}</div>`}
  `);
}

function renderKidDetail(kidId) {
  const kid = kidById(kidId);
  if (!kid) { Router.navigate('/kids'); return; }
  UI.setActiveNav('kids');

  const acts = sortByTime(Store.getKidActivities(kidId));
  const td   = today();
  const stats = kidStats(kidId, 30);

  const actRows = acts.map(a => activityRow(a, td, kid)).join('');
  UI.setContent(`
    <div class="hf-page-header" style="border-bottom:3px solid ${kid.color}">
      <a href="#/kids" class="button is-light mr-3"><i class="fas fa-arrow-left"></i></a>
      <div class="kid-detail-head">
        <div class="kid-avatar" style="background:${kid.color}">${kid.emoji}</div>
        <div>
          <h1 class="hf-page-title mb-0">${esc(kid.name)}</h1>
          <p class="has-text-grey is-size-7">30-day summary: 😊 ${stats.happy} &nbsp; 😢 ${stats.sad}</p>
        </div>
      </div>
      <button class="button is-primary ml-auto"
        data-action="open-activity-form" data-kid-id="${kidId}">
        <span class="icon"><i class="fas fa-plus"></i></span><span>Add Activity</span>
      </button>
    </div>
    <div class="hf-list mt-4">
      ${acts.length === 0 ? `<div class="hf-empty"><div class="hf-empty-emoji">📋</div>
        <p>No activities yet for ${esc(kid.name)}.</p></div>`
        : actRows}
    </div>
  `);
}

// ╔══════════════════════════════════════════════════════╗
// ║             PAGE: ACTIVITIES                         ║
// ╚══════════════════════════════════════════════════════╝

function renderActivities(filterKidId) {
  UI.setActiveNav('activities');
  const kids = Store.getKids();
  const td   = today();

  let acts = sortByTime(filterKidId
    ? Store.getKidActivities(filterKidId)
    : Store.getActivities());

  const kid = filterKidId ? kidById(filterKidId) : null;

  const kidOptions = kids.map(k =>
    `<option value="${k.id}" ${k.id === filterKidId ? 'selected' : ''}>${esc(k.name)}</option>`
  ).join('');

  const rows = acts.map(a => {
    const k = kidById(a.kidId);
    return activityRow(a, td, k);
  }).join('');

  UI.setContent(`
    <div class="hf-page-header">
      <h1 class="hf-page-title"><i class="fas fa-clipboard-list"></i> Activities</h1>
      <div class="is-flex is-align-items-center gap-2">
        <div class="select is-small">
          <select id="act-kid-filter">
            <option value="">All Kids</option>
            ${kidOptions}
          </select>
        </div>
        <button class="button is-primary is-small"
          data-action="open-activity-form"
          ${filterKidId ? `data-kid-id="${filterKidId}"` : ''}>
          <span class="icon"><i class="fas fa-plus"></i></span><span>Add</span>
        </button>
      </div>
    </div>
    ${kids.length === 0 ? `<div class="hf-empty"><p>Add a kid first before creating activities.</p></div>` :
      acts.length === 0 ? `<div class="hf-empty"><div class="hf-empty-emoji">📋</div><p>No activities yet.</p></div>` :
      `<div class="hf-list">${rows}</div>`}
  `);

  const sel = document.getElementById('act-kid-filter');
  if (sel) sel.onchange = () => {
    const v = sel.value;
    Router.navigate(v ? `/activities/${v}` : '/activities');
  };
}

function activityRow(act, td, kid) {
  const cat    = CATEGORIES[act.category] || CATEGORIES.other;
  const status = getStatus(act, td);
  const rec    = RECURRENCES.find(r => r.value === act.recurrence);
  const kColor = kid ? kid.color : '#95A5A6';
  const kEmoji = kid ? kid.emoji : '👤';

  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = formatDate(d);
    if (!isActiveOn(act, ds)) { last7.push('<span class="dot dot-off">·</span>'); continue; }
    const s = getStatus(act, ds);
    last7.push(s === 'happy' ? '<span class="dot dot-happy">😊</span>'
      : s === 'sad' ? '<span class="dot dot-sad">😢</span>'
      : '<span class="dot dot-pending">○</span>');
  }

  return `
    <div class="box act-card act-card--${status}" style="border-left:4px solid ${cat.color}">
      <div class="act-card-head">
        <span class="act-big-icon">${cat.icon}</span>
        <div class="act-card-meta">
          <div class="act-card-title-row">
            <strong>${esc(act.title)}</strong>
            ${kid ? `<span class="kid-chip" style="background:${kColor}20;color:${kColor}">
              ${kEmoji} ${esc(kid.name)}</span>` : ''}
          </div>
          <div class="act-card-details">
            <span title="Dates"><i class="fas fa-calendar-alt"></i>
              ${fmtShortDate(act.startDate)}${act.endDate && act.endDate !== act.startDate
                ? ' → ' + fmtShortDate(act.endDate) : ''}</span>
            ${fmtTimeRange(act) ? `<span title="Activity time"><i class="fas fa-clock"></i>
              ${fmtTimeRange(act)}</span>` : ''}
            <span title="Recurrence"><i class="fas fa-redo"></i> ${rec ? rec.label : act.recurrence}</span>
            ${act.hasTimer ? `<span title="Has timer"><i class="fas fa-stopwatch"></i>
              ${fmtTime(act.timerDuration || 0)}</span>` : ''}
          </div>
          ${act.description ? `<p class="act-desc">${esc(act.description)}</p>` : ''}
        </div>
        <div class="act-card-actions">
          <div class="act-faces">
            <button class="face-btn ${status==='happy'?'face-active':''}"
              data-action="mark-status" data-aid="${act.id}" data-date="${td}" data-status="happy"
              title="Mark happy">😊</button>
            <button class="face-btn ${status==='sad'?'face-active':''}"
              data-action="mark-status" data-aid="${act.id}" data-date="${td}" data-status="sad"
              title="Mark sad">😢</button>
          </div>
          <div class="act-mgmt-btns">
            <button class="button is-small is-warning is-light" data-action="edit-activity"
              data-act-id="${act.id}" title="Edit"><i class="fas fa-edit"></i></button>
            <button class="button is-small is-danger is-light" data-action="delete-activity"
              data-act-id="${act.id}" title="Delete"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      </div>
      <div class="act-history">
        <span class="act-history-label">7-day:</span>
        ${last7.join('')}
      </div>
    </div>`;
}

// ╔══════════════════════════════════════════════════════╗
// ║             PAGE: TIMERS                             ║
// ╚══════════════════════════════════════════════════════╝

function renderTimers() {
  UI.setActiveNav('timer');
  const timers = Store.getTimers();
  const kids   = Store.getKids();

  const cards = timers.map(t => {
    const kid = kidById(t.kidId);
    const rem = TimerEngine.getRemaining(t.id);
    const running = TimerEngine.isRunning(t.id);
    const pct = t.duration > 0 ? ((t.duration - rem) / t.duration) * 100 : 0;
    const done = rem === 0;
    return `
      <div class="box timer-card ${done ? 'timer-done' : ''}" data-timer-id="${t.id}">
        <div class="timer-card-head">
          ${kid ? `<div class="kid-avatar-sm" style="background:${kid.color}">${kid.emoji}</div>` : ''}
          <div class="timer-meta">
            <strong>${esc(t.label)}</strong>
            ${kid ? `<small>${esc(kid.name)}</small>` : ''}
          </div>
          <div class="timer-card-actions">
            <button class="button is-small is-danger is-light" data-action="delete-timer"
              data-timer-id="${t.id}" title="Delete"><i class="fas fa-trash"></i></button>
          </div>
        </div>
        <div class="timer-display">
          <div class="timer-countdown ${done ? 'done' : ''}">${fmtTime(rem)}</div>
          <div class="timer-total">/ ${fmtTime(t.duration)}</div>
        </div>
        <div class="timer-progress">
          <div class="timer-progress-fill ${done ? 'done' : ''}" style="width:${pct}%"></div>
        </div>
        <div class="timer-controls">
          <button class="button is-success btn-timer-play ${(running||done)?'is-hidden':''}"
            data-action="timer-start" data-timer-id="${t.id}">
            <span class="icon"><i class="fas fa-play"></i></span><span>Start</span>
          </button>
          <button class="button is-warning btn-timer-pause ${running?'':'is-hidden'}"
            data-action="timer-pause" data-timer-id="${t.id}">
            <span class="icon"><i class="fas fa-pause"></i></span><span>Pause</span>
          </button>
          <button class="button is-light" data-action="timer-reset" data-timer-id="${t.id}">
            <span class="icon"><i class="fas fa-redo"></i></span><span>Reset</span>
          </button>
        </div>
        ${done ? `<div class="timer-done-banner">🎉 Time's up!</div>` : ''}
      </div>`;
  }).join('');

  UI.setContent(`
    <div class="hf-page-header">
      <h1 class="hf-page-title"><i class="fas fa-stopwatch"></i> Timers</h1>
      <button class="button is-primary" data-action="open-timer-form">
        <span class="icon"><i class="fas fa-plus"></i></span><span>New Timer</span>
      </button>
    </div>
    ${timers.length === 0 ? `
      <div class="hf-empty">
        <div class="hf-empty-emoji">⏱️</div>
        <p>No timers yet. Add a timer for a task that needs tracking!</p>
      </div>` : `<div class="hf-timer-grid">${cards}</div>`}
  `);
}

// ╔══════════════════════════════════════════════════════╗
// ║             PAGE: REMINDERS                          ║
// ╚══════════════════════════════════════════════════════╝

function renderReminders(filterKidId) {
  UI.setActiveNav('reminders');
  const kids = Store.getKids();
  const rems = filterKidId
    ? Store.getReminders().filter(r => r.kidId === filterKidId)
    : Store.getReminders();

  const kidOptions = kids.map(k =>
    `<option value="${k.id}" ${k.id === filterKidId ? 'selected' : ''}>${esc(k.name)}</option>`
  ).join('');

  const rows = rems.map(r => {
    const kid = kidById(r.kidId);
    const kColor = kid ? kid.color : '#95A5A6';
    const typeLabel = r.type === 'once' ? 'One Time'
      : r.type === 'daily' ? 'Daily'
      : r.type === 'weekly' ? `Weekly (${(r.weekDays||[]).map(d=>DAY_SHORT[d]).join(', ')})`
      : r.type;
    const timeLabel = r.type === 'once' ? `${r.date} at ${r.time}` : `at ${r.time}`;

    return `
      <div class="box rem-card ${r.enabled ? '' : 'rem-disabled'}">
        <div class="rem-card-inner">
          ${kid ? `<div class="kid-avatar-sm" style="background:${kColor}">${kid.emoji}</div>` : ''}
          <div class="rem-meta">
            <strong>${esc(r.title)}</strong>
            ${kid ? `<span class="kid-chip" style="background:${kColor}20;color:${kColor}">
              ${esc(kid.name)}</span>` : ''}
            <div class="rem-details">
              <span><i class="fas fa-repeat"></i> ${typeLabel}</span>
              <span><i class="fas fa-clock"></i> ${timeLabel}</span>
            </div>
          </div>
          <div class="rem-actions">
            <label class="switch" title="${r.enabled ? 'Enabled' : 'Disabled'}">
              <input type="checkbox" ${r.enabled ? 'checked' : ''}
                data-action="toggle-reminder" data-rem-id="${r.id}">
              <span class="switch-slider"></span>
            </label>
            <button class="button is-small is-warning is-light" data-action="edit-reminder"
              data-rem-id="${r.id}"><i class="fas fa-edit"></i></button>
            <button class="button is-small is-danger is-light" data-action="delete-reminder"
              data-rem-id="${r.id}"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      </div>`;
  }).join('');

  UI.setContent(`
    <div class="hf-page-header">
      <h1 class="hf-page-title"><i class="fas fa-bell"></i> Reminders</h1>
      <div class="is-flex is-align-items-center gap-2">
        <div class="select is-small">
          <select id="rem-kid-filter">
            <option value="">All Kids</option>
            ${kidOptions}
          </select>
        </div>
        <button class="button is-primary is-small"
          data-action="open-reminder-form"
          ${filterKidId ? `data-kid-id="${filterKidId}"` : ''}>
          <span class="icon"><i class="fas fa-plus"></i></span><span>Add</span>
        </button>
      </div>
    </div>
    <div class="hf-notif-banner" id="notif-banner" style="display:none">
      <div class="notification is-warning is-light">
        <i class="fas fa-bell"></i>
        Enable browser notifications for alerts even when the app is in the background.
        <button class="button is-small is-warning ml-3" id="btn-notif-perm">Enable Notifications</button>
      </div>
    </div>
    ${kids.length === 0 ? `<div class="hf-empty"><p>Add a kid first.</p></div>` :
      rems.length === 0 ? `<div class="hf-empty"><div class="hf-empty-emoji">🔔</div>
        <p>No reminders yet. Add reminders to help your kids stay on schedule!</p></div>` :
      `<div class="hf-list">${rows}</div>`}
  `);

  const sel = document.getElementById('rem-kid-filter');
  if (sel) sel.onchange = () => {
    const v = sel.value;
    Router.navigate(v ? `/reminders/${v}` : '/reminders');
  };

  // Notification permission banner
  if (Notification && Notification.permission === 'default') {
    const banner = document.getElementById('notif-banner');
    if (banner) banner.style.display = 'block';
    const btn = document.getElementById('btn-notif-perm');
    if (btn) btn.onclick = () => {
      Notification.requestPermission().then(p => {
        if (banner) banner.style.display = 'none';
        if (p === 'granted') UI.toast('Notifications enabled! 🔔', 'success');
      });
    };
  }
}

// ╔══════════════════════════════════════════════════════╗
// ║             PAGE: SUMMARY                            ║
// ╚══════════════════════════════════════════════════════╝

function renderSummary(filterKidId) {
  UI.setActiveNav('summary');
  const kids = Store.getKids();
  if (kids.length === 0) {
    UI.setContent(`<div class="hf-empty"><p>Add kids first to see their summary.</p></div>`);
    return;
  }

  const activeKid = filterKidId && kidById(filterKidId)
    ? filterKidId : kids[0].id;

  const kidTabs = kids.map(k => `
    <a href="#/summary/${k.id}" class="hf-kid-tab ${k.id === activeKid ? 'active' : ''}"
      style="${k.id === activeKid ? `background:${k.color};color:#fff;border-color:${k.color}` : ''}">
      <span>${k.emoji}</span> ${esc(k.name)}
    </a>`).join('');

  const kid   = kidById(activeKid);
  const stats = kidStats(activeKid, 30);
  const stats7 = kidStats(activeKid, 7);
  const total = stats.happy + stats.sad;
  const rate  = total > 0 ? Math.round(stats.happy / total * 100) : 0;
  const reward = getReward(stats.happy);
  const allActs = Store.getKidActivities(activeKid);
  const td = today();
  const todayPending = allActs.filter(a => isActiveOn(a, td) && getStatus(a, td) === 'pending').length;

  UI.setContent(`
    <div class="hf-page-header">
      <h1 class="hf-page-title"><i class="fas fa-chart-pie"></i> Summary</h1>
    </div>
    <div class="hf-kid-tabs">${kidTabs}</div>

    <div class="summary-grid">
      <!-- Stat cards -->
      <div class="stat-card stat-happy">
        <div class="stat-icon">😊</div>
        <div class="stat-val">${stats.happy}</div>
        <div class="stat-label">Happy (30d)</div>
      </div>
      <div class="stat-card stat-sad">
        <div class="stat-icon">😢</div>
        <div class="stat-val">${stats.sad}</div>
        <div class="stat-label">Sad (30d)</div>
      </div>
      <div class="stat-card stat-rate">
        <div class="stat-icon">📊</div>
        <div class="stat-val">${rate}%</div>
        <div class="stat-label">Happy Rate</div>
      </div>
      <div class="stat-card stat-pending">
        <div class="stat-icon">⏳</div>
        <div class="stat-val">${todayPending}</div>
        <div class="stat-label">Pending Today</div>
      </div>
    </div>

    <!-- Reward -->
    <div class="reward-card" style="border-color:${reward.color}">
      <div class="reward-emoji">${reward.emoji}</div>
      <div class="reward-info">
        <h3 class="reward-label" style="color:${reward.color}">${reward.label}</h3>
        <p class="reward-desc">${reward.desc}</p>
        <div class="reward-progress">
          ${REWARDS.slice().reverse().map((r, i, arr) => {
            const next = arr[i + 1];
            const reached = stats.happy >= r.min;
            return `<div class="rp-step ${reached ? 'rp-reached' : ''}" style="${reached ? `border-color:${r.color}` : ''}">
              <span>${r.emoji}</span>
              <small>${r.min}+</small>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>

    <!-- Charts -->
    <div class="charts-grid">
      <div class="chart-box">
        <h4 class="chart-title"><i class="fas fa-bar-chart"></i> Last 7 Days</h4>
        <canvas id="chart-bar" class="hf-chart-bar"></canvas>
        <div class="chart-legend">
          <span class="cl-dot" style="background:#48c774"></span> Happy
          &nbsp;&nbsp;
          <span class="cl-dot" style="background:#f14668"></span> Sad
        </div>
      </div>
      <div class="chart-box">
        <h4 class="chart-title"><i class="fas fa-circle-half-stroke"></i> Happy vs Sad (30d)</h4>
        <canvas id="chart-donut" class="hf-chart-donut"></canvas>
        <div class="chart-legend">
          <span class="cl-dot" style="background:#48c774"></span> Happy ${stats.happy}
          &nbsp;&nbsp;
          <span class="cl-dot" style="background:#f14668"></span> Sad ${stats.sad}
        </div>
      </div>
    </div>

    <!-- Recent activities table -->
    <div class="box mt-4">
      <h4 class="title is-5"><i class="fas fa-history"></i> Recent Activity Completions</h4>
      ${buildCompletionTable(activeKid)}
    </div>
  `);

  // Draw charts after DOM is ready
  requestAnimationFrame(() => {
    const barCanvas = document.getElementById('chart-bar');
    if (barCanvas) {
      Charts.bar(barCanvas, stats7.daily, { happyColor: '#48c774', sadColor: '#f14668' });
    }
    const donutCanvas = document.getElementById('chart-donut');
    if (donutCanvas) {
      Charts.donut(donutCanvas, [
        { value: stats.happy, color: '#48c774', label: 'happy' },
        { value: stats.sad,   color: '#f14668', label: 'sad'   }
      ]);
    }
  });
}

function buildCompletionTable(kidId) {
  const acts = Store.getKidActivities(kidId);
  const rows = [];
  const td = today();

  for (let i = 0; i < 14; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = formatDate(d);
    acts.forEach(a => {
      if (!isActiveOn(a, ds)) return;
      const st = getStatus(a, ds);
      if (st === 'pending' && ds !== td) return; // hide unset past days
      const cat = CATEGORIES[a.category] || CATEGORIES.other;
      rows.push({ date: ds, act: a, status: st, cat });
    });
  }

  if (rows.length === 0) return '<p class="has-text-grey">No completions recorded yet.</p>';

  return `<div class="table-container"><table class="table is-fullwidth is-striped is-hoverable">
    <thead><tr>
      <th>Date</th><th>Activity</th><th>Category</th><th>Status</th>
    </tr></thead>
    <tbody>
      ${rows.slice(0, 30).map(r => `<tr>
        <td>${fmtShortDate(r.date)}</td>
        <td>${esc(r.act.title)}</td>
        <td>${r.cat.icon} ${r.cat.label}</td>
        <td>${r.status === 'happy' ? '<span class="tag is-success">😊 Happy</span>'
          : r.status === 'sad' ? '<span class="tag is-danger">😢 Sad</span>'
          : '<span class="tag is-warning">⏳ Pending</span>'}</td>
      </tr>`).join('')}
    </tbody>
  </table></div>`;
}

// ╔══════════════════════════════════════════════════════╗
// ║             FORM: KID                                ║
// ╚══════════════════════════════════════════════════════╝

function openKidForm(kidId) {
  const kid = kidId ? Store.getKids().find(k => k.id === kidId) : null;
  const title = kid ? 'Edit Kid' : 'Add Kid';

  const colorBtns = KID_COLORS.map(c => `
    <button type="button" class="color-swatch ${kid && kid.color===c ? 'selected' : ''}"
      style="background:${c}" data-color="${c}" title="${c}"></button>`).join('');

  const emojiBtns = KID_EMOJIS.map(e => `
    <button type="button" class="emoji-btn ${kid && kid.emoji===e ? 'selected' : ''}"
      data-emoji="${e}">${e}</button>`).join('');

  const body = `
    <form id="kid-form">
      <div class="field">
        <label class="label">Name <span class="has-text-danger">*</span></label>
        <div class="control has-icons-left">
          <input class="input" type="text" id="kid-name" placeholder="Child's name"
            value="${esc(kid?.name || '')}" required maxlength="40" />
          <span class="icon is-left"><i class="fas fa-user"></i></span>
        </div>
      </div>
      <div class="field">
        <label class="label">Avatar Emoji</label>
        <div class="emoji-grid">${emojiBtns}</div>
        <input type="hidden" id="kid-emoji" value="${kid?.emoji || KID_EMOJIS[0]}" />
      </div>
      <div class="field">
        <label class="label">Color</label>
        <div class="color-grid">${colorBtns}</div>
        <input type="hidden" id="kid-color" value="${kid?.color || KID_COLORS[0]}" />
      </div>
      <p class="form-preview">
        Preview: <span id="kid-preview-avatar" class="kid-avatar-preview"
          style="background:${kid?.color||KID_COLORS[0]}">${kid?.emoji||KID_EMOJIS[0]}</span>
        <strong id="kid-preview-name">${esc(kid?.name||'Name')}</strong>
      </p>
    </form>`;

  const footer = `
    <button class="button is-primary" id="kid-save-btn">
      <span class="icon"><i class="fas fa-save"></i></span><span>Save</span>
    </button>
    <button class="button" id="kid-cancel-btn">Cancel</button>`;

  UI.modal(title, body, footer);

  // Live preview
  const nameEl   = document.getElementById('kid-name');
  const emojiEl  = document.getElementById('kid-emoji');
  const colorEl  = document.getElementById('kid-color');
  const prevAvt  = document.getElementById('kid-preview-avatar');
  const prevName = document.getElementById('kid-preview-name');

  function updatePreview() {
    prevAvt.textContent = emojiEl.value;
    prevAvt.style.background = colorEl.value;
    prevName.textContent = nameEl.value || 'Name';
  }

  nameEl.addEventListener('input', updatePreview);

  document.querySelectorAll('.emoji-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      emojiEl.value = btn.dataset.emoji;
      updatePreview();
    };
  });

  document.querySelectorAll('.color-swatch').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      colorEl.value = btn.dataset.color;
      updatePreview();
    };
  });

  document.getElementById('kid-save-btn').onclick = () => {
    const name  = nameEl.value.trim();
    const emoji = emojiEl.value;
    const color = colorEl.value;
    if (!name) { UI.toast('Please enter a name', 'danger'); return; }
    if (kid) {
      Store.updateKid(kid.id, { name, emoji, color });
      UI.toast(`${emoji} ${name} updated!`, 'success');
    } else {
      Store.addKid({ name, emoji, color });
      AppAudio.playSuccess();
      UI.toast(`${emoji} ${name} added!`, 'success');
    }
    UI.closeModal();
    Router.resolve();
  };

  document.getElementById('kid-cancel-btn').onclick = () => UI.closeModal();
}

// ╔══════════════════════════════════════════════════════╗
// ║             FORM: ACTIVITY                           ║
// ╚══════════════════════════════════════════════════════╝

function openActivityForm(preKidId, actId) {
  const kids = Store.getKids();
  if (kids.length === 0) {
    UI.toast('Add a kid first!', 'warning'); return;
  }
  const act = actId ? Store.getActivities().find(a => a.id === actId) : null;
  const td  = today();

  const kidOpts = kids.map(k =>
    `<option value="${k.id}" ${(act?.kidId||preKidId)===k.id ? 'selected' : ''}>${esc(k.emoji+' '+k.name)}</option>`
  ).join('');

  const catOpts = Object.entries(CATEGORIES).map(([v, c]) =>
    `<option value="${v}" ${(act?.category||'homework')===v ? 'selected' : ''}>${c.icon} ${c.label}</option>`
  ).join('');

  const recOpts = RECURRENCES.map(r =>
    `<option value="${r.value}" ${(act?.recurrence||'daily')===r.value ? 'selected' : ''}>${r.label}</option>`
  ).join('');

  const wd = act?.weekDays || [1,3,5];
  const dayChecks = DAY_SHORT.map((d, i) =>
    `<label class="weekday-check">
      <input type="checkbox" class="wd-check" value="${i}" ${wd.includes(i)?'checked':''}> ${d}
    </label>`).join('');

  const durMin = act?.timerDuration ? Math.floor(act.timerDuration / 60) : 10;
  const durSec = act?.timerDuration ? act.timerDuration % 60 : 0;

  const body = `
    <form id="act-form">
      <div class="columns is-multiline">
        <div class="column is-12">
          <div class="field">
            <label class="label">Title <span class="has-text-danger">*</span></label>
            <div class="control has-icons-left">
              <input class="input" type="text" id="act-title"
                placeholder="e.g. Read for 20 minutes"
                value="${esc(act?.title||'')}" required maxlength="60" />
              <span class="icon is-left"><i class="fas fa-tasks"></i></span>
            </div>
          </div>
        </div>
        <div class="column is-6">
          <div class="field">
            <label class="label">Kid <span class="has-text-danger">*</span></label>
            <div class="control">
              <div class="select is-fullwidth"><select id="act-kid">${kidOpts}</select></div>
            </div>
          </div>
        </div>
        <div class="column is-6">
          <div class="field">
            <label class="label">Category</label>
            <div class="control">
              <div class="select is-fullwidth"><select id="act-cat">${catOpts}</select></div>
            </div>
          </div>
        </div>
        <div class="column is-6">
          <div class="field">
            <label class="label">Start Date <span class="has-text-danger">*</span></label>
            <div class="control">
              <input class="input" type="date" id="act-start"
                value="${act?.startDate||td}" required />
            </div>
          </div>
        </div>
        <div class="column is-6">
          <div class="field">
            <label class="label">End Date</label>
            <div class="control">
              <input class="input" type="date" id="act-end"
                value="${act?.endDate||''}" />
            </div>
            <p class="help">Leave empty for open-ended</p>
          </div>
        </div>
        <div class="column is-6">
          <div class="field">
            <label class="label">Begin Time</label>
            <div class="control has-icons-left">
              <input class="input" type="time" id="act-begin-time"
                value="${act?.beginTime||''}" />
              <span class="icon is-left"><i class="fas fa-clock"></i></span>
            </div>
            <p class="help">Optional – used for ordering</p>
          </div>
        </div>
        <div class="column is-6">
          <div class="field">
            <label class="label">End Time</label>
            <div class="control has-icons-left">
              <input class="input" type="time" id="act-end-time"
                value="${act?.endTime||''}" />
              <span class="icon is-left"><i class="fas fa-clock"></i></span>
            </div>
          </div>
        </div>
        <div class="column is-12">
          <div class="field">
            <label class="label">Recurrence</label>
            <div class="control">
              <div class="select is-fullwidth"><select id="act-rec">${recOpts}</select></div>
            </div>
          </div>
          <div id="act-weekdays-wrap" class="field ${(act?.recurrence||'daily')==='weekly'?'':'is-hidden'}">
            <label class="label">Days of Week</label>
            <div class="weekday-checks">${dayChecks}</div>
          </div>
        </div>
        <div class="column is-12">
          <div class="field">
            <label class="label">Description <span class="has-text-grey is-size-7">(optional)</span></label>
            <div class="control">
              <textarea class="textarea" id="act-desc" rows="2"
                placeholder="Additional notes...">${esc(act?.description||'')}</textarea>
            </div>
          </div>
        </div>
        <div class="column is-12">
          <div class="field">
            <label class="checkbox">
              <input type="checkbox" id="act-has-timer" ${act?.hasTimer?'checked':''}>
              &nbsp; Add a countdown timer for this activity
            </label>
          </div>
          <div id="act-timer-wrap" class="${act?.hasTimer?'':'is-hidden'}">
            <label class="label">Timer Duration</label>
            <div class="is-flex is-align-items-center gap-2">
              <input class="input" type="number" id="act-dur-min" min="0" max="180"
                value="${durMin}" style="width:80px" />
              <span>min</span>
              <input class="input" type="number" id="act-dur-sec" min="0" max="59"
                value="${durSec}" style="width:80px" />
              <span>sec</span>
            </div>
          </div>
        </div>
      </div>
    </form>`;

  const footer = `
    <button class="button is-primary" id="act-save-btn">
      <span class="icon"><i class="fas fa-save"></i></span><span>Save Activity</span>
    </button>
    <button class="button" id="act-cancel-btn">Cancel</button>`;

  UI.modal(act ? 'Edit Activity' : 'Add Activity', body, footer);

  // Recurrence toggle
  const recSel = document.getElementById('act-rec');
  const wdWrap = document.getElementById('act-weekdays-wrap');
  recSel.onchange = () => {
    wdWrap.classList.toggle('is-hidden', recSel.value !== 'weekly');
  };

  // Timer toggle
  const hasTimer = document.getElementById('act-has-timer');
  const timerWrap = document.getElementById('act-timer-wrap');
  hasTimer.onchange = () => timerWrap.classList.toggle('is-hidden', !hasTimer.checked);

  document.getElementById('act-save-btn').onclick = () => {
    const title     = document.getElementById('act-title').value.trim();
    const kidId     = document.getElementById('act-kid').value;
    const cat       = document.getElementById('act-cat').value;
    const start     = document.getElementById('act-start').value;
    const end       = document.getElementById('act-end').value;
    const beginTime = document.getElementById('act-begin-time').value;
    const endTime   = document.getElementById('act-end-time').value;
    const rec       = recSel.value;
    const desc      = document.getElementById('act-desc').value.trim();
    const htimer    = hasTimer.checked;
    const durMin    = parseInt(document.getElementById('act-dur-min').value) || 0;
    const durSec    = parseInt(document.getElementById('act-dur-sec').value) || 0;
    const dur       = durMin * 60 + durSec;

    if (!title) { UI.toast('Title is required', 'danger'); return; }
    if (!start) { UI.toast('Start date is required', 'danger'); return; }
    if (end && end < start) { UI.toast('End date must be after start date', 'danger'); return; }
    if (beginTime && endTime && endTime < beginTime) {
      UI.toast('End time must be after begin time', 'danger'); return;
    }
    if (htimer && dur <= 0) { UI.toast('Timer duration must be > 0', 'danger'); return; }

    const weekDays = rec === 'weekly'
      ? [...document.querySelectorAll('.wd-check:checked')].map(c => parseInt(c.value))
      : undefined;

    const data = {
      kidId, title, category: cat, startDate: start,
      endDate: end || null, beginTime: beginTime || null, endTime: endTime || null,
      recurrence: rec, description: desc,
      hasTimer: htimer, timerDuration: htimer ? dur : 0,
      weekDays: weekDays || []
    };

    if (act) {
      Store.updateActivity(act.id, data);
      UI.toast('Activity updated!', 'success');
    } else {
      const newAct = Store.addActivity(data);
      // Auto-create timer entry if needed
      if (htimer && dur > 0) {
        const kid = kidById(kidId);
        const timer = Store.addTimer({
          kidId, activityId: newAct.id,
          label: title + (kid ? ` — ${kid.name}` : ''),
          duration: dur, remaining: dur
        });
        TimerEngine._remaining[timer.id] = dur;
        Store.updateActivity(newAct.id, { timerId: timer.id });
      }
      AppAudio.playSuccess();
      UI.toast('Activity added!', 'success');
    }
    UI.closeModal();
    Router.resolve();
  };

  document.getElementById('act-cancel-btn').onclick = () => UI.closeModal();
}

// ╔══════════════════════════════════════════════════════╗
// ║             FORM: TIMER                              ║
// ╚══════════════════════════════════════════════════════╝

function openTimerForm(preKidId) {
  const kids = Store.getKids();
  if (kids.length === 0) { UI.toast('Add a kid first!', 'warning'); return; }

  const kidOpts = kids.map(k =>
    `<option value="${k.id}" ${k.id===preKidId?'selected':''}>${esc(k.emoji+' '+k.name)}</option>`
  ).join('');

  const body = `
    <form id="timer-form">
      <div class="field">
        <label class="label">Label <span class="has-text-danger">*</span></label>
        <div class="control has-icons-left">
          <input class="input" type="text" id="tmr-label"
            placeholder="e.g. Reading Time" required maxlength="50" />
          <span class="icon is-left"><i class="fas fa-tag"></i></span>
        </div>
      </div>
      <div class="field">
        <label class="label">Kid <span class="has-text-danger">*</span></label>
        <div class="control">
          <div class="select is-fullwidth"><select id="tmr-kid">${kidOpts}</select></div>
        </div>
      </div>
      <div class="field">
        <label class="label">Duration <span class="has-text-danger">*</span></label>
        <div class="is-flex is-align-items-center gap-2">
          <input class="input" type="number" id="tmr-min" min="0" max="180" value="10"
            style="width:90px" placeholder="min" />
          <span class="has-text-grey">min</span>
          <input class="input" type="number" id="tmr-sec" min="0" max="59" value="0"
            style="width:90px" placeholder="sec" />
          <span class="has-text-grey">sec</span>
        </div>
      </div>
    </form>`;

  const footer = `
    <button class="button is-primary" id="tmr-save-btn">
      <span class="icon"><i class="fas fa-plus"></i></span><span>Create Timer</span>
    </button>
    <button class="button" id="tmr-cancel-btn">Cancel</button>`;

  UI.modal('New Timer', body, footer);

  document.getElementById('tmr-save-btn').onclick = () => {
    const label = document.getElementById('tmr-label').value.trim();
    const kidId = document.getElementById('tmr-kid').value;
    const min   = parseInt(document.getElementById('tmr-min').value) || 0;
    const sec   = parseInt(document.getElementById('tmr-sec').value) || 0;
    const dur   = min * 60 + sec;

    if (!label) { UI.toast('Label is required', 'danger'); return; }
    if (dur <= 0) { UI.toast('Duration must be > 0', 'danger'); return; }

    const timer = Store.addTimer({ kidId, label, duration: dur, remaining: dur });
    TimerEngine._remaining[timer.id] = dur;
    AppAudio.playSuccess();
    UI.toast('Timer created!', 'success');
    UI.closeModal();
    Router.navigate('/timer');
  };

  document.getElementById('tmr-cancel-btn').onclick = () => UI.closeModal();
}

// ╔══════════════════════════════════════════════════════╗
// ║             FORM: REMINDER                           ║
// ╚══════════════════════════════════════════════════════╝

function openReminderForm(preKidId, remId) {
  const kids = Store.getKids();
  if (kids.length === 0) { UI.toast('Add a kid first!', 'warning'); return; }
  const rem = remId ? Store.getReminders().find(r => r.id === remId) : null;

  const kidOpts = kids.map(k =>
    `<option value="${k.id}" ${(rem?.kidId||preKidId)===k.id?'selected':''}>${esc(k.emoji+' '+k.name)}</option>`
  ).join('');

  const typeOpts = [
    { value:'daily',  label:'Daily' },
    { value:'weekly', label:'Weekly (selected days)' },
    { value:'once',   label:'One Time (specific date)' }
  ].map(t =>
    `<option value="${t.value}" ${(rem?.type||'daily')===t.value?'selected':''}>${t.label}</option>`
  ).join('');

  const wd = rem?.weekDays || [1,2,3,4,5];
  const dayChecks = DAY_SHORT.map((d, i) =>
    `<label class="weekday-check">
      <input type="checkbox" class="rem-wd-check" value="${i}" ${wd.includes(i)?'checked':''}> ${d}
    </label>`).join('');

  const td = today();
  const currentType = rem?.type || 'daily';

  const body = `
    <form id="rem-form">
      <div class="field">
        <label class="label">Title <span class="has-text-danger">*</span></label>
        <div class="control has-icons-left">
          <input class="input" type="text" id="rem-title"
            placeholder="e.g. Time for homework!" required maxlength="60"
            value="${esc(rem?.title||'')}" />
          <span class="icon is-left"><i class="fas fa-bell"></i></span>
        </div>
      </div>
      <div class="field">
        <label class="label">Kid <span class="has-text-danger">*</span></label>
        <div class="control">
          <div class="select is-fullwidth"><select id="rem-kid">${kidOpts}</select></div>
        </div>
      </div>
      <div class="field">
        <label class="label">Type</label>
        <div class="control">
          <div class="select is-fullwidth"><select id="rem-type">${typeOpts}</select></div>
        </div>
      </div>
      <div id="rem-time-wrap" class="field ${currentType!=='once'?'':'is-hidden'}">
        <label class="label">Time <span class="has-text-danger">*</span></label>
        <div class="control has-icons-left">
          <input class="input" type="time" id="rem-time" value="${rem?.time||'08:00'}" />
          <span class="icon is-left"><i class="fas fa-clock"></i></span>
        </div>
      </div>
      <div id="rem-weekdays-wrap" class="field ${currentType==='weekly'?'':'is-hidden'}">
        <label class="label">Days</label>
        <div class="weekday-checks">${dayChecks}</div>
      </div>
      <div id="rem-date-wrap" class="field ${currentType==='once'?'':'is-hidden'}">
        <label class="label">Date & Time <span class="has-text-danger">*</span></label>
        <div class="columns">
          <div class="column">
            <input class="input" type="date" id="rem-date" value="${rem?.date||td}" />
          </div>
          <div class="column">
            <input class="input" type="time" id="rem-time-once" value="${rem?.time||'08:00'}" />
          </div>
        </div>
      </div>
    </form>`;

  const footer = `
    <button class="button is-primary" id="rem-save-btn">
      <span class="icon"><i class="fas fa-save"></i></span><span>Save Reminder</span>
    </button>
    <button class="button" id="rem-cancel-btn">Cancel</button>`;

  UI.modal(rem ? 'Edit Reminder' : 'Add Reminder', body, footer);

  const typeSel = document.getElementById('rem-type');
  const timeWrap = document.getElementById('rem-time-wrap');
  const wdWrap   = document.getElementById('rem-weekdays-wrap');
  const dtWrap   = document.getElementById('rem-date-wrap');

  function updateTypeFields() {
    const t = typeSel.value;
    timeWrap.classList.toggle('is-hidden', t === 'once');
    wdWrap.classList.toggle('is-hidden', t !== 'weekly');
    dtWrap.classList.toggle('is-hidden', t !== 'once');
  }
  typeSel.onchange = updateTypeFields;

  document.getElementById('rem-save-btn').onclick = () => {
    const title = document.getElementById('rem-title').value.trim();
    const kidId = document.getElementById('rem-kid').value;
    const type  = typeSel.value;
    if (!title) { UI.toast('Title is required', 'danger'); return; }

    let date = null, time = null, weekDays = [];
    if (type === 'once') {
      date = document.getElementById('rem-date').value;
      time = document.getElementById('rem-time-once').value;
      if (!date || !time) { UI.toast('Date and time are required', 'danger'); return; }
    } else if (type === 'weekly') {
      time = document.getElementById('rem-time').value;
      weekDays = [...document.querySelectorAll('.rem-wd-check:checked')].map(c => parseInt(c.value));
      if (!weekDays.length) { UI.toast('Select at least one day', 'danger'); return; }
    } else {
      time = document.getElementById('rem-time').value;
    }

    const data = { kidId, title, type, date, time, weekDays, enabled: rem?.enabled ?? true };
    if (rem) {
      Store.updateReminder(rem.id, data);
      UI.toast('Reminder updated!', 'success');
    } else {
      Store.addReminder(data);
      AppAudio.playSuccess();
      UI.toast('Reminder added! 🔔', 'success');
    }
    UI.closeModal();
    Router.resolve();
  };

  document.getElementById('rem-cancel-btn').onclick = () => UI.closeModal();
}

// ╔══════════════════════════════════════════════════════╗
// ║             EVENT DELEGATION                         ║
// ╚══════════════════════════════════════════════════════╝

function setupDelegation() {
  const content = document.getElementById('page-content');

  content.addEventListener('click', async e => {
    // Button with data-action
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    switch (action) {

      // ── Kids ─────────────────────────────────────────
      case 'open-kid-form':
        openKidForm();
        break;

      case 'edit-kid':
        openKidForm(btn.dataset.kidId);
        break;

      case 'delete-kid': {
        const kid = kidById(btn.dataset.kidId);
        const ok = await UI.confirm(
          `Delete ${kid?.name}? All their activities and reminders will also be deleted.`,
          'Delete Kid'
        );
        if (!ok) break;
        Store.deleteKid(btn.dataset.kidId);
        AppAudio.playCancel();
        UI.toast('Kid deleted', 'danger');
        Router.resolve();
        break;
      }

      // ── Activities ────────────────────────────────────
      case 'open-activity-form':
        openActivityForm(btn.dataset.kidId);
        break;

      case 'edit-activity':
        openActivityForm(null, btn.dataset.actId);
        break;

      case 'delete-activity': {
        const ok = await UI.confirm('Delete this activity? Completion history will be lost.', 'Delete Activity');
        if (!ok) break;
        Store.deleteActivity(btn.dataset.actId);
        AppAudio.playCancel();
        UI.toast('Activity deleted', 'danger');
        Router.resolve();
        break;
      }

      case 'mark-status': {
        const aid    = btn.dataset.aid;
        const date   = btn.dataset.date;
        const status = btn.dataset.status;
        const act    = Store.getActivities().find(a => a.id === aid);
        const prev   = act ? getStatus(act, date) : 'pending';

        // Toggle off if clicking same status
        const newStatus = prev === status ? 'pending' : status;

        if (newStatus === 'pending') {
          // Remove the completion entry
          if (act) {
            act.completions = act.completions.filter(c => c.date !== date);
            Store.updateActivity(aid, { completions: act.completions });
          }
        } else {
          Store.setCompletion(aid, date, newStatus);
          if (newStatus === 'happy') AppAudio.playHappy();
          else AppAudio.playSad();
        }

        // Update UI without full re-render
        const row = btn.closest('.act-row, .act-card');
        if (row) {
          row.className = row.className.replace(/act-row--\w+|act-card--\w+/g, '').trim();
          if (row.classList.contains('act-row')) row.classList.add(`act-row--${newStatus}`);
          else row.classList.add(`act-card--${newStatus}`);
          row.querySelectorAll('.face-btn').forEach(fb => {
            fb.classList.toggle('face-active', fb.dataset.status === newStatus);
          });
        }
        break;
      }

      // ── Timers ────────────────────────────────────────
      case 'open-timer-form':
        openTimerForm(btn.dataset.kidId);
        break;

      case 'timer-start':
        TimerEngine.start(btn.dataset.timerId);
        break;

      case 'timer-pause':
        TimerEngine.pause(btn.dataset.timerId);
        break;

      case 'timer-reset':
        TimerEngine.reset(btn.dataset.timerId);
        break;

      case 'quick-timer':
        Router.navigate('/timer');
        break;

      case 'delete-timer': {
        const ok = await UI.confirm('Delete this timer?', 'Delete Timer');
        if (!ok) break;
        TimerEngine.pause(btn.dataset.timerId);
        delete TimerEngine._remaining[btn.dataset.timerId];
        Store.deleteTimer(btn.dataset.timerId);
        UI.toast('Timer deleted', 'danger');
        renderTimers();
        break;
      }

      // ── Reminders ─────────────────────────────────────
      case 'open-reminder-form':
        openReminderForm(btn.dataset.kidId);
        break;

      case 'edit-reminder':
        openReminderForm(null, btn.dataset.remId);
        break;

      case 'delete-reminder': {
        const ok = await UI.confirm('Delete this reminder?', 'Delete Reminder');
        if (!ok) break;
        Store.deleteReminder(btn.dataset.remId);
        UI.toast('Reminder deleted', 'danger');
        Router.resolve();
        break;
      }
    }
  });

  // Toggle reminders (checkbox)
  content.addEventListener('change', e => {
    const cb = e.target.closest('[data-action="toggle-reminder"]');
    if (!cb) return;
    Store.updateReminder(cb.dataset.remId, { enabled: cb.checked });
    UI.toast(cb.checked ? '🔔 Reminder enabled' : '🔕 Reminder disabled',
      cb.checked ? 'success' : 'warning');
    const card = cb.closest('.rem-card');
    if (card) card.classList.toggle('rem-disabled', !cb.checked);
  });
}

// ╔══════════════════════════════════════════════════════╗
// ║             NAVBAR BURGER                            ║
// ╚══════════════════════════════════════════════════════╝

function setupNavbar() {
  const burger = document.getElementById('nav-burger');
  const menu   = document.getElementById('nav-menu');
  burger.addEventListener('click', () => {
    burger.classList.toggle('is-active');
    menu.classList.toggle('is-active');
  });
  // Close menu on nav link click (mobile)
  menu.querySelectorAll('.hf-nav-link').forEach(a => {
    a.addEventListener('click', () => {
      burger.classList.remove('is-active');
      menu.classList.remove('is-active');
    });
  });
}

// ╔══════════════════════════════════════════════════════╗
// ║             SAMPLE DATA                              ║
// ╚══════════════════════════════════════════════════════╝

function seedSampleData() {
  if (Store.getKids().length > 0) return; // Already has data

  const emma = Store.addKid({ name: 'Emma', emoji: '👧', color: '#FF6584' });
  const jack = Store.addKid({ name: 'Jack', emoji: '👦', color: '#6C63FF' });

  const td = today();
  const d = (offset) => {
    const dt = new Date(); dt.setDate(dt.getDate() + offset);
    return formatDate(dt);
  };

  // Emma's activities
  Store.addActivity({
    kidId: emma.id, title: 'Read a Book', category: 'reading',
    startDate: d(-14), endDate: d(30), recurrence: 'daily', description: 'Read for 20 minutes',
    hasTimer: false, timerDuration: 0, weekDays: [], completions: [
      { date: d(-1), status: 'happy', completedAt: new Date().toISOString() },
      { date: d(-2), status: 'happy', completedAt: new Date().toISOString() },
      { date: d(-3), status: 'sad',   completedAt: new Date().toISOString() },
      { date: d(-4), status: 'happy', completedAt: new Date().toISOString() },
      { date: d(-5), status: 'happy', completedAt: new Date().toISOString() },
    ]
  });
  Store.addActivity({
    kidId: emma.id, title: 'Do Homework', category: 'homework',
    startDate: d(-14), endDate: d(30), recurrence: 'weekdays', description: '',
    hasTimer: true, timerDuration: 1800, weekDays: [], completions: [
      { date: d(-1), status: 'happy', completedAt: new Date().toISOString() },
      { date: d(-2), status: 'happy', completedAt: new Date().toISOString() },
      { date: d(-3), status: 'happy', completedAt: new Date().toISOString() },
    ]
  });
  Store.addActivity({
    kidId: emma.id, title: 'Tidy Bedroom', category: 'chores',
    startDate: d(-7), endDate: d(30), recurrence: 'weekly', weekDays: [1, 4],
    description: '', hasTimer: false, timerDuration: 0, completions: [
      { date: d(-3), status: 'happy', completedAt: new Date().toISOString() },
    ]
  });

  // Jack's activities
  Store.addActivity({
    kidId: jack.id, title: 'Morning Exercise', category: 'exercise',
    startDate: d(-14), endDate: d(30), recurrence: 'daily', description: '15 min workout',
    hasTimer: true, timerDuration: 900, weekDays: [], completions: [
      { date: d(-1), status: 'sad',   completedAt: new Date().toISOString() },
      { date: d(-2), status: 'happy', completedAt: new Date().toISOString() },
      { date: d(-3), status: 'happy', completedAt: new Date().toISOString() },
      { date: d(-4), status: 'sad',   completedAt: new Date().toISOString() },
      { date: d(-5), status: 'happy', completedAt: new Date().toISOString() },
    ]
  });
  Store.addActivity({
    kidId: jack.id, title: 'Practice Piano', category: 'music',
    startDate: d(-7), endDate: d(30), recurrence: 'weekly', weekDays: [2, 4, 6],
    description: '', hasTimer: false, timerDuration: 0, completions: [
      { date: d(-2), status: 'happy', completedAt: new Date().toISOString() },
    ]
  });
  Store.addActivity({
    kidId: jack.id, title: 'Eat Vegetables', category: 'nutrition',
    startDate: d(-14), endDate: d(30), recurrence: 'daily', description: '',
    hasTimer: false, timerDuration: 0, weekDays: [], completions: [
      { date: d(-1), status: 'happy', completedAt: new Date().toISOString() },
      { date: d(-2), status: 'happy', completedAt: new Date().toISOString() },
      { date: d(-3), status: 'sad',   completedAt: new Date().toISOString() },
    ]
  });

  // Reminders
  Store.addReminder({
    kidId: emma.id, title: 'Time for reading! 📚',
    type: 'daily', time: '19:00', date: null, weekDays: [], enabled: true
  });
  Store.addReminder({
    kidId: jack.id, title: 'Exercise time! 🏃',
    type: 'daily', time: '07:30', date: null, weekDays: [], enabled: true
  });

  // Sample timers
  const t1 = Store.addTimer({ kidId: emma.id, label: 'Homework — Emma', duration: 1800, remaining: 1800 });
  TimerEngine._remaining[t1.id] = 1800;
  const t2 = Store.addTimer({ kidId: jack.id, label: 'Exercise — Jack', duration: 900, remaining: 900 });
  TimerEngine._remaining[t2.id] = 900;
}

// ╔══════════════════════════════════════════════════════╗
// ║             ROUTER SETUP                             ║
// ╚══════════════════════════════════════════════════════╝

function setupRouter() {
  Router
    .on('/',                 () => renderDashboard())
    .on('/kids',             () => renderKids())
    .on('/kids/:id',         ({ id }) => renderKidDetail(id))
    .on('/activities',       () => renderActivities())
    .on('/activities/:kid',  ({ kid }) => renderActivities(kid))
    .on('/timer',            () => renderTimers())
    .on('/reminders',        () => renderReminders())
    .on('/reminders/:kid',   ({ kid }) => renderReminders(kid))
    .on('/summary',          () => renderSummary())
    .on('/summary/:kid',     ({ kid }) => renderSummary(kid));
}

// ╔══════════════════════════════════════════════════════╗
// ║             INITIALIZATION                           ║
// ╚══════════════════════════════════════════════════════╝

window.addEventListener('DOMContentLoaded', () => {
  setupNavbar();
  setupDelegation();
  setupRouter();
  TimerEngine.init();
  ReminderEngine.init();
  seedSampleData();
  Router.init();
});
