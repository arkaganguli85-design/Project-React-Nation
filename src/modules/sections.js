import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $, $$, isTouch, motion, splitWords } from './util.js';

// Hero entrance runs after the intro. Everything is visible without JS and under reduced motion.
export function heroIn() {
  const title = $('#heroTitle');
  const words = splitWords(title);
  if (motion.reduced) return;
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.from(words, { yPercent: 115, rotate: 5, duration: 1.15, stagger: 0.05 }, 0.05)
    .from('mark.boring', { scaleX: 0, duration: 0.9, ease: 'power4.inOut' }, 0.9)
    .from('.hero__copy .eyebrow, .hero__lede', { y: 24, opacity: 0, duration: 0.9, stagger: 0.12 }, 0.3)
    .from('.hero__cta > *', { y: 30, opacity: 0, duration: 0.9, stagger: 0.1 }, 0.9)
    .from('#statueWrap', { opacity: 0, scale: 0.94, y: 40, duration: 1.4 }, 0.2)
    .from('.hero__arc', { clipPath: 'inset(100% 0 0 0)', duration: 1.4, ease: 'power3.out' }, 0.1)
    .from('.spark, .float', { scale: 0, opacity: 0, duration: 0.9, stagger: 0.09, ease: 'back.out(2.4)' }, 1.0)
    .from('.scrollcue', { opacity: 0, y: 16, duration: 0.8 }, 1.4);

  // light parallax on floating shapes + statue arc
  if (!isTouch) {
    const hero = $('#hero');
    const items = $$('.float', hero).map((el) => ({ el, d: +el.dataset.depth || 20, x: gsap.quickTo(el, 'x', { duration: 1.2, ease: 'power3' }), y: gsap.quickTo(el, 'y', { duration: 1.2, ease: 'power3' }) }));
    const arcX = gsap.quickTo('.hero__arc', 'x', { duration: 1.6, ease: 'power3' });
    hero.addEventListener('pointermove', (e) => {
      const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
      items.forEach((o) => { o.x(nx * o.d); o.y(ny * o.d); });
      arcX(nx * -30);
    });
  }
}

export function initSections() {
  // generic headline reveals
  $$('[data-split]').forEach((h) => {
    if (h.id === 'heroTitle') return;
    const words = splitWords(h);
    if (motion.reduced) return;
    gsap.from(words, { yPercent: 115, rotate: 4, duration: 1.1, ease: 'expo.out', stagger: 0.045, scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
  });
  if (motion.reduced) { simpleHooks(); return; }

  const rise = (targets, trigger, extra = {}) =>
    gsap.from(targets, { y: 60, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger, start: 'top 82%', once: true }, ...extra });

  // culture: marquee rows travel opposite ways with scroll
  $$('.marquee__row').forEach((row) => {
    const dir = +row.dataset.dir;
    row.style.width = 'max-content';
    gsap.fromTo(row, { x: dir < 0 ? 0 : () => -(row.scrollWidth - innerWidth) }, {
      x: dir < 0 ? () => -(row.scrollWidth - innerWidth) : 0, ease: 'none',
      scrollTrigger: { trigger: '.marquee', start: 'top bottom', end: 'bottom top', scrub: 0.6, invalidateOnRefresh: true },
    });
  });
  rise('.culture__text > *', '.culture__grid');
  rise('.insights li', '.insights');
  rise('.chip', '#chips', { y: 40, scale: 0.9, stagger: 0.07 });
  rise('.mm__panel', '#mm', { y: 80, stagger: 0.18 });

  // culture chips: depth parallax with the pointer
  if (!isTouch) {
    const chips = $$('.chip').map((el) => ({ d: +el.dataset.depth || 20, x: gsap.quickTo(el, 'x', { duration: 1, ease: 'power3' }), y: gsap.quickTo(el, 'y', { duration: 1, ease: 'power3' }) }));
    $('#culture').addEventListener('pointermove', (e) => {
      const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
      chips.forEach((c) => { c.x(nx * c.d * 1.6); c.y(ny * c.d * 1.6); });
    });
  }

  // labs
  gsap.from('.lab-card', { y: 90, opacity: 0, rotateX: 14, duration: 1.1, ease: 'expo.out', stagger: 0.14, scrollTrigger: { trigger: '.labs__grid', start: 'top 85%', once: true }, clearProps: 'opacity,y' });

  // work: pin and scroll the track sideways on larger screens
  const work = $('.work'), track = $('#workTrack');
  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', () => {
    work.classList.add('is-pinned');
    const dist = () => Math.max(0, track.scrollWidth - innerWidth + 80);
    const tween = gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '.work__pin', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.7, invalidateOnRefresh: true, anticipatePin: 1 } });
    return () => { work.classList.remove('is-pinned'); tween.kill(); gsap.set(track, { clearProps: 'transform' }); };
  });
  mm.add('(max-width: 899px)', () => { rise('.client', '#workTrack', { x: 60, y: 0 }); });

  // why
  rise('.pair', '.pairs', { y: 40, stagger: 0.1 });

  // final CTA
  gsap.from('.cta__btn', { scale: 0.7, opacity: 0, duration: 1.2, ease: 'elastic.out(1, .6)', scrollTrigger: { trigger: '.cta__btn', start: 'top 92%', once: true } });
  gsap.from('.cta__arc', { yPercent: 25, duration: 1.8, ease: 'power3.out', scrollTrigger: { trigger: '.cta', start: 'top 80%', once: true } });

  // footer signature: the H draws itself
  const sig = $('#sig');
  gsap.set('.sig-a', { strokeDasharray: 1 });
  const sigTl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } })
    .fromTo('.sig-s', { opacity: 0 }, { opacity: 1, duration: 0.6, stagger: 0.08 }, 0)
    .fromTo('.sig-a', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1, ease: 'power3.inOut' }, 0.3)
    .fromTo('.sig-k', { scale: 0, transformBox: 'fill-box', transformOrigin: '0% 100%' }, { scale: 1, duration: 0.6, ease: 'back.out(2.4)' }, 1.1);
  ScrollTrigger.create({ trigger: sig, start: 'top 95%', onEnter: () => sigTl.play(0) });
  sig.addEventListener('pointerenter', () => sigTl.restart());

  simpleHooks();
  addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
}

function simpleHooks() {
  $('#year').textContent = new Date().getFullYear();
}
