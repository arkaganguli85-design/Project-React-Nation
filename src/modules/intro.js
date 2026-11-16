import { gsap } from 'gsap';
import { $, motion, store } from './util.js';

// Short brand reveal: H assembles, arc draws, spark lands. Skippable at any time.
export function runIntro() {
  const el = $('#intro');
  const forced = new URLSearchParams(location.search).has('intro');
  if (!forced && store.get('hl-intro') === '1') {
    el.remove();
    document.body.classList.remove('is-intro');
    return Promise.resolve();
  }
  document.body.classList.add('is-intro');

  return new Promise((resolve) => {
    let done = false;
    const enter = $('#introEnter');
    const finish = () => {
      if (done) return; done = true;
      store.set('hl-intro', '1');
      tl.kill();
      document.body.classList.remove('is-intro');
      el.classList.add('is-done');
      resolve();
      setTimeout(() => el.remove(), 1200);
    };
    $('#introSkip').addEventListener('click', finish);
    enter.addEventListener('click', finish);
    addEventListener('keydown', (e) => { if (!done && (e.key === 'Escape' || e.key === 'Enter')) finish(); });

    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    const show = () => { enter.classList.add('is-ready'); enter.focus({ preventScroll: true }); };

    if (motion.reduced) {
      gsap.set('#introMark .m-stem, #introMark .m-bar, #introMark .m-arc, #introMark .m-spark', { opacity: 1 });
      gsap.set('.intro__name span', { y: 0 });
      gsap.set('.intro__tag', { opacity: 1 });
      gsap.set('#introBar', { scaleX: 1 });
      show();
      return;
    }

    gsap.set('#introMark .m-arc', { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set('#introMark .m-bar', { transformBox: 'fill-box', transformOrigin: '0% 50%', scaleX: 0 });
    gsap.set('#introMark .m-spark', { transformBox: 'fill-box', transformOrigin: '0% 100%', scale: 0 });
    tl.fromTo('.m-stem--l', { opacity: 0, x: -90, y: 70 }, { opacity: 1, x: 0, y: 0, duration: 1 }, 0.1)
      .fromTo('.m-stem--r', { opacity: 0, x: 90, y: -70 }, { opacity: 1, x: 0, y: 0, duration: 1 }, 0.1)
      .to('#introMark .m-bar', { opacity: 1, scaleX: 1, duration: 0.7 }, 0.7)
      .to('#introMark .m-arc', { opacity: 1, strokeDashoffset: 0, duration: 0.9, ease: 'power3.inOut' }, 0.9)
      .to('#introMark .m-spark', { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(2.4)' }, 1.6)
      .to('.intro__name span', { y: 0, duration: 0.9, stagger: 0.08 }, 1.5)
      .to('.intro__tag', { opacity: 1, duration: 0.8, ease: 'power2.out' }, 2.0)
      .to('#introBar', { scaleX: 1, duration: 2.6, ease: 'power1.inOut' }, 0)
      .add(show, 2.4)
      .add(() => setTimeout(finish, 900), 3.0);
  });
}
