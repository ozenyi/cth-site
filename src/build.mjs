import { mkdir, writeFile, cp, rm } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { services } from "./content.mjs";
import {
  renderHome,
  renderService,
  renderContact,
  renderMentions,
  renderPrivacy,
  renderThanks,
  render404,
} from "./render.mjs";
import { site, pageUrl } from "../site.config.mjs";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist");
const manifest = JSON.parse(readFileSync(path.join(root, "assets/images/manifest.json"), "utf8"));

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

await cp(path.join(root, "assets/css"), path.join(dist, "css"), { recursive: true });
await cp(path.join(root, "assets/js"), path.join(dist, "js"), { recursive: true });
await cp(path.join(root, "assets/fonts"), path.join(dist, "fonts"), { recursive: true });
await cp(path.join(root, "assets/images"), path.join(dist, "images"), { recursive: true });
await cp(path.join(root, "assets/favicon.svg"), path.join(dist, "favicon.svg"));
await cp(path.join(root, "assets/apple-touch-icon.png"), path.join(dist, "apple-touch-icon.png"));

const pages = [
  ["index.html", renderHome(manifest)],
  ...services.map((service) => [service.file, renderService(service, manifest)]),
  ["contact.html", renderContact(manifest)],
  ["mentions-legales.html", renderMentions()],
  ["politique-de-confidentialite.html", renderPrivacy()],
  ["merci.html", renderThanks()],
  ["404.html", render404()],
];

for (const [file, html] of pages) {
  await writeFile(path.join(dist, file), html);
}

const indexable = pages.map(([file]) => file).filter((file) => file !== "merci.html" && file !== "404.html");
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexable.map((file) => `  <url><loc>${pageUrl(file)}</loc></url>`).join("\n")}
</urlset>
`;
await writeFile(path.join(dist, "sitemap.xml"), sitemap);
await writeFile(path.join(dist, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${site.siteUrl}/sitemap.xml\n`);
await writeFile(path.join(dist, ".nojekyll"), "");

console.log(`Site généré : ${pages.length} pages dans dist/`);
