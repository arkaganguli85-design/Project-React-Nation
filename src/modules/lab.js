import { $, $$, clamp, isTouch, motion, toast } from './util.js';

const COLORS = ['#C6FF00', '#F7F6EF', '#FF6A00'];
const TYPES = ['arc', 'spark', 'circle', 'square', 'cross', 'tri', 'ring'];

export function initLab() {
  const sec = $('#lab'), cv = $('#labCanvas'), ctx = cv.getContext('2d');
  const count = $('#labCount');
  let W = 0, H = 0, dpr = 1, shapes = [], spawned = 0, raf = 0, visible = false;
  const ptr = { x: -999, y: -999, down: false, drag: null, lastX: 0, lastY: 0, vx: 0, vy: 0 };

  const rnd = (a, b) => a + Math.random() * (b - a);
  const make = (x, y, type, boost = 1) => {
    const size = rnd(26, 70) * (isTouch ? 0.8 : 1);
    return { x, y, vx: rnd(-1, 1) * boost, vy: rnd(-1, 1) * boost, r: rnd(0, 6.28), vr: rnd(-0.01, 0.01), size, type: type || TYPES[(Math.random() * TYPES.length) | 0], color: COLORS[(Math.random() * 3) | 0], outline: Math.random() < 0.3 };
  };
  const seed = () => {
    shapes = Array.from({ length: isTouch ? 14 : 24 }, () => make(rnd(0, W), rnd(0, H), null, 0.5));
    spawned = 0; count.textContent = '';
  };

  function resize() {
    const r = sec.getBoundingClientRect();
    W = r.width; H = r.height; dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!shapes.length) seed();
  }

  function path(s) {
    const z = s.size;
    ctx.beginPath();
    switch (s.type) {
      case 'arc': ctx.arc(0, -z * 0.2, z, 0.1 * Math.PI, 0.9 * Math.PI); ctx.lineWidth = z * 0.34; ctx.lineCap = 'butt'; ctx.stroke(); return true;
      case 'spark': ctx.moveTo(-z / 2, -z / 2); ctx.lineTo(z / 2, -z / 2); ctx.lineTo(z / 2, z / 2); ctx.lineTo(z / 2 - z * 0.26, z / 2); ctx.lineTo(z / 2 - z * 0.26, -z / 2 + z * 0.26); ctx.lineTo(-z / 2, -z / 2 + z * 0.26); ctx.closePath(); return false;
      case 'circle': ctx.arc(0, 0, z / 2, 0, 6.283); return false;
      case 'ring': ctx.arc(0, 0, z / 2, 0, 6.283); ctx.lineWidth = z * 0.2; ctx.stroke(); return true;
      case 'square': ctx.rect(-z / 2, -z / 2, z, z); return false;
      case 'tri': ctx.moveTo(0, -z / 2); ctx.lineTo(z / 2, z / 2); ctx.lineTo(-z / 2, z / 2); ctx.closePath(); return false;
      case 'cross': ctx.rect(-z / 2, -z * 0.12, z, z * 0.24); ctx.rect(-z * 0.12, -z / 2, z * 0.24, z); return false;
      case 'h': ctx.rect(-z * 0.5, -z * 0.5, z * 0.28, z); ctx.rect(z * 0.22, -z * 0.5, z * 0.28, z); ctx.rect(-z * 0.3, -z * 0.1, z * 0.6, z * 0.2); return false;
    }
    return false;
  }

  function step(dt) {
    const still = motion.reduced;
    for (const s of shapes) {
      if (s === ptr.drag) continue;
      // pointer: repel when near, attract while pressed
      const dx = s.x - ptr.x, dy = s.y - ptr.y, d2 = dx * dx + dy * dy, R = 190;
      if (d2 < R * R && d2 > 1) {
        const d = Math.sqrt(d2), f = (1 - d / R) * (ptr.down && !ptr.drag ? -0.9 : 0.55);
        s.vx += (dx / d) * f; s.vy += (dy / d) * f; s.vr += (dx / d) * f * 0.002;
      }
      s.vx *= 0.992; s.vy *= 0.992; s.vr *= 0.99;
      s.x += s.vx * dt * 60; s.y += s.vy * dt * 60; s.r += s.vr * dt * 60;
      const m = s.size * 0.5;
      if (s.x < m) { s.x = m; s.vx = Math.abs(s.vx); } else if (s.x > W - m) { s.x = W - m; s.vx = -Math.abs(s.vx); }
      if (s.y < m) { s.y = m; s.vy = Math.abs(s.vy); } else if (s.y > H - m) { s.y = H - m; s.vy = -Math.abs(s.vy); }
    }
    // soft collisions
    for (let i = 0; i < shapes.length; i++) for (let j = i + 1; j < shapes.length; j++) {
      const a = shapes[i], b = shapes[j];
      const dx = b.x - a.x, dy = b.y - a.y, min = (a.size + b.size) * 0.36, d2 = dx * dx + dy * dy;
      if (d2 < min * min && d2 > 0.01) {
        const d = Math.sqrt(d2), push = (min - d) * 0.02, nx = dx / d, ny = dy / d;
        a.vx -= nx * push; a.vy -= ny * push; b.vx += nx * push; b.vy += ny * push;
      }
    }
    if (still) shapes.forEach((s) => { s.vx = s.vy = s.vr = 0; });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const s of shapes) {
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.r);
      ctx.fillStyle = s.color; ctx.strokeStyle = s.color;
      if (s.outline && !['arc', 'ring'].includes(s.type)) {
        ctx.lineWidth = 3; path(s); ctx.stroke();
      } else {
        const wasStroke = path(s);
        if (!wasStroke) ctx.fill('nonzero');
      }
      ctx.restore();
    }
  }

  let last = performance.now();
  function loop(now) {
    raf = 0;
    if (!visible || document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    step(dt); draw();
    raf = requestAnimationFrame(loop);
  }
  const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } };

  new IntersectionObserver((e) => { visible = e[0].isIntersecting; if (visible) start(); }, { threshold: 0.05 }).observe(sec);
  document.addEventListener('visibilitychange', start);
  new ResizeObserver(() => { resize(); if (motion.reduced) draw(); }).observe(sec);
  resize();
  if (motion.reduced) draw();

  // pointer interaction on the canvas (UI above has pointer-events: none)
  const local = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const pick = (x, y) => [...shapes].reverse().find((s) => Math.hypot(s.x - x, s.y - y) < s.size * 0.6);
  sec.addEventListener('pointermove', (e) => {
    const [x, y] = local(e); ptr.vx = x - ptr.lastX; ptr.vy = y - ptr.lastY; ptr.lastX = ptr.x = x; ptr.lastY = ptr.y = y;
    if (ptr.drag) { ptr.drag.x = x; ptr.drag.y = y; ptr.drag.vx = ptr.vx * 0.5; ptr.drag.vy = ptr.vy * 0.5; }
    warp.move(e);
  });
  sec.addEventListener('pointerleave', () => { ptr.x = ptr.y = -999; ptr.drag = null; warp.leave(); });
  sec.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    const [x, y] = local(e); ptr.down = true;
    const hit = pick(x, y);
    if (hit) { ptr.drag = hit; hit.vx = hit.vy = 0; }
    else if (shapes.length < 70) {
      spawned++;
      const s = make(x, y, null, 3); shapes.push(s);
      if (spawned === 5) { shapes.push({ ...make(x, y, 'h', 2), size: 90, color: '#C6FF00', outline: false }); toast('You found the shape of a good idea.', 3200); }
      count.textContent = `${spawned} idea${spawned > 1 ? 's' : ''} made`;
    }
  });
  addEventListener('pointerup', () => {
    if (ptr.drag) { ptr.drag.vx = clamp(ptr.vx, -40, 40) * 0.9; ptr.drag.vy = clamp(ptr.vy, -40, 40) * 0.9; ptr.drag = null; }
    ptr.down = false;
  });
  $('#labShake').addEventListener('click', () => { shapes.forEach((s) => { s.vx += rnd(-14, 14); s.vy += rnd(-14, 14); s.vr += rnd(-0.12, 0.12); }); if (motion.reduced) { shapes.forEach((s) => { s.x = rnd(0, W); s.y = rnd(0, H); }); draw(); } });
  $('#labClear').addEventListener('click', () => { seed(); if (motion.reduced) draw(); });

  const warp = initWarp(sec);
}

