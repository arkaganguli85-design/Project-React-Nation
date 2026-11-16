import { CASES } from '../content.js';
import { $ } from './util.js';
import { lenis } from './scroll.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Renders placeholder case cards. A card with no verified `results` says so instead of inventing numbers.
export function initCases() {
  const track = $('#workTrack');
  track.setAttribute('role', 'group');
  track.setAttribute('aria-label', 'Case studies');
  track.innerHTML = CASES.map((c) => `
    <button class="case-card" type="button" data-id="${c.id}" data-cursor="VIEW">
      <span class="case-card__vis tone-${c.tone}">
        <span class="case-card__flag">Placeholder</span>
        <b>${esc(c.brand)}</b>
      </span>
      <span class="case-card__body">
        <span class="case-card__meta"><span>${esc(c.industry)}</span><span>Case study</span></span>
        <dl>
          <div><dt>Objective</dt><dd>${esc(c.objective)}</dd></div>
          <div><dt>Creative strategy</dt><dd>${esc(c.strategy)}</dd></div>
          <div><dt>Execution</dt><dd>${esc(c.execution)}</dd></div>
          <div><dt>Results</dt><dd>${c.results ? esc(c.results) : 'Awaiting verified results.'}</dd></div>
        </dl>
        <span class="case-card__more">View case &rarr;</span>
      </span>
    </button>`).join('');

  const dlg = $('#caseDlg'), body = $('#caseBody');
  track.addEventListener('click', (e) => {
    const card = e.target.closest('.case-card');
    if (!card) return;
    const c = CASES.find((x) => x.id === card.dataset.id);
    body.innerHTML = `
      <div class="case__hero tone-${c.tone}">
        <p>${esc(c.industry)} &middot; Placeholder case study</p>
        <h3 id="caseTitle">${esc(c.brand)}</h3>
      </div>
      <div class="case__grid">
        <section><h4>Challenge</h4><p>${esc(c.challenge)}</p></section>
        <section><h4>Insight</h4><p>${esc(c.insight)}</p></section>
        <section><h4>Idea</h4><p>${esc(c.idea)}</p></section>
        <section><h4>Execution</h4><p>${esc(c.execution)}</p></section>
        <section><h4>Objective</h4><p>${esc(c.objective)}</p></section>
        <section><h4>Outcome</h4><p>${c.results ? esc(c.results) : esc(c.outcome)}</p></section>
      </div>
      <p class="case__foot">This is a labelled placeholder. Replace it in <code>src/content.js</code> once the case study and its numbers are verified.</p>`;
    lenis && lenis.stop();
    dlg.showModal();
  });
  const close = () => { lenis && lenis.start(); };
  dlg.addEventListener('close', close);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
}
