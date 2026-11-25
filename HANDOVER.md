# HANDOVER: HUMOR LABS website

Context transfer for a new AI (or human) session. Read this first, then `README.md`.

## What this is
A premium, animation-rich marketing site for **HUMOR LABS**, a creative marketing agency. Tagline: *Serious About Growth. Never Boring.* Signature element: a 3D marble Roman bust wearing neon-lime sunglasses whose head follows the cursor. Brand rules came from `Humor_Labs_Brand_Guidelines.pdf` (not in this repo; the logo and identity sheet are copied to `public/brand/`).

Brand tokens: Deep Black `#0B0B0B`, Electric Lime `#C6FF00`, Off White `#F7F6EF`, Vivid Orange `#FF6A00` (rare). Fonts: Space Grotesk (display), Inter (body). The H symbol is a slanted H with a lime smile arc and a corner spark; never distort it.

## Status
Working end to end on desktop and phone width. Verified in the Claude desktop in-app browser only. **Not yet tested:** Safari, Firefox, real touch devices, low-end phone frame rate, Lighthouse/axe.

Sections (all in `index.html`): opening intro, hero, culture, three labs, work, the lab (playground), why, final CTA, footer.

## Stack
Vite 5 + vanilla JS (ES modules). three 0.170, gsap 3.12 + ScrollTrigger, lenis 1.1. `sharp` is a dev dependency used only by `scripts/`. No framework, no TypeScript, no tests, no CI yet. Output is static files (`dist/`).

## Layout
| Path | Purpose |
| --- | --- |
| `index.html` | All markup and copy |
| `src/styles.css` | Whole design system (tokens at top) and every section |
| `src/main.js` | Boot order: scroll, cursor, sections, lab, then intro, hero entrance, statue wiring |
| `src/content.js` | Enquiry form config, current clients, portfolio download, statue click lines |
| `src/modules/` | `intro`, `pointer` (cursor, magnetic, tilt), `scroll` (Lenis, nav, menu, motion toggle), `sections` (GSAP reveals, pinned Work track), `clients` (client cards and the More/download card), `lab` (canvas playground and warped headline), `easter`, `util` |
| `src/statue/statue.js` | Three.js scene, lights, glasses, rig, animation loop |
| `src/statue/sculpt.worker.js` | Procedural SDF bust, used only as fallback |
| `public/models/marble_bust_01/` | Scanned bust (`bust.gltf`, `.bin`, 1K/2K textures) |
| `assets-src/` | 4K originals from Poly Haven; not shipped |
| `scripts/` | `prep-bust.mjs`, `make-gltf.mjs` (how the web assets were made) |

## The statue (most delicate part)
- Model: Poly Haven "Marble Bust 01", Rico Cilliers, CC0. One mesh.
- Rig: the mesh is baked at load (`BUST` constants in `statue.js`: pivot, face yaw, scale). The head bends at the neck in the **vertex shader** (`HEAD_BEND`, weight ramp from shoulders to chin), driven by the `uHead` uniform (pitch, yaw, roll) copied from `headGroup.rotation` each frame. A matching `customDepthMaterial` keeps shadows correct.
- Glasses, glow sprites and a lime point light live under `glasses.group`, attached to `headGroup` (rotates about the neck pivot). Position and size: `glassesOffset` / `glassesScale` in `buildBustGLB`.
- Movement: spring-damped yaw/pitch, idle drift after 2.5 s, blink (dips neon), click reaction (`react()`), glow target for `[data-glow]` elements. Base 3/4 pose is `BASE_YAW`.
- Fallback: if the GLB fails, `buildProcedural` runs the SDF worker.
- Debug: `window.__statue` exposes `setPointer`, `setGlow`, `react`, `setReducedMotion`, `glassesGroup`, `stats`.

