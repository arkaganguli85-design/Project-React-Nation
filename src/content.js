// Single place to edit real content.

// Enquiry form -> Google Form. Fill these in after running scripts/create-google-form.gs
// (it prints this exact object). Until formId is set, the form only works in `npm run dev`
// (it logs the payload instead of sending) and shows an error on the live site.
export const ENQUIRY = {
  formId: '1FAIpQLScT5yzry8ImVCFi2hNVtCEFXYbvsfBU96m9brSkIPksQ8gpmw', // the long id in https://docs.google.com/forms/d/e/<formId>/viewform
  fields: {
    name: 'entry.1727090122',
    phone: 'entry.1625363084',
    email: 'entry.95299968',
    company: 'entry.1521787653',
    website: 'entry.866662747',
    help: 'entry.1449309471',
    timeline: 'entry.1073104972',
    source: 'entry.1567667618',
  }, // each value looks like 'entry.123456789'
  fallbackEmail: '', // optional: shown only if sending fails
  // Fixed values for any required Google Form question the site does not ask (none right now).
  // Without a value Google silently rejects the whole submission. Keys are names from `fields`,
  // e.g. constants: { offering: 'Not asked' } once `fields.offering` exists.
  constants: {},
};

// Option labels must match the Google Form exactly (the Apps Script uses the same list).
export const OPTIONS = {
  timeline: ['As soon as possible', 'Within 1 to 3 months', 'Just exploring'],
};

// Current clients, from the "Our current ongoing clients" slide in Humor_Labs_Portfolio_Clean.pdf.
// Logos are cropped from that slide (public/clients/). Do not add results or numbers until verified.
export const CLIENTS = [
  {
    id: 'jio-insurance-broking', name: 'Jio Insurance Broking', logo: 'jio.jpg', logoAlt: 'Jio Insurance Broking Ltd. logo',
    about: 'Insurance broking campaign focused on digital reach, audience acquisition and campaign performance.',
    services: ['Performance Marketing', 'Campaign Management', 'Digital Ads'],
  },
  {
    id: 'legal-bruz', name: 'Legal Bruz India & UK', logo: 'legal-bruz.jpg', logoAlt: 'Legal Bruz logo',
    about: 'Legal services brand catering to trademark registration and intellectual property solutions across India and the UK.',
    services: ['Profile Handling', 'Content Creation', 'Shoots', 'Digital Marketing', 'Ads'],
  },
  {
    id: 'suncolour-salon', name: 'Suncolour Salon', logo: 'suncolour.jpg', logoAlt: 'Suncolor Unisex Beauty Salon logo',
    about: 'Salon and beauty brand focused on building its digital presence and showcasing its services.',
    services: ['Profile Handling', 'Content Creation', 'Shoots', 'Influencer Marketing', 'Digital Marketing', 'Business Management'],
  },
  {
    id: 'pgp-learning', name: 'PGP Learning', logo: 'pgp.jpg', logoAlt: 'PGP Academy logo',
    about: 'Learning and education brand promoting courses through digital campaigns and course enrolments.',
    services: ['Performance Marketing', 'Course Ads', 'Campaign Marketing', 'Offline Marketing Campaign'],
  },
];

// The "More" card at the end of the Work track downloads this file.
export const PORTFOLIO = { href: 'downloads/Humor_Labs_Portfolio.pdf', sizeLabel: '22 MB PDF', filename: 'Humor_Labs_Portfolio.pdf' };

export const STATUE_LINES = [
  'Ow. Marble has feelings too.',
  'Yes, the sunglasses are indoors. Yes, it is intentional.',
  'Two thousand years of art history and this is how we meet.',
  'Attention earned. Now let\'s talk conversion.',
  'He sees you. He is not blinking. (He is, occasionally.)',
  'Serious about growth. Never boring.',
];
