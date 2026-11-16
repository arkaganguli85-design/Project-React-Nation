import { ENQUIRY, OPTIONS } from '../content.js';
import { $, $$ } from './util.js';

const REQUIRED = {
  name: 'Please tell us your name.',
  email: 'Please enter a valid email so we can reply.',
  company: 'Please tell us your company or brand.',
  offering: 'Please tell us what your business offers.',
  help: 'Please tell us how we can help.',
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Sends the enquiry to a Google Form. Google does not return a readable response to browsers,
// so a resolved fetch means "sent"; only network failures surface as errors.
async function send(data) {
  if (!ENQUIRY.formId) {
    if (import.meta.env.DEV) { console.info('[enquiry] dev mode, not sent:', data); return; }
    throw new Error('not-configured');
  }
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) {
    const entry = ENQUIRY.fields[key];
    if (!entry) continue;
    (Array.isArray(value) ? value : [value]).forEach((v) => { if (v !== '') body.append(entry, v); });
  }
  await fetch(`https://docs.google.com/forms/d/e/${ENQUIRY.formId}/formResponse`, {
    method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body,
  });
}

export function initEnquiry() {
  const form = $('#enquiry');
  if (!form) return;
  const done = $('#enqDone'), status = $('#enqStatus'), btn = $('#ctaBtn');

  // options come from content.js so the form and the Google Form stay in sync
  const fillSelect = (el, list) => { el.innerHTML = '<option value="">Select one (optional)</option>' + list.map((o) => `<option>${o}</option>`).join(''); };
  fillSelect($('#enqEngagement'), OPTIONS.engagement);
  fillSelect($('#enqTimeline'), OPTIONS.timeline);
  $('#enqReq').innerHTML = OPTIONS.requirements.map((o, i) =>
    `<label class="enq__chip"><input type="checkbox" name="requirements" value="${o}" id="req${i}"><span>${o}</span></label>`).join('');

  const setError = (name, msg) => {
    const field = form.elements[name];
    const err = $(`#err-${name}`);
    if (!field || !err) return;
    err.textContent = msg;
    field.toggleAttribute('aria-invalid', !!msg);
    if (msg) { field.setAttribute('aria-invalid', 'true'); field.setAttribute('aria-describedby', err.id); } else { field.removeAttribute('aria-invalid'); }
  };
  const validate = () => {
    let first = null;
    Object.entries(REQUIRED).forEach(([name, msg]) => {
      const v = form.elements[name].value.trim();
      const bad = !v || (name === 'email' && !EMAIL_RE.test(v));
      setError(name, bad ? msg : '');
      if (bad && !first) first = form.elements[name];
    });
    if (first) first.focus();
    return !first;
  };
  $$('input, textarea', form).forEach((el) => el.addEventListener('input', () => { if (el.name in REQUIRED) setError(el.name, ''); }));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = ''; status.classList.remove('is-error');
    if (!validate()) return;
    if (form.elements.company_site.value) { form.hidden = true; done.hidden = false; return; } // honeypot: bots see success

    const fd = new FormData(form);
    const data = {
      name: fd.get('name').trim(), email: fd.get('email').trim(), phone: fd.get('phone').trim(), company: fd.get('company').trim(),
      website: fd.get('website').trim(), offering: fd.get('offering').trim(), subOffering: fd.get('subOffering').trim(),
      description: fd.get('description').trim(), requirements: fd.getAll('requirements'), help: fd.get('help').trim(),
      engagement: fd.get('engagement'), timeline: fd.get('timeline'), source: fd.get('source').trim(),
    };

    btn.disabled = true; status.textContent = 'Sending...';
    try {
      await send(data);
      form.hidden = true; done.hidden = false; status.textContent = '';
      done.focus({ preventScroll: true });
      done.scrollIntoView({ block: 'center', behavior: 'smooth' });
      document.dispatchEvent(new CustomEvent('hl:enquiry-sent'));
    } catch (err) {
      const notConfigured = err && err.message === 'not-configured';
      status.classList.add('is-error');
      status.textContent = notConfigured
        ? 'The enquiry form is not connected yet. Please try again soon.'
        : 'Could not send. Check your connection and try again.' + (ENQUIRY.fallbackEmail ? ` Or email ${ENQUIRY.fallbackEmail}.` : '');
    } finally { btn.disabled = false; }
  });

  $('#enqAgain').addEventListener('click', () => { form.reset(); done.hidden = true; form.hidden = false; $('#enqName').focus(); });
}
