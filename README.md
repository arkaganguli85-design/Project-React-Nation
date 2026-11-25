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
3. Set `NOTIFY_EMAIL` at the top (required; several addresses can be comma-separated). The script refuses to run without it.
4. Run the `setup` function and approve the permissions. A confirmation email goes to `NOTIFY_EMAIL`, so you know delivery works before you test the site.
5. In the execution log, copy the printed `ENQUIRY` block over the whole one in `src/content.js`.
6. Run `npm run dev`, submit a test enquiry, and check the Google Form's Responses tab and the inbox.

Starting over: trash the old Google Form and delete the old Apps Script project (or its triggers) first, so you don't get duplicate emails.

The site form and the Google Form have the same eight questions: name, number, email, business name, business website URL, business requirement, how soon to start, and how they heard about you. If you add a required question to the Google Form, the site must send it too, or Google silently rejects every submission. `ENQUIRY.constants` in `src/content.js` can supply a fixed value for such a question.

Until `ENQUIRY.formId` is filled in, the form only works in `npm run dev` (it logs the payload to the console) and shows a "not connected yet" message on a deployed site. The timeline options in `src/content.js` (`OPTIONS`) must match the ones in the script. Run `setup` only once, since it creates a new form each time.

## Deploy

`dist/` is plain static files, so any static host works. The recommended free option is **Cloudflare Pages**.

### Cloudflare Pages (free, persistent)
1. Cloudflare dashboard, Workers & Pages, create a project, **Connect to Git**, pick this repo.
2. Framework preset **None**, build command `npm run build`, build output directory `dist`.
3. Environment variables: `NODE_VERSION` = `20`. Optional but recommended once you have a domain: `SITE_URL` = `https://yourdomain.com` (no trailing slash).
4. Deploy. Every push to `main` redeploys; other branches get preview URLs.

`SITE_URL` feeds the share-card tags, canonical link, `robots.txt` and `sitemap.xml` (see `vite.config.js`). If it is not set, Cloudflare's `CF_PAGES_URL` (the `*.pages.dev` address) is used, and locally they stay relative.

`public/_headers` sets caching and basic security headers, `public/404.html` is the not-found page, and `public/og-image.png` is the share image (regenerate with `scripts/make-og-image.mjs`).

### Custom domain (for example one bought on GoDaddy)
No certificate or code is shared with GoDaddy; Cloudflare issues the HTTPS certificate automatically.
1. In Cloudflare, add the domain as a site (free plan). Cloudflare gives you two nameservers.
2. At GoDaddy, open the domain's DNS settings and replace the nameservers with those two. If DNSSEC is on at GoDaddy, turn it off first. Remove any GoDaddy parking or forwarding records.
3. Wait for Cloudflare to show the domain as Active (minutes to a few hours).
4. In the Pages project, open Custom domains and add both `yourdomain.com` and `www.yourdomain.com`. Cloudflare creates the DNS records and certificate.
5. Set the `SITE_URL` build variable to the final address and redeploy.

## Where to edit

| What | Where |
| --- | --- |
| Enquiry form connection, option lists, clients, portfolio download, statue click lines | `src/content.js` |
| Client logos and the portfolio PDF | `public/clients/`, `public/downloads/Humor_Labs_Portfolio.pdf` |
| Enquiry form fields and logic | `index.html` (`#enquiry`), `src/modules/enquiry.js` |
| Page copy and sections | `index.html` |
| Colours, type, layout | `src/styles.css` (tokens at the top) |
| Statue look, lights, glasses, rig | `src/statue/statue.js` |
| Procedural fallback sculpt | `src/statue/sculpt.worker.js` |

## Notes

- The Work section lists the current clients from the portfolio deck (`CLIENTS` in `src/content.js`) and ends with a "More work" card that downloads the portfolio PDF. No results or numbers are shown because none have been supplied; add only verified ones. To update the PDF, replace `public/downloads/Humor_Labs_Portfolio.pdf` (keep it under 25 MB for Cloudflare Pages).
- The H symbol is rebuilt as SVG from the logo in the brand guidelines (no vector master was supplied). Swap in the official paths in `index.html` and `public/*.svg` when available. Reference images are in `public/brand/`.
- The statue is the CC0 scan "Marble Bust 01" by Rico Cilliers ([Poly Haven](https://polyhaven.com/a/marble_bust_01)), served from `public/models/marble_bust_01/` (2K textures, 1K on low-power devices). It is one mesh, so the head is rigged by bending the neck in the vertex shader (`HEAD_BEND`); the neon glasses, glow and light are attached to a separate head group.
- If the model fails to load, the site falls back to a procedural SDF sculpt.
- `scripts/prep-bust.mjs` and `scripts/make-gltf.mjs` show how the 4K download in `assets-src/` was turned into the web files. `assets-src/` is not shipped in the build.
- Motion honours `prefers-reduced-motion`.
