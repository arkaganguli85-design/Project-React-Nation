import { defineConfig } from 'vite';

// The public address of the site, used for share-card tags, robots.txt and sitemap.xml.
// Set SITE_URL (e.g. https://yourdomain.com) in the host's build environment. Cloudflare Pages also provides
// CF_PAGES_URL (the *.pages.dev address), which is used until a custom domain is set. Empty locally.
const siteUrl = (process.env.SITE_URL || process.env.CF_PAGES_URL || '').replace(/\/+$/, '');

export default defineConfig({
  plugins: [
    {
      name: 'site-url',
      transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', siteUrl),
      generateBundle() {
        const robots = `User-agent: *\nAllow: /\n${siteUrl ? `\nSitemap: ${siteUrl}/sitemap.xml\n` : ''}`;
        this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots });
        if (siteUrl) {
          const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${siteUrl}/</loc></url>\n</urlset>\n`;
          this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap });
        }
      },
    },
  ],
});
