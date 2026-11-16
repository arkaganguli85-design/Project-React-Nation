import './styles.css';
import { $, isTouch, motion, toast, clamp } from './modules/util.js';
import { STATUE_LINES } from './content.js';
import { runIntro } from './modules/intro.js';
import { initScroll } from './modules/scroll.js';
import { initCursor, initMagnetic, initTilt } from './modules/pointer.js';
import { initSections, heroIn } from './modules/sections.js';
import { initCases } from './modules/cases.js';
import { initLab } from './modules/lab.js';
import { initEnquiry } from './modules/enquiry.js';
import { initEasterEggs } from './modules/easter.js';

// Three.js is the heavy part: load it in parallel with the intro, never block first paint.
async function bootStatue() {
  const canvas = $('#statue');
  try {
    const { createStatue, hasWebGL } = await import('./statue/statue.js');
    if (!hasWebGL()) throw new Error('no webgl');
    const lowPower = isTouch || (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
    const statue = await createStatue(canvas, { reducedMotion: motion.reduced, lowPower });
    wireStatue(statue, canvas);
    return statue;
  } catch (err) {
    console.warn('Statue unavailable, showing fallback.', err);
    $('#statueFallback').hidden = false;
    canvas.hidden = true;
    return null;
  }
}

function wireStatue(statue, canvas) {
  const aim = (x, y) => {
    const r = canvas.getBoundingClientRect();
    statue.setPointer(clamp((x - (r.left + r.width / 2)) / (innerWidth * 0.5), -1, 1), clamp((y - (r.top + r.height * 0.3)) / (innerHeight * 0.5), -1, 1));
  };
  addEventListener('pointermove', (e) => aim(e.clientX, e.clientY), { passive: true });
  addEventListener('pointerdown', (e) => aim(e.clientX, e.clientY), { passive: true });

  // neon intensity rises over elements marked data-glow
  document.addEventListener('pointerover', (e) => { if (e.target.closest('[data-glow]')) statue.setGlow(2.1); });
  document.addEventListener('pointerout', (e) => { if (e.target.closest('[data-glow]')) statue.setGlow(1); });
  document.addEventListener('focusin', (e) => { if (e.target.closest('[data-glow]')) statue.setGlow(2.1); });
  document.addEventListener('focusout', () => statue.setGlow(1));

  document.addEventListener('hl:enquiry-sent', () => { statue.react(); toast('Sent. The statue approves.'); });

  let line = 0;
  $('#statueHit').addEventListener('click', () => {
    statue.react();
    toast(STATUE_LINES[line++ % STATUE_LINES.length]);
    $('#statueNote').style.opacity = 0;
  });
  window.__statue = statue;
}

async function start() {
  initScroll();
  initCursor();
  initMagnetic();
  initTilt();
  initCases();
  initSections();
  initLab();
  initEnquiry();

  const statuePromise = bootStatue();
  await runIntro();
  heroIn();
  const statue = await statuePromise;
  initEasterEggs(statue);
}
start();
