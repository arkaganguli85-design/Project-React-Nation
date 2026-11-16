/**
 * Creates the HUMOR LABS enquiry Google Form, emails every response to NOTIFY_EMAIL,
 * and prints the config to paste into src/content.js (ENQUIRY).
 *
 * How to run (about 3 minutes):
 *  1. Sign in to the Google account that should OWN the form and receive the emails
 *     (use a personal Gmail, not a company Workspace account: Workspace can force
 *     "restrict to organisation", which blocks website visitors).
 *  2. Go to https://script.google.com -> New project -> paste this whole file.
 *  3. Set NOTIFY_EMAIL below (leave '' to use the account you are signed in with).
 *  4. Pick `setup` in the function dropdown -> Run -> approve the permissions.
 *  5. Open View -> Logs (or Execution log), copy the ENQUIRY block into src/content.js.
 *
 * The option lists below must match OPTIONS in src/content.js exactly.
 * Run `setup` once. Running it again creates a second form.
 */
const NOTIFY_EMAIL = ''; // e.g. 'name@gmail.com'

const REQUIREMENTS = ['Culture Lab: social, content, influencers', 'Brand Lab: strategy, identity, campaigns', 'Growth Lab: performance, ads, analytics', 'Not sure yet'];
const ENGAGEMENT = ['A one-off project', 'An ongoing monthly retainer', 'A specific campaign', 'Not sure yet'];
const TIMELINE = ['As soon as possible', 'Within 1 to 3 months', 'Just exploring'];

function setup() {
  const form = FormApp.create('HUMOR LABS: new enquiry');
  form.setDescription('Enquiries submitted from the HUMOR LABS website.');
  form.setConfirmationMessage('Thanks. We will be in touch.');
  form.setCollectEmail(false);
  form.setLimitOneResponsePerUser(false); // must stay off so website visitors need no Google login
  form.setAllowResponseEdits(false);
  form.setProgressBar(false);

  const text = (title, required) => form.addTextItem().setTitle(title).setRequired(required);
  const para = (title, required) => form.addParagraphTextItem().setTitle(title).setRequired(required);
  const items = {
    name: text('Name', true),
    email: text('Work email', true),
    phone: text('Phone or WhatsApp', false),
    company: text('Company or brand', true),
    website: text('Website or Instagram', false),
    offering: text('Business offering', true),
    subOffering: text('Sub-business offering', false),
    description: para('Business description', false),
    requirements: form.addCheckboxItem().setTitle('Business requirement').setChoiceValues(REQUIREMENTS).setRequired(false),
    help: para('How can we help you?', true),
    engagement: form.addListItem().setTitle('How would you like to work?').setChoiceValues(ENGAGEMENT).setRequired(false),
    timeline: form.addListItem().setTitle('When do you want to start?').setChoiceValues(TIMELINE).setRequired(false),
    source: text('How did you hear about us?', false),
  };

  // Entry ids are only exposed through pre-filled links: build one per item and read the id from it.
  const sample = { requirements: [REQUIREMENTS[0]], engagement: ENGAGEMENT[0], timeline: TIMELINE[0] };
  const fields = {};
  Object.keys(items).forEach((key) => {
    const answer = sample[key] !== undefined ? sample[key] : 'x';
    const url = form.createResponse().withItemResponse(items[key].createResponse(answer)).toPrefilledUrl();
    const m = url.match(/entry\.(\d+)=/);
    fields[key] = m ? 'entry.' + m[1] : 'NOT FOUND';
  });

  const publishedUrl = form.getPublishedUrl();
  const formId = (publishedUrl.match(/\/forms\/d\/e\/([^/]+)\//) || [])[1];

  PropertiesService.getScriptProperties().setProperty('FORM_ID', form.getId());
  ScriptApp.newTrigger('onFormSubmitNotify').forForm(form).onFormSubmit().create();

  const config = { formId: formId, fields: fields, fallbackEmail: '' };
  Logger.log('Form editor:  ' + form.getEditUrl());
  Logger.log('Form public:  ' + publishedUrl);
  Logger.log('Emails go to: ' + (NOTIFY_EMAIL || Session.getEffectiveUser().getEmail()));
  Logger.log('--- paste into src/content.js ---\nexport const ENQUIRY = ' + JSON.stringify(config, null, 2) + ';');
}

// Runs on every submission: emails the details to the owner.
function onFormSubmitNotify(e) {
  const to = NOTIFY_EMAIL || Session.getEffectiveUser().getEmail();
  const rows = e.response.getItemResponses().map((r) => {
    const v = r.getResponse();
    return r.getItem().getTitle() + ': ' + (Array.isArray(v) ? v.join(', ') : v);
  });
  const find = (title) => { const r = e.response.getItemResponses().filter((x) => x.getItem().getTitle() === title)[0]; return r ? r.getResponse() : ''; };
  const email = String(find('Work email') || '');
  MailApp.sendEmail({
    to: to,
    replyTo: /@/.test(email) ? email : undefined,
    subject: 'New HUMOR LABS enquiry: ' + (find('Company or brand') || find('Name') || 'website'),
    body: rows.join('\n\n'),
  });
}
