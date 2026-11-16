// Single place to edit real content.

// Enquiry form -> Google Form. Fill these in after running scripts/create-google-form.gs
// (it prints this exact object). Until formId is set, the form only works in `npm run dev`
// (it logs the payload instead of sending) and shows an error on the live site.
export const ENQUIRY = {
  formId: '', // the long id in https://docs.google.com/forms/d/e/<formId>/viewform
  fields: {
    name: '', email: '', phone: '', company: '', website: '',
    offering: '', subOffering: '', description: '',
    requirements: '', help: '', engagement: '', timeline: '', source: '',
  }, // each value looks like 'entry.123456789'
  fallbackEmail: '', // optional: shown only if sending fails
};

// Option labels must match the Google Form exactly (the Apps Script uses the same lists).
export const OPTIONS = {
  requirements: ['Culture Lab: social, content, influencers', 'Brand Lab: strategy, identity, campaigns', 'Growth Lab: performance, ads, analytics', 'Not sure yet'],
  engagement: ['A one-off project', 'An ongoing monthly retainer', 'A specific campaign', 'Not sure yet'],
  timeline: ['As soon as possible', 'Within 1 to 3 months', 'Just exploring'],
};

// PLACEHOLDER case studies. Do not add client names, numbers or results until verified.
// Each field renders on the card and in the case-study dialog.
export const CASES = [
  {
    id: 'case-1', brand: 'CLIENT NAME', industry: 'Consumer brand',
    objective: 'Objective goes here: what the client needed to change.',
    strategy: 'Creative strategy goes here: the insight and the idea.',
    execution: 'Execution goes here: formats, channels, production.',
    results: null,
    challenge: 'The brief, in the client\'s words.', insight: 'What the audience research showed.',
    idea: 'The one-line creative idea.', outcome: 'Verified results appear here once supplied.',
    tone: 'lime',
  },
  {
    id: 'case-2', brand: 'CLIENT NAME', industry: 'Food and beverage',
    objective: 'Objective goes here: what the client needed to change.',
    strategy: 'Creative strategy goes here: the insight and the idea.',
    execution: 'Execution goes here: formats, channels, production.',
    results: null,
    challenge: 'The brief, in the client\'s words.', insight: 'What the audience research showed.',
    idea: 'The one-line creative idea.', outcome: 'Verified results appear here once supplied.',
    tone: 'white',
  },
  {
    id: 'case-3', brand: 'CLIENT NAME', industry: 'Tech and apps',
    objective: 'Objective goes here: what the client needed to change.',
    strategy: 'Creative strategy goes here: the insight and the idea.',
    execution: 'Execution goes here: formats, channels, production.',
    results: null,
    challenge: 'The brief, in the client\'s words.', insight: 'What the audience research showed.',
    idea: 'The one-line creative idea.', outcome: 'Verified results appear here once supplied.',
    tone: 'orange',
  },
  {
    id: 'case-4', brand: 'CLIENT NAME', industry: 'Retail and D2C',
    objective: 'Objective goes here: what the client needed to change.',
    strategy: 'Creative strategy goes here: the insight and the idea.',
    execution: 'Execution goes here: formats, channels, production.',
    results: null,
    challenge: 'The brief, in the client\'s words.', insight: 'What the audience research showed.',
    idea: 'The one-line creative idea.', outcome: 'Verified results appear here once supplied.',
    tone: 'dark',
  },
];

export const STATUE_LINES = [
  'Ow. Marble has feelings too.',
  'Yes, the sunglasses are indoors. Yes, it is intentional.',
  'Two thousand years of art history and this is how we meet.',
  'Attention earned. Now let\'s talk conversion.',
  'He sees you. He is not blinking. (He is, occasionally.)',
  'Serious about growth. Never boring.',
];