### Gotchas already hit
- glTF textures loaded with `TextureLoader` need `flipY = false`.
- Pitch sign: positive x-rotation tips the face **down**; `pitchT = +ty` (cursor below means look down).
- Idle pose drift confuses visual tuning; call `__statue.setReducedMotion(true)` to freeze before adjusting offsets.
- The hero's lime arc lives **inside** `.hero__statue` and is sized in container units from the smaller side of the statue box (`cqmin`), so it scales with the statue instead of the window. `.hero__statue` therefore needs an **explicit height** (`clamp(...)`, not min-height plus grid stretch) and `container-type: size`: with an implicit height the `cqh`/`cqmin` units resolve to 0 and the arc disappears. The hero itself spans the full window (content is centred with padding), otherwise `overflow: clip` slices the arc on screens wider than 1600 px. The statue camera also backs off when the column is narrow so the shoulders are never cropped (`fitWidth` in `resize()`).
- `.work` has `overflow-x: clip` so the pinned sideways track cannot be scrolled into view by tabbing or code (`overflow: hidden` still allows that).
- `[hidden]` needs `display:none !important` globally or `display:grid` rules override it.
- Vite dev server first-run dependency re-optimisation can log a one-off Worker error; reload.
- The intro plays once per session (`sessionStorage`); add `?intro` to replay.
- The motion toggle persists in `sessionStorage` and **reloads the page** so every effect re-initialises.

## Content rules (important)
- The Work section shows the **4 current clients** from the "Our current ongoing clients" slide (Jio Insurance Broking, Legal Bruz India & UK, Suncolour Salon, PGP Learning). Data is `CLIENTS` in `src/content.js`; logos were cropped from that slide into `public/clients/`. Never invent results, numbers or testimonials; none were supplied. Confirm each client is happy to have their logo shown. The last card ("More work") downloads `public/downloads/Humor_Labs_Portfolio.pdf` (30-slide deck, about 22 MB; Cloudflare Pages allows 25 MB per file, so keep it under that or host it elsewhere).
- Social links (`#`) in the footer are placeholders. There is no public email address on the site; contact is the enquiry form.
- **Enquiry form:** `#enquiry` in `index.html`, logic in `src/modules/enquiry.js`, config in `ENQUIRY` / `OPTIONS` in `src/content.js`. It POSTs (no-cors) to a Google Form's `formResponse` URL. The Form and the "email me each response" trigger are created by `scripts/create-google-form.gs` (run once in Google Apps Script; it prints the config to paste). **Status: connected and tested by the owner (response stored, notification email received).** The site asks 8 fields (name, number, email, business name, website URL, business requirement, how soon, heard about us). The script creates a Google Form with the same 8 questions (keys: name, phone, email, company, website, help, timeline, source). **The Google setup is being redone from scratch** (the first form's notification emails stopped reaching the recipient for an undiagnosed reason): after the user runs the new script, `ENQUIRY` in `src/content.js` must be replaced with the printed block. If you add a required question on the Google side, the site must send it too (or set `ENQUIRY.constants`), otherwise Google silently rejects submissions. In production with no `formId` the form shows "not connected yet" instead of pretending to send. Google returns an opaque response, so success means "request sent", not "confirmed stored".
- The H symbol is rebuilt as SVG from the logo image (no vector master was supplied). Replace with the official vector when available (`index.html`, `public/h-symbol.svg`, `public/favicon.svg`).

## Environment notes
- Developed on Windows 11 behind a corporate TLS-inspection proxy. Node/curl could not reach some hosts (Poly Haven downloads were blocked by the web filter). Verification was never disabled for the model download; the files were downloaded manually by the user.
- Hero statue needs WebGL; without it an SVG H fallback shows.

## Suggested next steps (in order)
1. Connect the Google Form (run the Apps Script, paste `ENQUIRY`, send a real test enquiry end to end). 2. Real content (cases, socials). 3. Cross-browser/device testing. 4. Lighthouse and axe pass (font preloads, contrast of grey text, keyboard route to statue reaction). 5. Launch basics: OG image, `robots.txt`, sitemap, 404, security headers. 6. Deploy via Vercel, Netlify or Cloudflare Pages from GitHub. 7. Enhancements: thicker curls on the statue, device-motion on phones, per-case URLs, CMS for cases.

## Do not
- Redraw or distort the H symbol, add fake stats, or add gradient-heavy "SaaS" looks (brand brief forbids them).
- Commit secrets. No tokens or keys belong in this repo.
