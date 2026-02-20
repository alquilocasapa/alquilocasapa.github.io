/* =====================================================
   HappyFamily – Canvas Chart Utilities
   ===================================================== */
'use strict';

const Charts = (() => {

  /* ── Donut Chart ─────────────────────────────────── */
  function donut(canvas, segments, opts = {}) {
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth || 200;
    const H = canvas.offsetHeight || 200;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const cx = W / 2, cy = H / 2;
    const R = Math.min(cx, cy) - 8;
    const r = R * 0.58;
    const total = segments.reduce((s, seg) => s + seg.value, 0);

    ctx.clearRect(0, 0, W, H);

    if (total === 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.arc(cx, cy, r, Math.PI * 2, 0, true);
      ctx.fillStyle = '#e8ecf4';
      ctx.fill();
      ctx.fillStyle = '#adb5c7';
      ctx.font = `bold ${Math.round(R * 0.35)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('N/A', cx, cy);
      return;
    }

    let angle = -Math.PI / 2;
    segments.forEach(seg => {
      if (!seg.value) return;
      const slice = (seg.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, angle, angle + slice);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();
      angle += slice;
    });

    // Inner hole
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = opts.bg || '#fff';
    ctx.fill();

    // Center label
    const pct = total ? Math.round(segments[0].value / total * 100) : 0;
    ctx.fillStyle = '#2d3748';
    ctx.font = `bold ${Math.round(R * 0.38)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${pct}%`, cx, cy - 8);
    ctx.font = `${Math.round(R * 0.2)}px sans-serif`;
    ctx.fillStyle = '#718096';
    ctx.fillText(segments[0].label || 'happy', cx, cy + R * 0.3);
  }

  /* ── Bar Chart (daily happy vs sad) ─────────────── */
  function bar(canvas, data, opts = {}) {
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth || 320;
    const H = canvas.offsetHeight || 160;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const pad = { top: 16, right: 12, bottom: 36, left: 28 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;
    const n = data.length;
    const maxVal = Math.max(...data.map(d => d.happy + d.sad), 1);
    const groupW = chartW / n;
    const barW = Math.min(groupW * 0.3, 18);

    ctx.clearRect(0, 0, W, H);

    // Gridlines
    ctx.strokeStyle = '#e8ecf4';
    ctx.lineWidth = 1;
    for (let g = 0; g <= 4; g++) {
      const y = pad.top + chartH - (g / 4) * chartH;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + chartW, y);
      ctx.stroke();
      if (g > 0) {
        const label = Math.round(maxVal * g / 4);
        ctx.fillStyle = '#a0aec0';
        ctx.font = `${Math.round(10 * dpr) / dpr}px sans-serif`;
        ctx.textAlign = 'right';
        ctx.fillText(label, pad.left - 4, y + 4);
      }
    }

    data.forEach((d, i) => {
      const x = pad.left + i * groupW + groupW / 2;
      const happyH = (d.happy / maxVal) * chartH;
      const sadH   = (d.sad   / maxVal) * chartH;

      // Happy bar
      ctx.fillStyle = opts.happyColor || '#48c774';
      const hx = x - barW - 2;
      const hy = pad.top + chartH - happyH;
      roundRect(ctx, hx, hy, barW, happyH, 3);
      ctx.fill();

      // Sad bar
      ctx.fillStyle = opts.sadColor || '#f14668';
      const sx = x + 2;
      const sy = pad.top + chartH - sadH;
      roundRect(ctx, sx, sy, barW, sadH, 3);
      ctx.fill();

      // X label
      ctx.fillStyle = '#718096';
      ctx.font = `${Math.round(9.5 * dpr) / dpr}px sans-serif`;
      ctx.textAlign = 'center';
      const label = d.label || shortDay(d.date);
      ctx.fillText(label, x, pad.top + chartH + 16);
    });

    // Legend
    const ly = H - 6;
    ctx.font = `${Math.round(9 * dpr) / dpr}px sans-serif`;
    ctx.textAlign = 'left';

    ctx.fillStyle = opts.happyColor || '#48c774';
    ctx.fillRect(pad.left, ly - 8, 10, 8);
    ctx.fillStyle = '#718096';
    ctx.fillText('Happy', pad.left + 13, ly);

    ctx.fillStyle = opts.sadColor || '#f14668';
    ctx.fillRect(pad.left + 54, ly - 8, 10, 8);
    ctx.fillStyle = '#718096';
    ctx.fillText('Sad', pad.left + 67, ly);
  }

  function roundRect(ctx, x, y, w, h, r) {
    if (h <= 0) return;
    r = Math.min(r, h / 2, w / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function shortDay(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
  }

  return { donut, bar };
})();
