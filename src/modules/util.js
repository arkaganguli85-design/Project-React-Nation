export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;

export const isTouch = matchMedia('(hover: none), (pointer: coarse)').matches;

const store = {
  get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* storage may be blocked */ } },
};
export { store };

// Motion preference: OS setting by default, overridable with the nav toggle (kept for the session).
const osReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const saved = store.get('hl-motion');
export const motion = { reduced: saved ? saved === 'off' : osReduced };
document.documentElement.classList.toggle('reduce-motion', motion.reduced);

// Wrap each word in a masked span so headlines can reveal word by word.
export function splitWords(el) {
  if (el.dataset.splitDone) return $$('.wi', el);
  el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
  const walk = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(' '); return; }
          const w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
          const i = document.createElement('span'); i.className = 'wi'; i.textContent = part;
          w.append(i); frag.append(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
  };
  walk(el);
  el.dataset.splitDone = '1';
  return $$('.wi', el);
}

let toastTimer;
export function toast(msg, ms = 2600) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('is-on'), ms);
}