// Headline letters swell, lighten and lean away from the pointer.
function initWarp(sec) {
  const el = $('[data-warp]');
  const text = el.textContent;
  el.textContent = '';
  const chars = [];
  text.split(' ').forEach((word, wi, arr) => {
    const w = document.createElement('span'); w.className = 'wd';
    [...word].forEach((c) => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c; w.append(s); chars.push({ el: s, v: 0, cx: 0, cy: 0 }); });
    el.append(w); if (wi < arr.length - 1) el.append(' ');
  });
  let px = -999, py = -999, raf = 0, active = false;
  const measure = () => chars.forEach((c) => { const r = c.el.getBoundingClientRect(); c.cx = r.left + r.width / 2 + scrollX; c.cy = r.top + r.height / 2 + scrollY; });
  const tick = () => {
    raf = 0; let moving = false;
    for (const c of chars) {
      const d = Math.hypot(c.cx - px, c.cy - py);
      const target = active && !motion.reduced ? Math.exp(-((d / 170) ** 2)) : 0;
      c.v += (target - c.v) * 0.14;
      if (Math.abs(target - c.v) > 0.002) moving = true;
      const v = c.v, dx = (c.cx - px), sign = dx === 0 ? 0 : dx / Math.abs(dx);
      c.el.style.transform = `translate(${sign * v * 14}px, ${-v * 12}px) scale(${1 + v * 0.22}) skewX(${-sign * v * 10}deg)`;
      c.el.style.fontVariationSettings = `'wght' ${Math.round(700 - v * 380)}`;
      c.el.style.color = v > 0.5 ? 'var(--lime)' : '';
    }
    if (moving) raf = requestAnimationFrame(tick);
  };
  return {
    move(e) { px = e.clientX + scrollX; py = e.clientY + scrollY; active = true; measure(); if (!raf) raf = requestAnimationFrame(tick); },
    leave() { active = false; if (!raf) raf = requestAnimationFrame(tick); },
  };
}
