// Builds public/og-image.png (the 1200x630 share card shown when the link is pasted into chats and socials).
// One-off, not part of the build. Needs two temporary installs:
//   npm i --no-save @resvg/resvg-js @expo-google-fonts/space-grotesk
//   node scripts/make-og-image.mjs
import fs from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const font = 'node_modules/@expo-google-fonts/space-grotesk/700Bold/SpaceGrotesk_700Bold.ttf';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0B0B0B"/>
  <defs><clipPath id="lower"><rect x="0" y="420" width="1200" height="210"/></clipPath></defs>
  <circle cx="1100" cy="420" r="270" fill="none" stroke="#C6FF00" stroke-width="80" clip-path="url(#lower)"/>

  <g transform="translate(70 56) scale(0.5)">
    <polygon fill="#F7F6EF" points="60,12 110,12 65,165 15,165"/>
    <polygon fill="#F7F6EF" points="180,12 230,12 185,165 135,165"/>
    <path d="M 70 98 Q 125 162 172 94" fill="none" stroke="#F7F6EF" stroke-width="30"/>
    <path d="M 52 80 Q 125 150 190 74" fill="none" stroke="#C6FF00" stroke-width="24"/>
    <path fill="#C6FF00" d="M 232 -22 H 272 V 18 H 258 V -8 H 232 Z"/>
  </g>
  <text x="228" y="92" font-family="Space Grotesk" font-weight="700" font-size="40" fill="#F7F6EF" letter-spacing="-1">HUMOR</text>
  <text x="228" y="132" font-family="Space Grotesk" font-weight="700" font-size="40" fill="#F7F6EF" letter-spacing="-1">LABS</text>

  <g font-family="Space Grotesk" font-weight="700" font-size="82" fill="#F7F6EF" letter-spacing="-3">
    <text x="70" y="250">MARKETING FOR</text>
    <text x="70" y="334">BRANDS THAT</text>
    <text x="70" y="418">DON'T WANT TO BE</text>
  </g>
  <rect x="62" y="438" width="336" height="86" fill="#C6FF00"/>
  <text x="74" y="504" font-family="Space Grotesk" font-weight="700" font-size="82" fill="#0B0B0B" letter-spacing="-3">BORING.</text>

  <text x="70" y="584" font-family="Space Grotesk" font-weight="700" font-size="26" fill="#C6FF00" letter-spacing="4">SERIOUS ABOUT GROWTH. NEVER BORING.</text>
</svg>`;

const png = new Resvg(svg, { font: { fontFiles: [font], loadSystemFonts: false, defaultFontFamily: 'Space Grotesk' } }).render().asPng();
fs.writeFileSync('public/og-image.png', png);
console.log('public/og-image.png', png.length, 'bytes');
