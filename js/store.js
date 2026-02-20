/* =====================================================
   HappyFamily – Data Store (localStorage)
   ===================================================== */
'use strict';

const Store = (() => {
  const KEYS = {
    KIDS:       'hf_kids',
    ACTIVITIES: 'hf_activities',
    TIMERS:     'hf_timers',
    REMINDERS:  'hf_reminders'
  };

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch { return []; }
  }

  function write(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // ── KIDS ──────────────────────────────────────────
  function getKids() { return read(KEYS.KIDS); }

  function saveKids(kids) { write(KEYS.KIDS, kids); }

  function addKid(data) {
    const kids = getKids();
    const kid = { id: uid(), createdAt: new Date().toISOString(), ...data };
    kids.push(kid);
    saveKids(kids);
    return kid;
  }

  function updateKid(id, data) {
    const kids = getKids();
    const i = kids.findIndex(k => k.id === id);
    if (i >= 0) kids[i] = { ...kids[i], ...data };
    saveKids(kids);
  }

  function deleteKid(id) {
    saveKids(getKids().filter(k => k.id !== id));
    saveActivities(getActivities().filter(a => a.kidId !== id));
    saveReminders(getReminders().filter(r => r.kidId !== id));
    saveTimers(getTimers().filter(t => t.kidId !== id));
  }

  // ── ACTIVITIES ────────────────────────────────────
  function getActivities() { return read(KEYS.ACTIVITIES); }

  function saveActivities(acts) { write(KEYS.ACTIVITIES, acts); }

  function getKidActivities(kidId) {
    return getActivities().filter(a => a.kidId === kidId);
  }

  function addActivity(data) {
    const acts = getActivities();
    const act = {
      id: uid(),
      completions: [],
      createdAt: new Date().toISOString(),
      ...data
    };
    acts.push(act);
    saveActivities(acts);
    return act;
  }

  function updateActivity(id, data) {
    const acts = getActivities();
    const i = acts.findIndex(a => a.id === id);
    if (i >= 0) acts[i] = { ...acts[i], ...data };
    saveActivities(acts);
  }

  function deleteActivity(id) {
    saveActivities(getActivities().filter(a => a.id !== id));
    saveTimers(getTimers().filter(t => t.activityId !== id));
  }

  function setCompletion(activityId, date, status) {
    const acts = getActivities();
    const i = acts.findIndex(a => a.id === activityId);
    if (i < 0) return;
    const comps = acts[i].completions || [];
    const ci = comps.findIndex(c => c.date === date);
    const entry = { date, status, completedAt: new Date().toISOString() };
    if (ci >= 0) comps[ci] = entry; else comps.push(entry);
    acts[i].completions = comps;
    saveActivities(acts);
  }

  // ── TIMERS ────────────────────────────────────────
  function getTimers() { return read(KEYS.TIMERS); }

  function saveTimers(timers) { write(KEYS.TIMERS, timers); }

  function addTimer(data) {
    const timers = getTimers();
    const timer = {
      id: uid(),
      running: false,
      startedAt: null,
      createdAt: new Date().toISOString(),
      ...data
    };
    timers.push(timer);
    saveTimers(timers);
    return timer;
  }

  function updateTimer(id, data) {
    const timers = getTimers();
    const i = timers.findIndex(t => t.id === id);
    if (i >= 0) timers[i] = { ...timers[i], ...data };
    saveTimers(timers);
  }

  function deleteTimer(id) {
    saveTimers(getTimers().filter(t => t.id !== id));
  }

  // ── REMINDERS ─────────────────────────────────────
  function getReminders() { return read(KEYS.REMINDERS); }

  function saveReminders(rems) { write(KEYS.REMINDERS, rems); }

  function addReminder(data) {
    const rems = getReminders();
    const rem = {
      id: uid(),
      enabled: true,
      lastTriggered: null,
      createdAt: new Date().toISOString(),
      ...data
    };
    rems.push(rem);
    saveReminders(rems);
    return rem;
  }

  function updateReminder(id, data) {
    const rems = getReminders();
    const i = rems.findIndex(r => r.id === id);
    if (i >= 0) rems[i] = { ...rems[i], ...data };
    saveReminders(rems);
  }

  function deleteReminder(id) {
    saveReminders(getReminders().filter(r => r.id !== id));
  }

  // ── PUBLIC API ────────────────────────────────────
  return {
    uid,
    // Kids
    getKids, saveKids, addKid, updateKid, deleteKid,
    // Activities
    getActivities, saveActivities, getKidActivities,
    addActivity, updateActivity, deleteActivity, setCompletion,
    // Timers
    getTimers, saveTimers, addTimer, updateTimer, deleteTimer,
    // Reminders
    getReminders, saveReminders, addReminder, updateReminder, deleteReminder
  };
})();
