import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { site, isRgeValid, fullAddress, pageUrl } from "../site.config.mjs";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist");
const errors = [];

function fail(message) {
  errors.push(message);
}

function read(file) {
  return readFileSync(path.join(dist, file), "utf8");
}

function contrast(hexA, hexB) {
  const lum = (hex) => {
    const n = hex.replace("#", "");
    const rgb = [0, 2, 4].map((i) => {
      const c = parseInt(n.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  };
  const [hi, lo] = [lum(hexA), lum(hexB)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}

if (!isRgeValid("2026-12-12", "2026-12-12")) fail("le 12/12/2026 doit encore afficher le RGE");
if (isRgeValid("2026-12-13", "2026-12-12")) fail("le 13/12/2026 ne doit plus afficher le RGE");
if (contrast("#ffffff", "#3f7a22") < 4.5) fail(`contraste bouton ${contrast("#ffffff", "#3f7a22").toFixed(2)}`);
if (contrast("#2f6218", "#f3f1eb") < 4.5) fail(`contraste kicker ${contrast("#2f6218", "#f3f1eb").toFixed(2)}`);
if (contrast("#161616", "#f7f6f2") < 4.5) fail("contraste texte");
if (contrast("#5c5c5c", "#f7f6f2") < 4.5) fail(`contraste texte secondaire ${contrast("#5c5c5c", "#f7f6f2").toFixed(2)}`);

const htmlFiles = readdirSync(dist).filter((file) => file.endsWith(".html"));
const required = [
  "index.html",
  "traitement-toiture.html",
  "facade.html",
  "ravalement.html",
  "isolation-combles.html",
  "menuiserie.html",
  "menuiserie-portail.html",
  "menuiserie-fenetres.html",
  "menuiserie-volets.html",
  "allees.html",
  "interieurs.html",
  "ventilation.html",
  "contact.html",
  "mentions-legales.html",
  "politique-de-confidentialite.html",
  "merci.html",
  "404.html",
  "sitemap.xml",
  "robots.txt",
];
for (const file of required) {
  if (!existsSync(path.join(dist, file))) fail(`manque ${file}`);
}

const servicePages = required.filter((file) => file.endsWith(".html") && !["index.html", "contact.html", "mentions-legales.html", "politique-de-confidentialite.html", "merci.html", "404.html"].includes(file));

for (const file of htmlFiles) {
  const html = read(file);
  if (!html.startsWith("<!DOCTYPE html>")) fail(`${file} sans doctype`);
  if (!html.includes('lang="fr"')) fail(`${file} sans lang`);
  if (!/<title>[^<]+<\/title>/.test(html)) fail(`${file} sans title`);
  if (!html.includes('name="description"')) fail(`${file} sans meta description`);
  if (!html.includes('rel="canonical"')) fail(`${file} sans canonique`);
  if (!html.includes('property="og:title"') || !html.includes('property="og:description"') || !html.includes('property="og:image"')) {
    fail(`${file} Open Graph incomplet`);
  }
  const h1 = html.match(/<h1[\s>]/g) || [];
  if (h1.length !== 1) fail(`${file} a ${h1.length} balise(s) h1`);
  if (!["merci.html", "404.html"].includes(file) && !html.includes("<h2")) fail(`${file} sans h2`);
  if (html.includes("Réseau CTH") || html.includes("reseaucth")) fail(`${file} cite le Réseau CTH`);
  if (/4[,.]6\s*\/\s*5|★|jpzpan|ghanem|adlyne45|sergejalladeau/i.test(html)) fail(`${file} contient un avis ou une note`);
  if (/500 chantiers|20 000|leader de la rénovation/i.test(html)) fail(`${file} contient un chiffre ou un slogan inventé`);
  if (html.includes("ozen.yigit@") || html.includes("06 03 07 34 20") || html.includes("cth45@orange.fr")) {
    fail(`${file} publie un contact non retenu`);
  }
  if (/href="\/|src="\/|srcset="\//.test(html)) fail(`${file} a un chemin absolu à la racine du domaine`);
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) checkUrl(file, match[1]);
  for (const match of html.matchAll(/(?:srcset|imagesrcset)="([^"]+)"/g)) {
    for (const part of match[1].split(",")) checkUrl(file, part.trim().split(/\s+/)[0]);
  }
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (!blocks.length) fail(`${file} sans JSON-LD`);
  for (const block of blocks) {
    try {
      JSON.parse(block[1]);
    } catch {
      fail(`${file} JSON-LD illisible`);
    }
  }
}

function checkUrl(file, url) {
  if (!url || url.startsWith("http") || url.startsWith("mailto:") || url.startsWith("tel:") || url.startsWith("#")) return;
  const clean = url.split("#")[0].split("?")[0];
  if (!clean) return;
  if (!existsSync(path.join(dist, clean))) fail(`${file} lien cassé : ${url}`);
}

const home = read("index.html");
if (!home.includes(site.slogan)) fail("slogan absent de l'accueil");
if (!home.includes('data-ba')) fail("accueil sans comparateur");
if (!home.includes(site.insuranceLabel)) fail("assurance absente");
if (!home.includes("valable jusqu'au 12/12/2026")) fail("mention de validité RGE absente");
if (!home.includes(site.rge.validUntil)) fail("date RGE absente du script");
if (!home.includes(site.hours.label)) fail("horaires absents");
for (const file of servicePages) {
  if (!read(file).includes('data-ba')) fail(`${file} sans comparateur`);
}

const contact = read("contact.html");
if (!contact.includes("https://formsubmit.co/cth45000@gmail.com")) fail("formulaire FormSubmit");
if (!contact.includes('name="_honey"')) fail("honeypot absent");
if (!contact.includes('name="consentement"')) fail("consentement absent");
if (!contact.includes("mailto:cth45000@gmail.com")) fail("secours mailto absent");
if (!contact.includes('name="_captcha" value="false"')) fail("captcha FormSubmit");

const mentions = read("mentions-legales.html");
for (const needle of [
  site.legalName,
  site.siret,
  site.tva,
  site.rcs,
  site.ape,
  site.gerant,
  site.capital,
  "GitHub Inc.",
  site.insuranceLabel,
  "[À COMPLÉTER]",
  fullAddress(),
]) {
  if (!mentions.includes(needle)) fail(`mentions sans ${needle}`);
}

const privacy = read("politique-de-confidentialite.html");
for (const needle of ["Formulaire de devis", "Durée de conservation", "Vos droits", "CNIL", "cookie", "[À COMPLÉTER]"]) {
  if (!privacy.toLowerCase().includes(needle.toLowerCase())) fail(`confidentialité sans ${needle}`);
}
if (privacy.includes("gtag") || privacy.includes("google-analytics") || home.includes("googletagmanager")) {
  fail("traceur détecté");
}

const ld = JSON.parse(home.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
const business = ld["@graph"].find((node) => [].concat(node["@type"]).includes("HomeAndConstructionBusiness"));
if (!business) fail("JSON-LD sans HomeAndConstructionBusiness");
if (business.address.streetAddress !== site.address.line) fail("JSON-LD n'utilise pas l'adresse de config");
if (business.aggregateRating) fail("note chiffrée dans le JSON-LD");
if (isRgeValid() && business.hasCredential?.validUntil !== site.rge.validUntil) fail("validUntil RGE absent du JSON-LD");

const sitemap = read("sitemap.xml");
if (!sitemap.includes(pageUrl("isolation-combles.html"))) fail("sitemap incomplet");
if (sitemap.includes("merci.html")) fail("merci dans le sitemap");
const robots = read("robots.txt");
if (!robots.includes(`${site.siteUrl}/sitemap.xml`)) fail("robots sans sitemap");

const realLegends = {
  "index.html": "Ravalement de façade — avant / après, chantier CTH",
  "ravalement.html": "Ravalement de façade — avant / après, chantier CTH",
  "traitement-toiture.html": "Traitement de toiture — avant / après, chantier CTH",
  "facade.html": "Façade — habillage d'étage, avant / après, chantier CTH",
  "isolation-combles.html": "Isolation des combles — avant / après, chantier CTH",
  "menuiserie-volets.html": "Volets roulants — avant / après, chantier CTH",
};
for (const [file, legend] of Object.entries(realLegends)) {
  const html = read(file);
  if (!html.includes(legend)) fail(`${file} sans la légende réelle`);
  if (html.includes("photo à venir")) fail(`${file} encore en emplacement vide`);
  if (html.includes("chantiers/accueil/")) fail(`${file} pointe encore vers les cadres d'accueil`);
}
if (!read("index.html").includes("images/chantiers/ravalement/apres-1600.webp")) fail("accueil sans la photo de ravalement");
if (!read("traitement-toiture.html").includes("images/chantiers/toiture/realisation-facade-1600.webp")) {
  fail("toiture sans la réalisation façade");
}
if (!read("traitement-toiture.html").includes("Même maison, deux prestations.")) fail("toiture sans la réalisation commune");
for (const file of [
  "allees.html",
  "interieurs.html",
  "ventilation.html",
  "menuiserie.html",
  "menuiserie-portail.html",
  "menuiserie-fenetres.html",
]) {
  if (!read(file).includes("photo à venir")) fail(`${file} devrait garder les cadres d'attente`);
}
if (read("facade.html").includes("chantiers/facade/pendant")) fail("façade avec une étape pendant inventée");
if (read("isolation-combles.html").includes("chantiers/isolation/pendant")) fail("combles avec une étape pendant inventée");
if (read("menuiserie-volets.html").includes("chantiers/volets/pendant")) fail("volets avec une étape pendant inventée");

function webpMeta(file) {
  const buf = readFileSync(file);
  if (buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WEBP") return "pas un webp";
  let offset = 12;
  while (offset + 8 <= buf.length) {
    const tag = buf.toString("ascii", offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    if (tag === "EXIF" || tag === "XMP ") return tag;
    offset += 8 + size + (size % 2);
  }
  return null;
}
for (const file of readdirSync(path.join(dist, "images/chantiers"), { recursive: true })) {
  if (!String(file).endsWith(".webp")) continue;
  const full = path.join(dist, "images/chantiers", file);
  const meta = webpMeta(full);
  if (meta) fail(`${file} contient ${meta}`);
  if (String(file).includes("1600") && readFileSync(full).length > 400_000) fail(`${file} trop lourd`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`OK — ${htmlFiles.length} pages, adresse « ${site.address.line} », RGE ${isRgeValid() ? "affiché" : "expiré"}.`);
