/**
 * Creates the HUMOR LABS enquiry Google Form (the same 8 questions the website asks),
 * emails every response to NOTIFY_EMAIL, and prints the config to paste into src/content.js.
 *
 * Run it from scratch (about 3 minutes):
 *  1. Sign in to the Google account that should OWN the form. Use a personal Gmail, not a company
 *     Workspace account (Workspace can restrict forms to the organisation and block website visitors).
 *  2. Go to https://script.google.com -> New project -> delete the sample code -> paste this whole file.
 *  3. Set NOTIFY_EMAIL below. REQUIRED. Several addresses: 'a@gmail.com,b@gmail.com'.
 *  4. Pick `setup` in the function dropdown -> Run -> approve the permissions.
 *  5. A confirmation email is sent to NOTIFY_EMAIL. Open the execution log, copy the whole
 *     `export const ENQUIRY = ...` block and replace the one in src/content.js.
 *
 * Run `setup` only once: every run creates another form (and another trigger).
 * `testEmail` can be run any time to check delivery without submitting the form.
 * The timeline options must match OPTIONS.timeline in src/content.js.
 */
const NOTIFY_EMAIL = ''; // REQUIRED, e.g. 'name@gmail.com'

const TIMELINE = ['As soon as possible', 'Within 1 to 3 months', 'Just exploring'];

function setup() {
  if (!NOTIFY_EMAIL) throw new Error('Set NOTIFY_EMAIL at the top of the script, save, then run setup again.');

  const form = FormApp.create('HUMOR LABS: new enquiry');
  form.setDescription('Enquiries submitted from the HUMOR LABS website.');
  form.setConfirmationMessage('Thanks. We will be in touch.');
  form.setCollectEmail(false);
  form.setLimitOneResponsePerUser(false); // must stay off so website visitors need no Google login
  form.setAllowResponseEdits(false);
  form.setProgressBar(false);

  const text = (title, required) => form.addTextItem().setTitle(title).setRequired(required);
  // keys match the site's field names; titles are what shows up in the notification email
  const items = {
    name: text('Name', true),
    phone: text('Number', false),
    email: text('Email address', true),
    company: text('Business name', true),
    website: text('Business website URL', false),
    help: form.addParagraphTextItem().setTitle('Business requirement').setRequired(true),
    timeline: form.addListItem().setTitle('How soon do you want to start?').setChoiceValues(TIMELINE).setRequired(false),
    source: text('How did you hear about us?', false),
  };

  // Entry ids are only exposed through pre-filled links: build one per item and read the id from it.
  const fields = {};
  Object.keys(items).forEach((key) => {
    const answer = key === 'timeline' ? TIMELINE[0] : 'x';
    const url = form.createResponse().withItemResponse(items[key].createResponse(answer)).toPrefilledUrl();
    const m = url.match(/entry\.(\d+)=/);
    fields[key] = m ? 'entry.' + m[1] : 'NOT FOUND';
  });

  const publishedUrl = form.getPublishedUrl();
  const formId = (publishedUrl.match(/\/forms\/d\/e\/([^/]+)\//) || [])[1];

  ScriptApp.newTrigger('onFormSubmitNotify').forForm(form).onFormSubmit().create();

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: 'HUMOR LABS enquiry notifications are set up',
    body: 'If you can read this, new website enquiries will be emailed to this address.\n\nForm: ' + form.getEditUrl(),
  });

  const config = { formId: formId, fields: fields, fallbackEmail: '' };
  Logger.log('Form editor:  ' + form.getEditUrl());
  Logger.log('Form public:  ' + publishedUrl);
  Logger.log('Notifications and a confirmation email were sent to: ' + NOTIFY_EMAIL);
  Logger.log('--- paste into src/content.js (replace the whole ENQUIRY block) ---\nexport const ENQUIRY = ' + JSON.stringify(config, null, 2) + ';');
}

// Runs on every submission: emails the details to NOTIFY_EMAIL.
function onFormSubmitNotify(e) {
  const answers = e.response.getItemResponses();
  const find = (title) => { const r = answers.filter((x) => x.getItem().getTitle() === title)[0]; return r ? String(r.getResponse()) : ''; };
  const body = answers.map((r) => r.getItem().getTitle() + ': ' + r.getResponse()).join('\n\n');
  const mail = {
    to: NOTIFY_EMAIL,
    subject: 'New HUMOR LABS enquiry: ' + (find('Business name') || find('Name') || 'website'),
    body: body,
  };
  const reply = find('Email address');
  if (/@/.test(reply)) mail.replyTo = reply;
  MailApp.sendEmail(mail);
  Logger.log('Notification sent to: ' + NOTIFY_EMAIL + ' | subject: ' + mail.subject + ' | quota left: ' + MailApp.getRemainingDailyQuota());
}

// Run from the editor to check delivery without submitting the form.
function testEmail() {
  if (!NOTIFY_EMAIL) throw new Error('Set NOTIFY_EMAIL at the top of the script first.');
  MailApp.sendEmail({ to: NOTIFY_EMAIL, subject: 'HUMOR LABS test email', body: 'If you can read this, enquiry notifications can reach this address.' });
  Logger.log('Sent test email to: ' + NOTIFY_EMAIL + ' | remaining daily quota: ' + MailApp.getRemainingDailyQuota());
}
