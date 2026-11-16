import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { $, $$, motion, store } from './util.js';

gsap.registerPlugin(ScrollTrigger);

export let lenis = null;

// Smooth scroll with inertia only (never hijacks direction or speed beyond easing).
export function initScroll() {
  if (!motion.reduced) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // anchors
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href') === '#') return;
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    closeMenu();
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 });
    else target.scrollIntoView({ behavior: 'auto' });
    history.replaceState(null, '', a.getAttribute('href'));
  });

  // nav: solid after the hero starts, hides on scroll down, returns on scroll up
  const nav = $('#nav');
  let lastY = 0;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (self) => {
      const y = self.scroll();
      nav.classList.toggle('is-scrolled', y > 40);
      const down = y > lastY && y > 400;
      nav.classList.toggle('is-hidden', down && $('#menu').hidden);
      lastY = y;
    },
  });

  // active link per section
  $$('.nav__links a').forEach((link) => {
    const sec = document.querySelector(link.getAttribute('href'));
    if (!sec) return;
    ScrollTrigger.create({
      trigger: sec, start: 'top 55%', end: 'bottom 55%',
      onToggle: (s) => link.classList.toggle('is-active', s.isActive),
    });
  });

  // mobile menu
  const btn = $('#menuBtn'), menu = $('#menu');
  btn.addEventListener('click', () => (menu.hidden ? openMenu() : closeMenu()));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { closeMenu(); btn.focus(); } });
  function openMenu() { menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); btn.setAttribute('aria-label', 'Close menu'); lenis && lenis.stop(); document.body.style.overflow = 'hidden'; }
  function closeMenu() { if (menu.hidden) return; menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', 'Open menu'); lenis && lenis.start(); document.body.style.overflow = ''; }

  // motion toggle (persists for the session; reloads so every effect re-initialises cleanly)
  const toggle = $('#motionToggle'), label = $('#motionLabel');
  toggle.setAttribute('aria-pressed', String(motion.reduced));
  label.textContent = motion.reduced ? 'Motion off' : 'Motion on';
  toggle.addEventListener('click', () => {
    store.set('hl-motion', motion.reduced ? 'on' : 'off');
    location.reload();
  });

  $('#toTop').addEventListener('click', () => (lenis ? lenis.scrollTo(0, { duration: 1.6 }) : scrollTo(0, 0)));
}
