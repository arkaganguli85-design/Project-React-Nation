import { gsap } from 'gsap';
import { $, $$, isTouch, lerp, motion } from './util.js';

// Custom cursor: precise dot + trailing ring. Grows on interactive elements, shows contextual labels.
export function initCursor() {
  if (isTouch) return;
  const root = $('#cursor'), ring = $('.cursor__ring'), dot = $('.cursor__dot'), label = $('#cursorLabel');
  document.documentElement.classList.add('has-cursor');
  let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    x = e.clientX; y = e.clientY; root.classList.add('is-on');
    const t = e.target.closest ? e.target : document.body;
    const lab = t.closest('[data-cursor]');
    const link = t.closest('a, button, [tabindex], input, summary');
    root.classList.toggle('is-label', !!lab);
    root.classList.toggle('is-link', !!link && !lab);
    if (lab && label.textContent !== lab.dataset.cursor) label.textContent = lab.dataset.cursor;
  }, { passive: true });
  document.addEventListener('pointerleave', () => root.classList.remove('is-on'));
  addEventListener('pointerdown', () => root.classList.add('is-down'));
  addEventListener('pointerup', () => root.classList.remove('is-down'));
  gsap.ticker.add(() => {
    const k = motion.reduced ? 1 : 0.2;
    rx = lerp(rx, x, k); ry = lerp(ry, y, k);
    dot.style.transform = `translate(${x}px, ${y}px)`;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
  });
}

// Magnetic buttons: drift toward the cursor with spring-like motion, snap back on leave.
export function initMagnetic() {
  if (isTouch) return;
  $$('.magnetic').forEach((el) => {
    const qx = gsap.quickTo(el, 'x', { duration: 0.9, ease: 'elastic.out(1, 0.35)' });
    const qy = gsap.quickTo(el, 'y', { duration: 0.9, ease: 'elastic.out(1, 0.35)' });
    el.addEventListener('pointermove', (e) => {
      if (motion.reduced) return;
      const r = el.getBoundingClientRect();
      qx((e.clientX - (r.left + r.width / 2)) * 0.32);
      qy((e.clientY - (r.top + r.height / 2)) * 0.45);
    });
    el.addEventListener('pointerleave', () => { qx(0); qy(0); });
  });
}

// 3D tilt + moving highlight for the three Lab cards. Tap toggles the reveal on touch.
export function initTilt() {
  $$('.tilt').forEach((card) => {
    if (!isTouch) {
      card.addEventListener('pointermove', (e) => {
        if (motion.reduced) return;
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--ry', `${(px - 0.5) * 12}deg`);
        card.style.setProperty('--rx', `${(0.5 - py) * 10}deg`);
        card.style.setProperty('--mx', `${px * 100}%`);
        card.style.setProperty('--my', `${py * 100}%`);
      });
      card.addEventListener('pointerleave', () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
    } else {
      card.addEventListener('click', () => card.classList.toggle('is-open'));
    }
  });
}
