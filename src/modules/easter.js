import { gsap } from 'gsap';
import { $, $$, motion, toast } from './util.js';

// Small, tasteful surprises. None of them block navigation.
export function initEasterEggs(statue) {
  // 1. triple-click the logo: the H does a spin
  let clicks = 0, timer;
  $('#logoLink').addEventListener('click', () => {
    clicks++; clearTimeout(timer); timer = setTimeout(() => (clicks = 0), 600);
    if (clicks === 3) {
      clicks = 0;
      if (!motion.reduced) gsap.fromTo('.nav .hmark', { rotate: 0 }, { rotate: 720, duration: 1.4, ease: 'expo.inOut' });
      toast('H is for Humor. Also for "Hello, you found it."');
    }
  });

  // 2. type "boring" anywhere: the highlight gets corrected
  let typed = '';
  addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea') || e.key.length !== 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-6);
    if (typed === 'boring') {
      const mark = $('mark.boring');
      if (!mark) return;
      const old = mark.innerHTML;
      mark.textContent = 'NEVER.';
      statue && statue.react();
      toast('We heard that word. We do not use it here.');
      setTimeout(() => (mark.innerHTML = old), 2600);
      typed = '';
    }
  });

  console.log('%cHUMOR LABS', 'background:#C6FF00;color:#0B0B0B;font:700 20px Space Grotesk,sans-serif;padding:6px 12px', '\nSerious About Growth. Never Boring.\nPoke the statue. Type "boring". Click around in The Lab.');
}
