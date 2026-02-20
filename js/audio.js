/* =====================================================
   HappyFamily – Web Audio Utilities
   ===================================================== */
'use strict';

const AppAudio = (() => {
  let ctx = null;

  function getCtx() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch { return null; }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq = 440, dur = 0.3, type = 'sine', vol = 0.4, delay = 0) {
    const c = getCtx();
    if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.frequency.value = freq;
    osc.type = type;
    const start = c.currentTime + delay;
    gain.gain.setValueAtTime(vol, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  }

  // Happy jingle – ascending arpeggio
  function playHappy() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'sine', 0.4, i * 0.12));
  }

  // Sad descending tones
  function playSad() {
    [523, 440, 392, 349].forEach((f, i) => tone(f, 0.3, 'triangle', 0.35, i * 0.18));
  }

  // Timer end – 3 alert beeps
  function playTimerEnd() {
    for (let i = 0; i < 3; i++) {
      tone(880, 0.18, 'square', 0.3, i * 0.55);
      tone(1108, 0.18, 'square', 0.3, i * 0.55 + 0.22);
    }
  }

  // Reminder ping
  function playReminder() {
    tone(440, 0.1, 'sine', 0.4, 0);
    tone(554, 0.1, 'sine', 0.35, 0.15);
    tone(440, 0.15, 'sine', 0.3, 0.3);
  }

  // Save/confirm click
  function playSuccess() {
    tone(523, 0.12, 'sine', 0.3, 0);
    tone(659, 0.12, 'sine', 0.3, 0.1);
    tone(784, 0.2, 'sine', 0.3, 0.2);
  }

  // Delete/cancel click
  function playCancel() {
    tone(392, 0.15, 'sine', 0.25, 0);
    tone(349, 0.2,  'sine', 0.25, 0.12);
  }

  return { playHappy, playSad, playTimerEnd, playReminder, playSuccess, playCancel };
})();
