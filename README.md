# HUMOR LABS website

Serious About Growth. Never Boring.

An interactive agency site: Vite + vanilla JS, Three.js (a marble bust in neon sunglasses that follows your cursor), GSAP + ScrollTrigger, Lenis smooth scroll.

New to this project (or an AI picking it up)? Read [HANDOVER.md](HANDOVER.md) first.

## Get it running

**Prerequisites:** Node.js 18 or newer (20+ recommended) and npm. A browser with WebGL.

```bash
git clone https://github.com/arkaganguli85-design/Project-React-Nation.git
cd Project-React-Nation
npm install
npm run dev
```

Open **http://localhost:5173**. The first load takes a few seconds while Vite prepares dependencies; if the console shows a one-off Worker error, just reload.

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload on port 5173 |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |

Tips:
- The opening animation plays once per browser session. Add `?intro` to the URL to replay it.
- The "Motion on" button in the nav pauses motion (it remembers for the session and reloads the page). Your OS reduced-motion setting is respected too.
- To test phone layout, use your browser's responsive mode (about 375 px wide).

### Troubleshooting
- **Blank statue area:** WebGL is off or blocked. An SVG H appears instead. Enable hardware acceleration.
- **Port 5173 busy:** run `npm run dev -- --port 5174`.
- **`npm install` fails behind a corporate proxy:** configure npm's proxy and CA settings; do not disable TLS verification.
- **Statue looks wrong after editing:** the glasses offset is tuned in `src/statue/statue.js` (`glassesOffset`, `glassesScale`). Freeze the idle motion for tuning with `__statue.setReducedMotion(true)` in the console.

## Enquiry form (Google Form)

The contact form on the site submits into a Google Form, and each response is emailed to you. Set it up once:

1. Sign in to the Google account that should receive enquiries (a personal Gmail works best; a company Workspace account can block outside visitors).
2. Open https://script.google.com, create a new project, and paste in [`scripts/create-google-form.gs`](scripts/create-google-form.gs).
3. Optionally set `NOTIFY_EMAIL` at the top (defaults to the signed-in account).
4. Run the `setup` function and approve the permissions.
5. In the execution log, copy the printed `ENQUIRY` block over the one in `src/content.js`.
6. Run `npm run dev`, submit a test enquiry, and check the Google Form's Responses tab and your inbox.

The site form asks for: name, number, email, business name, business website URL, business requirement, how soon to start, and how they heard about you. The Google Form created by the script has a few extra questions (business offering, sub-offering, description, work style, requirement checkboxes). The site simply leaves those blank. Because Google marks "Business offering" as required, the site always sends a fixed value for it (`ENQUIRY.constants` in `src/content.js`); without it Google would reject every submission. The "Business requirement" text goes into the Google Form's "How can we help you?" answer.

Until `ENQUIRY.formId` is filled in, the form only works in `npm run dev` (it logs the payload to the console) and shows a "not connected yet" message on a deployed site. The timeline options in `src/content.js` (`OPTIONS`) must match the ones in the script. Run `setup` only once, since it creates a new form each time.

## Deploy

`dist/` is plain static files. Use Vercel, Netlify, Cloudflare Pages or S3 + CDN. Build command `npm run build`, output directory `dist`.

## Where to edit

| What | Where |
| --- | --- |
| Enquiry form connection, option lists, case studies, statue click lines | `src/content.js` |
| Enquiry form fields and logic | `index.html` (`#enquiry`), `src/modules/enquiry.js` |
| Page copy and sections | `index.html` |
| Colours, type, layout | `src/styles.css` (tokens at the top) |
| Statue look, lights, glasses, rig | `src/statue/statue.js` |
| Procedural fallback sculpt | `src/statue/sculpt.worker.js` |

## Notes

- Case studies are labelled placeholders. No client names, numbers or results are invented; add verified ones in `src/content.js`.
- The H symbol is rebuilt as SVG from the logo in the brand guidelines (no vector master was supplied). Swap in the official paths in `index.html` and `public/*.svg` when available. Reference images are in `public/brand/`.
- The statue is the CC0 scan "Marble Bust 01" by Rico Cilliers ([Poly Haven](https://polyhaven.com/a/marble_bust_01)), served from `public/models/marble_bust_01/` (2K textures, 1K on low-power devices). It is one mesh, so the head is rigged by bending the neck in the vertex shader (`HEAD_BEND`); the neon glasses, glow and light are attached to a separate head group.
- If the model fails to load, the site falls back to a procedural SDF sculpt.
- `scripts/prep-bust.mjs` and `scripts/make-gltf.mjs` show how the 4K download in `assets-src/` was turned into the web files. `assets-src/` is not shipped in the build.
- Motion honours `prefers-reduced-motion`.
