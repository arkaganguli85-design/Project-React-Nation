import { CLIENTS, PORTFOLIO } from '../content.js';
import { $ } from './util.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Renders the client cards plus a final "More" card that downloads the portfolio PDF.
export function initClients() {
  const track = $('#workTrack');
  const base = import.meta.env.BASE_URL;
  track.setAttribute('role', 'list');
  track.setAttribute('aria-label', 'Current clients');

  const cards = CLIENTS.map((c) => `
    <article class="client" role="listitem">
      <div class="client__logo"><img src="${base}clients/${c.logo}" alt="${esc(c.logoAlt)}" width="461" height="392" loading="lazy" decoding="async"></div>
      <div class="client__body">
        <h3>${esc(c.name)}</h3>
        <p class="client__about">${esc(c.about)}</p>
        <p class="client__label">Services</p>
        <ul class="client__services">${c.services.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
      </div>
    </article>`).join('');

  const more = `
    <div class="client client--more" role="listitem">
      <p class="client__label client__label--dark">More</p>
      <h3 class="client__more-title">More work</h3>
      <p class="client__more-text">Campaigns, designs, events, packaging and case studies. The full HUMOR LABS portfolio.</p>
      <a class="btn btn--dark" href="${base}${PORTFOLIO.href}" download="${esc(PORTFOLIO.filename)}" data-cursor="DOWNLOAD">Download portfolio <span aria-hidden="true">&darr;</span></a>
      <p class="client__more-meta">${esc(PORTFOLIO.sizeLabel)} &middot; 30 slides</p>
    </div>`;

  track.innerHTML = cards + more;
}
