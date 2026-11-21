import { services } from "./content.mjs";
import {
  site,
  nav,
  isRgeValid,
  formatFrDate,
  fullAddress,
  pageUrl,
} from "../site.config.mjs";

export function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const logoSvg = `<svg class="logo-mark" viewBox="0 0 32 32" aria-hidden="true">
  <path d="M3 5.5 16 16 3 26.5" fill="none" stroke="#B5532F" stroke-width="3.6" stroke-linejoin="round" stroke-linecap="round"/>
  <path d="M12 5.5 25 16 12 26.5" fill="none" stroke="#B5532F" stroke-width="3.6" stroke-linejoin="round" stroke-linecap="round" opacity="0.55"/>
</svg>`;

function logo() {
  return `<a class="logo" href="index.html">
    ${logoSvg}
    <span><span class="logo-cth">CTH</span><span class="logo-sub">Centre Technique de l'Habitat</span></span>
  </a>`;
}

function rgeBoot() {
  return `<script>
(function () {
  var until = ${JSON.stringify(site.rge.validUntil)};
  try {
    var fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" });
    if (fmt.format(new Date()) > until) document.documentElement.setAttribute("data-rge", "expired");
  } catch (e) {}
})();
</script>`;
}

function rgeCleanup() {
  return `<script>
(function () {
  if (document.documentElement.getAttribute("data-rge") !== "expired") return;
  document.querySelectorAll('script[type="application/ld+json"]').forEach(function (node) {
    try {
      var data = JSON.parse(node.textContent);
      (data["@graph"] || [data]).forEach(function (item) {
        if (item && item.hasCredential) delete item.hasCredential;
      });
      node.textContent = JSON.stringify(data);
    } catch (e) {}
  });
})();
</script>`;
}

export function rgeBadge(extraClass = "") {
  const until = formatFrDate(site.rge.validUntil);
  const badge = `<aside class="rge ${extraClass}" data-rge>
    <span class="mark">RGE</span>
    <p><strong>RGE Qualibat n° ${esc(site.rge.number)}</strong>
    <span>${esc(site.rge.domains)}.</span>
    <small>valable jusqu'au ${esc(until)}</small></p>
  </aside>`;
  const expired = `<p class="form-note" ${isRgeValid() ? "data-rge-expired" : ""}>La qualification RGE Qualibat n° ${esc(site.rge.number)} est arrivée à échéance le ${esc(until)}. Elle n'est plus affichée tant qu'un renouvellement n'est pas confirmé.</p>`;
  if (!isRgeValid()) return expired;
  return badge + expired;
}

function current(file, href) {
  return file === href ? ' aria-current="page"' : "";
}

function header(file) {
  const links = nav
    .filter((item) => !item.home)
    .map((item) => {
      if (item.children) {
        const sub = item.children
          .map((child) => `<li><a href="${child.href}"${current(file, child.href)}>${esc(child.label)}</a></li>`)
          .join("");
        return `<li class="drop"><a href="${item.href}"${current(file, item.href)}>${esc(item.label)}</a><ul>${sub}</ul></li>`;
      }
      return `<li><a href="${item.href}"${current(file, item.href)}>${esc(item.label)}</a></li>`;
    })
    .join("");

  const panelLinks = nav
    .map((item) => {
      const sub = item.children
        ? `<ul class="sub">${item.children
            .map((child) => `<li><a href="${child.href}"${current(file, child.href)}>${esc(child.label)}</a></li>`)
            .join("")}</ul>`
        : "";
      return `<li><a href="${item.href}"${current(file, item.href)}>${esc(item.label)}</a>${sub}</li>`;
    })
    .join("");

  return `<a class="skip" href="#contenu">Aller au contenu</a>
  <div class="topbar">
    <header class="site-header">
      ${logo()}
      <a class="header-phone" href="tel:${site.phoneTel}">${esc(site.phoneDisplay)}</a>
      <a class="btn btn-primary btn-header" href="contact.html">Devis gratuit</a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="nav-panel">Menu</button>
    </header>
    <nav class="subnav" aria-label="Savoir-faire"><ul>${links}</ul></nav>
  </div>
  <div id="nav-panel" class="nav-panel" hidden>
    <div class="nav-panel-top">
      ${logo()}
      <button class="menu-toggle" type="button" data-close-menu>Fermer</button>
    </div>
    <nav aria-label="Menu"><ul>${panelLinks}</ul></nav>
    <p class="nav-meta">${esc(fullAddress())}<br><a href="tel:${site.phoneTel}">${esc(site.phoneDisplay)}</a><br>${esc(site.hours.label)}</p>
  </div>`;
}

function footer() {
  const savoir = nav
    .filter((item) => item.service)
    .map((item) => `<li><a href="${item.href}">${esc(item.label)}</a></li>`)
    .join("");
  return `<footer class="site-footer">
    <div class="wrap footer-grid">
      <div>
        ${logo()}
        <p>${esc(site.slogan)}</p>
        <p class="insure">${esc(site.insuranceLabel)}</p>
      </div>
      <div>
        <h2>Savoir-faire</h2>
        <ul>${savoir}</ul>
      </div>
      <div>
        <h2>Entreprise</h2>
        <ul>
          <li><a href="contact.html">Contactez-nous</a></li>
          <li><a href="mentions-legales.html">Mentions légales</a></li>
          <li><a href="politique-de-confidentialite.html">Politique de confidentialité</a></li>
          <li><a href="sitemap.xml">Plan du site</a></li>
          <li><a href="tel:${site.phoneTel}">${esc(site.phoneDisplay)}</a></li>
          <li><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></li>
        </ul>
        <p>Zone d'intervention : Orléans, Saint-Jean-de-Braye et les communes voisines du Loiret.</p>
        <p>${esc(fullAddress())}<br>${esc(site.hours.label)}<br>${esc(site.hours.closed)}</p>
      </div>
    </div>
    <div class="wrap fine">
      <p>${esc(site.legalName)}, ${esc(site.forme)} au capital de ${esc(site.capital)} · SIRET ${esc(site.siret)} · ${esc(site.rcs)}</p>
      <p>Siège à ${esc(site.address.city)}, Loiret, depuis ${esc(site.since)}. Photos d'illustration sous licence Pexels : <a href="images/LICENSES.txt">crédits</a>. Les photos de chantiers sont celles de CTH. <a href="sitemap.xml">Plan du site</a>.</p>
    </div>
  </footer>
  <div class="callbar">
    <a href="tel:${site.phoneTel}">Appeler</a>
    <a href="contact.html">Devis gratuit</a>
  </div>`;
}

function illu(manifest, name, eager = false) {
  const img = manifest.illustrations[name];
  const loading = eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"';
  return `<img src="${img.src}" srcset="${img.srcset}" sizes="100vw" width="${img.width}" height="${img.height}" alt="${esc(img.alt)}" ${loading} decoding="async">`;
}

function shot(manifest, slug, stage) {
  const img = manifest.chantiers[slug][stage];
  const srcset = img.srcset
    ? ` srcset="${img.srcset}" sizes="(min-width: 1200px) 1152px, 100vw"`
    : "";
  const focus = img.focus ? ` style="object-position: ${esc(img.focus)}"` : "";
  return `<img src="${img.src}"${srcset} width="${img.width}" height="${img.height}" alt="${esc(img.alt)}" loading="lazy" decoding="async"${focus}>`;
}

function stageList(manifest, slug, labels) {
  const pack = manifest.chantiers[slug];
  return labels
    .filter(([key]) => pack[key])
    .map(([key, label]) => `<li><figure>
        ${shot(manifest, slug, key)}
        <figcaption><strong>${label}</strong><span>${esc(pack[key].alt)}</span></figcaption>
      </figure></li>`)
    .join("");
}

export function comparaison(manifest, slug, options = {}) {
  const pack = manifest.chantiers[slug];
  const showStages = options.stages !== false;
  const showExtras = options.extras !== false;
  const labels = [
    ["avant", "Avant"],
    ["pendant", "Pendant"],
    ["apres", "Après"],
  ];
  const aspect = pack.aspect ? ` style="--ba: ${pack.aspect}"` : "";
  const extras = showExtras
    ? (pack.extra || [])
        .map(
          (img) => `<figure>
        <img src="${img.src}" srcset="${img.srcset}" sizes="(min-width: 800px) 36rem, 100vw" width="${img.width}" height="${img.height}" alt="${esc(img.alt)}" loading="lazy" decoding="async">
        <figcaption>${esc(img.caption)}</figcaption>
      </figure>`
        )
        .join("")
    : "";
  const extraBlock = extras
    ? `<h3 class="realisations-title">Même maison, deux prestations.</h3>
    <div class="realisations">${extras}</div>
    <p class="form-note">Toiture refaite, puis façade terminée. Chantier CTH.</p>`
    : "";
  const frames = showStages ? `<ul class="stages">${stageList(manifest, slug, labels)}</ul>` : "";

  if (pack.avant && pack.apres) {
    return `<div class="chantier"${aspect}>
    <div class="ba" data-ba>
      ${shot(manifest, slug, "apres")}
      <div class="ba-clip">${shot(manifest, slug, "avant")}</div>
      <span class="ba-handle" aria-hidden="true"></span>
      <p class="ba-label ba-label-avant">Avant</p>
      <p class="ba-label ba-label-apres">Après</p>
      <input type="range" min="0" max="100" value="56" aria-label="Comparer l'avant et l'après : ${esc(pack.legend)}">
    </div>
    ${frames}
    ${extraBlock}
  </div>`;
  }

  return `<div class="chantier photo-set"${aspect}>
    <ul class="stages">${stageList(manifest, slug, labels)}</ul>
  </div>`;
}

function linkedPhotos(manifest, pack) {
  return `<ul class="photo-links">${pack.links
    .map((item) => {
      const img = manifest.chantiers[item.slug][item.stage];
      return `<li><a href="${item.href}">
        <figure>
          ${shot(manifest, item.slug, item.stage)}
          <figcaption><strong>${esc(item.label)}</strong><span>${esc(img.alt)}</span></figcaption>
        </figure>
      </a></li>`;
    })
    .join("")}</ul>`;
}

function chantierHeading(pack) {
  if (pack.links) return "Portail, fenêtres, volets.";
  if (pack.avant && pack.apres) return pack.pendant ? "Avant, pendant, après." : "Avant, après.";
  if (pack.pendant && pack.apres) return "Pendant, après.";
  return "Chantier.";
}

function businessNode() {
  const node = {
    "@type": ["HomeAndConstructionBusiness", "LocalBusiness"],
    "@id": `${site.siteUrl}/#entreprise`,
    name: site.brand,
    legalName: site.legalName,
    slogan: site.slogan,
    url: `${site.siteUrl}/`,
    telephone: site.phoneTel,
    email: site.email,
    image: `${site.siteUrl}/images/og.jpg`,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.line,
      postalCode: site.address.postalCode,
      addressLocality: site.address.city,
      addressCountry: "FR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: site.address.latitude,
      longitude: site.address.longitude,
    },
    areaServed: [{ "@type": "AdministrativeArea", name: "Loiret" }, ...site.area.map((name) => ({ "@type": "City", name }))],
    foundingDate: "2011-07-01",
    vatID: site.tva,
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: site.hours.opens,
      closes: site.hours.closes,
    },
  };
  if (isRgeValid()) {
    node.hasCredential = {
      "@type": "EducationalOccupationalCredential",
      name: `RGE Qualibat ${site.rge.number}`,
      credentialCategory: "certification",
      recognizedBy: { "@type": "Organization", name: "Qualibat" },
      validUntil: site.rge.validUntil,
      description: site.rge.domains,
    };
  }
  return node;
}

function jsonLd(graph) {
  return `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": graph })}</script>`;
}

function crumbs(items) {
  const html = items
    .map((item, index) => {
      if (index === items.length - 1) return `<li aria-current="page">${esc(item.label)}</li>`;
      return `<li><a href="${item.href}">${esc(item.label)}</a></li>`;
    })
    .join('<li aria-hidden="true">/</li>');
  const data = {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: pageUrl(item.href),
    })),
  };
  return { html: `<nav class="crumbs" aria-label="Fil d'Ariane"><ol>${html}</ol></nav>`, data };
}

export function layout({
  file,
  title,
  description,
  body,
  graph,
  robots = "index,follow",
  preload = "",
  mainClass = "",
}) {
  const canonical = pageUrl(file);
  const fullTitle = file === "index.html" ? title : `${title} | CTH`;
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(fullTitle)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${canonical}">
  <meta name="robots" content="${robots}">
  <meta name="theme-color" content="#2B2B2B">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${esc(site.brand)}">
  <meta property="og:title" content="${esc(fullTitle)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${site.siteUrl}/images/og.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
  <link rel="preload" href="fonts/inter-400.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="fonts/noto-serif-700.woff2" as="font" type="font/woff2" crossorigin>
  ${preload}
  <link rel="stylesheet" href="css/styles.css">
  ${rgeBoot()}
  ${jsonLd(graph)}
</head>
<body>
  ${header(file)}
  <main id="contenu" class="${mainClass}">
    ${body}
  </main>
  ${footer()}
  ${rgeCleanup()}
  <script src="js/main.js" defer></script>
</body>
</html>
`;
}

export function renderHome(manifest) {
  const cards = [
    ["traitement-toiture.html", "couverture", "Traitement de toiture", "Démoussage, protection, gouttières."],
    ["facade.html", "facade", "Façade", "Nettoyage, traitement, hydrofuge."],
    ["ravalement.html", "ravalement", "Ravalement", "Reprise d'enduit et finition."],
    ["isolation-combles.html", "isolation-combles", "Isolation des combles", "Combles perdus et murs par l'extérieur."],
    ["menuiserie.html", "menuiserie-volets-roulants", "Menuiserie", "Portail, fenêtres, volets roulants."],
    ["allees.html", "allees", "Allées", "Cours, dallages, cheminements."],
    ["interieurs.html", "interieurs", "Intérieurs", "Peinture, sols, remises en état."],
    ["ventilation.html", "ventilations", "Ventilation", "Air neuf, bouches, VMC."],
  ]
    .map(([href, slug, title, text]) => {
      const img = manifest.chantiers[slug].apres;
      return `<li><a class="service-card" href="${href}">
        <div class="media"><img src="${img.src}" srcset="${img.srcset}" sizes="(min-width: 1080px) 30vw, (min-width: 720px) 45vw, 100vw" width="${img.width}" height="${img.height}" alt="${esc(img.alt)}" loading="lazy" decoding="async"></div>
        <div><h3>${esc(title)}</h3><p>${esc(text)}</p></div>
      </a></li>`;
    })
    .join("");

  const tabs = [
    ["ravalement", "Ravalement"],
    ["couverture", "Toiture"],
    ["facade", "Façade"],
    ["isolation-combles", "Combles"],
    ["menuiserie-volets-roulants", "Volets roulants"],
  ];
  const tabButtons = tabs
    .map(
      ([slug, label], index) =>
        `<button type="button" role="tab" id="tab-${slug}" aria-controls="panel-${slug}" aria-selected="${index === 0 ? "true" : "false"}" tabindex="${index === 0 ? "0" : "-1"}">${label}</button>`
    )
    .join("");
  const tabPanels = tabs
    .map(([slug]) => {
      const pack = manifest.chantiers[slug];
      return `<div role="tabpanel" id="panel-${slug}" aria-labelledby="tab-${slug}">
        <p class="chantier-legend">${esc(pack.legend)}.</p>
        ${comparaison(manifest, slug, { stages: false, extras: false })}
      </div>`;
    })
    .join("");

  const zones = site.area.map((name) => `<li>${esc(name)}</li>`).join("");
  const hero = manifest.chantiers.couverture.apres;
  const body = `
    <section class="hero hero-home">
      <img src="${hero.src}" srcset="${hero.srcset}" sizes="100vw" width="${hero.width}" height="${hero.height}" alt="${esc(hero.alt)}" loading="eager" fetchpriority="high" decoding="async" style="object-position: 68% center">
      <p class="photo-note">Chantier CTH</p>
      <div class="hero-copy">
        <p class="kicker">Saint-Jean-de-Braye · Loiret · depuis ${esc(site.since)}</p>
        <h1>Centre Technique de l'Habitat (CTH)</h1>
        <p class="slogan">${esc(site.slogan)}</p>
        <p class="lead">Toiture, façade, ravalement, isolation, menuiserie, allées, intérieurs et ventilation. Un devis écrit, après la visite.</p>
        <div class="actions">
          <a class="btn btn-primary" href="contact.html">Demander un devis gratuit</a>
          <a class="btn btn-line" href="tel:${site.phoneTel}">${esc(site.phoneDisplay)}</a>
        </div>
        ${rgeBadge()}
      </div>
    </section>
    <section class="trust" aria-label="Repères">
      <article><strong>Siège à Saint-Jean-de-Braye</strong><span>${esc(site.address.line)}<br>${esc(site.address.postalCode)} ${esc(site.address.city)}</span></article>
      <article><strong>Entreprise du Loiret depuis ${esc(site.since)}</strong><span>Immatriculée le ${esc(site.immatriculation)}</span></article>
      <article><strong>Devis gratuit</strong><span>Écrit, après une visite. Sans engagement.</span></article>
      <article><strong>${esc(site.hours.label)}</strong><span>${esc(site.hours.closed)}</span></article>
    </section>
    <section class="section">
      <div class="wrap">
        <div class="section-head reveal">
          <p class="kicker">Savoir-faire</p>
          <h2>Huit gestes, une maison.</h2>
          <p>Pas un catalogue national. Les ouvrages que CTH mène vraiment, de la couverture jusqu'à l'air de la maison.</p>
        </div>
        <ul class="service-grid">${cards}</ul>
      </div>
    </section>
    <section class="section" style="padding-top:0">
      <div class="wrap split">
        <div class="reveal">
          <p class="kicker">Façon de faire</p>
          <h2>Court, clair, sur place.</h2>
          <p>Le devis ne se devine pas au téléphone. On voit la maison, on écrit ce qui sera fait, on réalise, on vous laisse un chantier rangé.</p>
        </div>
        <ol class="steps reveal">
          <li><h3>1. L'appel</h3><p>Commune, ouvrage, ce que vous constatez. Un rendez-vous en semaine.</p></li>
          <li><h3>2. La visite</h3><p>Relevé et points de vigilance. On dit aussi quand ce n'est pas le bon chantier.</p></li>
          <li><h3>3. Le devis</h3><p>Écrit, détaillé, gratuit. Les travaux attendent votre accord.</p></li>
          <li><h3>4. Le chantier</h3><p>Protection des abords, réalisation, explication de ce qui a été fait.</p></li>
        </ol>
      </div>
    </section>
    <section class="section chantiers-home">
      <div class="wrap">
        <div class="section-head">
          <p class="kicker">Chantiers</p>
          <h2>Avant, après.</h2>
          <p>Cinq chantiers CTH. Le curseur compare l'avant et l'après. Aucun lieu, aucune date, aucun client n'est nommé.</p>
        </div>
        <div class="chantier-tabs" data-chantier-tabs>
          <div role="tablist" aria-label="Chantiers avant et après">${tabButtons}</div>
          ${tabPanels}
        </div>
      </div>
    </section>
    <section class="section">
      <div class="wrap">
        <div class="section-head">
          <p class="kicker">Secteur</p>
          <h2>Orléans et Saint-Jean-de-Braye.</h2>
          <p>À partir du siège. Au-delà de ces communes, le déplacement se confirme par téléphone.</p>
        </div>
        <ul class="zones">${zones}</ul>
        <p class="form-note">Aucun avis n'est publié ici. Une référence se donne avec l'accord du client.</p>
      </div>
    </section>
    <section class="cta-final">
      <div class="wrap">
        <p class="kicker">Devis</p>
        <h2>Demander un devis gratuit</h2>
        <p>Visite sur place, devis écrit, sans engagement. ${esc(site.hours.label)}.</p>
        <div class="actions">
          <a class="btn btn-primary" href="contact.html">Demander un devis gratuit</a>
          <a class="btn btn-line" href="tel:${site.phoneTel}">${esc(site.phoneDisplay)}</a>
        </div>
      </div>
    </section>`;

  return layout({
    file: "index.html",
    title: `CTH | ${site.slogan}`,
    description:
      "CTH, Centre Technique de l'Habitat à Saint-Jean-de-Braye : toiture, façade, ravalement, isolation, menuiserie, allées et ventilation dans le Loiret. Devis gratuit.",
    body,
    graph: [businessNode()],
    preload: `<link rel="preload" as="image" href="${hero.src}" imagesrcset="${hero.srcset}" imagesizes="100vw">`,
  });
}

export function renderService(service, manifest) {
  const prestations = service.prestations
    .map((item) => `<li><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p></li>`)
    .join("");
  const etapes = service.etapes
    .map(([title, text]) => `<li><h3>${esc(title)}</h3><p>${esc(text)}</p></li>`)
    .join("");
  const faqs = service.faqs
    .map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`)
    .join("");
  const rge = service.rge
    ? `<p data-rge><strong>Qualification en cours.</strong> RGE Qualibat n° ${esc(site.rge.number)}, valable jusqu'au ${esc(formatFrDate(site.rge.validUntil))} : ${esc(service.rge)}</p>`
    : "";
  const crumb = crumbs([
    { href: "index.html", label: "Accueil" },
    { href: service.file, label: service.kicker.replace(" · ", " — ") },
  ]);
  const others = services
    .filter((item) => item.file !== service.file && !item.file.includes("menuiserie-"))
    .slice(0, 3)
    .map((item) => `<a href="${item.file}">${esc(item.kicker.split(" · ").pop())} <span aria-hidden="true">→</span></a>`)
    .join("");
  const children = service.children
    ? `<nav class="related" aria-label="Pages menuiserie">
        <a href="menuiserie-portail.html">Portail <span aria-hidden="true">→</span></a>
        <a href="menuiserie-fenetres.html">Fenêtres <span aria-hidden="true">→</span></a>
        <a href="menuiserie-volets.html">Volets roulants <span aria-hidden="true">→</span></a>
      </nav>`
    : "";
  const body = `
    ${crumb.html}
    <section class="page-hero">
      ${illu(manifest, service.illustration)}
      <p class="photo-note">Photo d'illustration</p>
      <div class="page-hero-copy">
        <p class="kicker">${esc(service.kicker)}</p>
        <h1>${esc(service.h1)}</h1>
        <p class="lead">${esc(service.lead)}</p>
        <div class="actions">
          <a class="btn btn-primary" href="contact.html?projet=${esc(service.projet)}">Devis gratuit</a>
          <a class="btn btn-line" href="tel:${site.phoneTel}">${esc(site.phoneDisplay)}</a>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="wrap split">
        <div class="prose reveal">
          <h2>Ce que nous faisons</h2>
          ${service.intro.map((p) => `<p>${esc(p)}</p>`).join("")}
          ${rge}
          ${children}
        </div>
        <div class="card-quiet reveal">
          <h2>Pour en parler</h2>
          <p>${esc(fullAddress())}</p>
          <p><a href="tel:${site.phoneTel}">${esc(site.phoneDisplay)}</a><br>${esc(site.hours.label)}</p>
          <a class="btn btn-primary" href="contact.html?projet=${esc(service.projet)}">Décrire mon projet</a>
        </div>
      </div>
    </section>
    <section class="section" style="padding-top:0">
      <div class="wrap">
        <h2>Prestations</h2>
        <ul class="prestations">${prestations}</ul>
      </div>
    </section>
    <section class="section" style="background:var(--cream)">
      <div class="wrap">
        <h2>Déroulé</h2>
        <ol class="steps">${etapes}</ol>
      </div>
    </section>
    <section class="section">
      <div class="wrap">
        <div class="section-head">
          <p class="kicker">Chantier</p>
          <h2>${chantierHeading(manifest.chantiers[service.chantier])}</h2>
          <p>${esc(manifest.chantiers[service.chantier].legend)}.</p>
        </div>
        ${
          manifest.chantiers[service.chantier].links
            ? linkedPhotos(manifest, manifest.chantiers[service.chantier])
            : comparaison(manifest, service.chantier)
        }
      </div>
    </section>
    <section class="section" style="padding-top:0">
      <div class="wrap">
        <h2>Questions fréquentes</h2>
        <div class="faq">${faqs}</div>
      </div>
    </section>
    <section class="section cta-band">
      <div class="wrap">
        <h2>Un devis, après la visite.</h2>
        <div class="actions">
          <a class="btn btn-primary" href="contact.html?projet=${esc(service.projet)}">Devis gratuit</a>
          <a class="btn btn-line-dark" href="tel:${site.phoneTel}">${esc(site.phoneDisplay)}</a>
        </div>
        <nav class="related" aria-label="Autres ouvrages">${others}</nav>
      </div>
    </section>`;

  const graph = [
    businessNode(),
    crumb.data,
    {
      "@type": "Service",
      name: service.title,
      serviceType: service.kicker,
      provider: { "@id": `${site.siteUrl}/#entreprise` },
      areaServed: { "@type": "AdministrativeArea", name: "Loiret" },
      url: pageUrl(service.file),
    },
  ];
  return layout({
    file: service.file,
    title: service.title,
    description: service.description,
    body,
    graph,
  });
}

const projets = [
  ["toiture", "Traitement de toiture"],
  ["facade", "Façade"],
  ["ravalement", "Ravalement"],
  ["isolation", "Isolation des combles"],
  ["portail", "Portail"],
  ["fenetres", "Fenêtres"],
  ["volets", "Volets roulants"],
  ["allees", "Allées"],
  ["interieurs", "Intérieurs"],
  ["ventilation", "Ventilation"],
  ["autre", "Autre / je ne sais pas encore"],
];

export function renderContact(manifest) {
  const options = projets.map(([value, label]) => `<option value="${value}">${esc(label)}</option>`).join("");
  const crumb = crumbs([
    { href: "index.html", label: "Accueil" },
    { href: "contact.html", label: "Contactez-nous" },
  ]);
  const map = `https://www.openstreetmap.org/?mlat=${site.address.latitude}&mlon=${site.address.longitude}#map=18/${site.address.latitude}/${site.address.longitude}`;
  const body = `
    ${crumb.html}
    <section class="page-hero">
      ${illu(manifest, "contact")}
      <p class="photo-note">Photo d'illustration</p>
      <div class="page-hero-copy">
        <p class="kicker">Contact</p>
        <h1>Décrivez la maison. On vous répond.</h1>
        <p class="lead">Un formulaire court, ou un appel. ${esc(site.hours.label)}. ${esc(site.hours.closed)}</p>
      </div>
    </section>
    <div class="wrap layout contact-grid">
      <form class="card-quiet" action="https://formsubmit.co/${site.email}" method="POST" accept-charset="UTF-8">
        <h2>Devis gratuit</h2>
        <input type="hidden" name="_subject" value="Demande de devis — site CTH">
        <input type="hidden" name="_captcha" value="false">
        <input type="hidden" name="_template" value="table">
        <input type="hidden" name="_next" value="${pageUrl("merci.html")}">
        <div class="hp" aria-hidden="true">
          <label for="company-website">Site web</label>
          <input id="company-website" type="text" name="_honey" tabindex="-1" autocomplete="off">
        </div>
        <label for="nom">Nom<input id="nom" name="nom" autocomplete="name" required></label>
        <label for="telephone">Téléphone<input id="telephone" name="telephone" type="tel" inputmode="tel" autocomplete="tel" required></label>
        <label for="email">E-mail<input id="email" name="email" type="email" autocomplete="email" required></label>
        <label for="commune">Commune<input id="commune" name="commune" autocomplete="address-level2" required></label>
        <label for="projet">Projet
          <select id="projet" name="projet" required>
            <option value="">Choisir</option>
            ${options}
          </select>
        </label>
        <label for="message">Message <span style="font-weight:400;color:var(--muted)">(facultatif)</span>
          <textarea id="message" name="message" maxlength="2000"></textarea>
        </label>
        <label class="check" for="consentement">
          <input id="consentement" type="checkbox" name="consentement" value="oui" required>
          <span>J'accepte que CTH utilise ces informations pour répondre à ma demande. <a href="politique-de-confidentialite.html">Politique de confidentialité</a>.</span>
        </label>
        <button class="btn btn-primary" type="submit">Envoyer la demande</button>
        <p class="form-note">Le message part vers ${esc(site.email)}. Si vous préférez, <a href="mailto:${esc(site.email)}?subject=Demande%20de%20devis">écrivez-nous directement</a>.</p>
      </form>
      <aside>
        <div class="card-quiet">
          <h2>CTH</h2>
          <p>${esc(site.legalName)}<br>${esc(fullAddress())}</p>
          <p><a href="tel:${site.phoneTel}">${esc(site.phoneDisplay)}</a><br><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></p>
          <p>${esc(site.hours.label)}<br>${esc(site.hours.closed)}</p>
          <p><a href="${map}" rel="noopener noreferrer">Voir le plan</a></p>
          <p class="form-note">${esc(site.insuranceLabel)}</p>
          ${rgeBadge("rge-on-light")}
        </div>
      </aside>
    </div>`;
  return layout({
    file: "contact.html",
    title: "Contact et devis gratuit",
    description: `Demandez un devis à CTH, ${fullAddress()}. Téléphone ${site.phoneDisplay}.`,
    body,
    graph: [businessNode(), crumb.data],
  });
}

export function renderMentions() {
  const until = formatFrDate(site.rge.validUntil);
  const crumb = crumbs([
    { href: "index.html", label: "Accueil" },
    { href: "mentions-legales.html", label: "Mentions légales" },
  ]);
  const body = `
    ${crumb.html}
    <article class="wrap legal">
      <p class="kicker">Informations</p>
      <h1>Mentions légales</h1>
      <h2>Éditeur</h2>
      <p>${esc(site.legalName)} (sigle ${esc(site.sigle)}), ${esc(site.forme)} au capital de ${esc(site.capital)}.</p>
      <p>Siège : ${esc(fullAddress())}.</p>
      <p>L'adresse affichée sur ce site est définie à un seul endroit, le fichier de configuration. Les sources publiques hésitent entre « 7 » et « 7 bis » rue Bernard Palissy : la formulation retenue ici est « ${esc(site.address.line)} ».</p>
      <p>RCS : ${esc(site.rcs)}. SIREN ${esc(site.siren)}. SIRET ${esc(site.siret)}. TVA intracommunautaire ${esc(site.tva)}. Code APE ${esc(site.ape)} (${esc(site.apeLabel)}).</p>
      <p>Activité déclarée : ${esc(site.activite)}.</p>
      <p>Immatriculation au RCS d'Orléans le ${esc(site.immatriculation)}.</p>
      <h2>Directeur de la publication</h2>
      <p>${esc(site.gerant)}, gérant.</p>
      <h2>Contact</h2>
      <p>Téléphone : <a href="tel:${site.phoneTel}">${esc(site.phoneDisplay)}</a>. E-mail : <a href="mailto:${esc(site.email)}">${esc(site.email)}</a>. ${esc(site.hours.label)}. ${esc(site.hours.closed)}</p>
      <h2>Hébergeur</h2>
      <p>${esc(site.host.name)}, ${esc(site.host.address)}. Site diffusé par ${esc(site.host.service)}.</p>
      <h2>Assurance</h2>
      <p>${esc(site.insuranceLabel)}. Libellé issu du certificat Qualibat. L'attestation d'assurance elle-même n'est pas reproduite sur ce site.</p>
      <h2>Certification</h2>
      <p data-rge>RGE Qualibat n° ${esc(site.rge.number)} — ${esc(site.rge.domains)}. valable jusqu'au ${esc(until)}.</p>
      <p data-rge-expired>La qualification RGE Qualibat n° ${esc(site.rge.number)} est arrivée à échéance le ${esc(until)}. Elle n'est plus affichée tant qu'un renouvellement n'est pas confirmé.</p>
      <h2>Médiateur de la consommation</h2>
      <p>[À COMPLÉTER]</p>
      <h2>Propriété intellectuelle</h2>
      <p>Les textes de ce site sont ceux de ${esc(site.legalName)}. Les photos pleine largeur d'ambiance des pages de savoir-faire sont des illustrations libres de droits (licence Pexels) ; les auteurs sont listés dans le fichier <a href="images/LICENSES.txt">images/LICENSES.txt</a>. Ce ne sont pas des chantiers de CTH. Les comparateurs avant / après des pages toiture, façade, ravalement, isolation des combles et volets roulants, ainsi que les photos de portail, de fenêtres, d'allées, d'intérieurs et de ventilation, sont des chantiers de l'entreprise.</p>
      <p>Le logo texte (chevron terracotta, lettres CTH) est une version provisoire, dans l'esprit du logo existant. Le fichier source du logo suivra.</p>
    </article>`;
  return layout({
    file: "mentions-legales.html",
    title: "Mentions légales",
    description: `Mentions légales de ${site.legalName}, ${fullAddress()}. SIRET ${site.siret}.`,
    body,
    graph: [businessNode(), crumb.data],
  });
}

export function renderPrivacy() {
  const crumb = crumbs([
    { href: "index.html", label: "Accueil" },
    { href: "politique-de-confidentialite.html", label: "Politique de confidentialité" },
  ]);
  const body = `
    ${crumb.html}
    <article class="wrap legal">
      <p class="kicker">Vie privée</p>
      <h1>Politique de confidentialité</h1>
      <p>Cette page décrit ce que ${esc(site.legalName)} fait des informations laissées sur ce site. Il n'y a pas de cookie de mesure d'audience, pas de publicité, pas de bandeau de consentement aux traceurs : rien de ce genre n'est déposé.</p>
      <h2>Responsable du traitement</h2>
      <p>${esc(site.legalName)}, ${esc(fullAddress())}. Contact : <a href="mailto:${esc(site.email)}">${esc(site.email)}</a>, <a href="tel:${site.phoneTel}">${esc(site.phoneDisplay)}</a>. Gérant : ${esc(site.gerant)}.</p>
      <h2>Formulaire de devis</h2>
      <p>Le formulaire demande le nom, le téléphone, l'e-mail, la commune, le type de projet et, si vous le souhaitez, un message. Un champ invisible sert de leurre anti-spam. La case à cocher enregistre votre accord.</p>
      <p>Finalité : répondre à la demande de devis et, le cas échéant, préparer la visite. Base : votre consentement, et les mesures précontractuelles que vous demandez.</p>
      <p>Le formulaire est envoyé au service FormSubmit (formsubmit.co), qui transmet le message par e-mail à ${esc(site.email)}. Ce transit peut avoir lieu hors de l'Union européenne. FormSubmit est un prestataire d'acheminement ; CTH ne tient pas ses serveurs. Garanties contractuelles détaillées de ce transfert : [À COMPLÉTER].</p>
      <p>Vous pouvez aussi écrire sans formulaire, à la même adresse e-mail.</p>
      <h2>Durée de conservation</h2>
      <p>CTH conserve la demande le temps de l'étudier et, si un chantier suit, pendant la relation commerciale et les délais légaux qui s'y attachent (comptabilité, garanties). La durée précise appliquée en interne aux demandes sans suite : [À COMPLÉTER].</p>
      <p>La durée éventuelle de journalisation chez FormSubmit ou chez l'hébergeur n'est pas fixée par CTH.</p>
      <h2>Hébergement et journaux</h2>
      <p>Le site est hébergé par ${esc(site.host.name)} (${esc(site.host.service)}), ${esc(site.host.address)}. L'hébergeur peut conserver des journaux techniques (adresse IP, date, page consultée) pour la sécurité du service, selon sa propre politique.</p>
      <h2>Cookies</h2>
      <p>Ce site ne dépose pas de cookie de suivi, pas d'outil de statistique tiers, pas de pixel publicitaire. Le comparateur avant / après et le menu fonctionnent dans la page, sans mémoriser de profil.</p>
      <h2>Vos droits</h2>
      <p>Vous pouvez demander l'accès à vos informations, leur rectification, leur effacement, la limitation du traitement, et vous opposer à celui-ci. Vous pouvez aussi demander la portabilité des informations que vous avez fournies, et retirer votre consentement.</p>
      <p>Écrivez à <a href="mailto:${esc(site.email)}">${esc(site.email)}</a>. Si la réponse ne vous convient pas, vous pouvez saisir la CNIL, 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, ou via cnil.fr.</p>
      <h2>Destinataires</h2>
      <p>Les messages sont lus par CTH pour répondre au devis. Ils ne sont pas vendus. FormSubmit les achemine. Aucun autre destinataire n'est prévu. Sous-traitants internes éventuels : [À COMPLÉTER].</p>
    </article>`;
  return layout({
    file: "politique-de-confidentialite.html",
    title: "Politique de confidentialité",
    description:
      "Politique de confidentialité de CTH : formulaire de devis, durée de conservation, droits RGPD. Pas de cookie de suivi.",
    body,
    graph: [businessNode(), crumb.data],
  });
}

export function renderThanks() {
  const body = `<article class="wrap thanks">
      <p class="kicker">Message</p>
      <h1>Votre demande est partie.</h1>
      <p>CTH la lit à ${esc(site.email)} et vous recontacte par téléphone ou par e-mail, du lundi au vendredi.</p>
      <p>Si vous n'avez pas de nouvelles, appelez le <a href="tel:${site.phoneTel}">${esc(site.phoneDisplay)}</a> ou écrivez à <a href="mailto:${esc(site.email)}">${esc(site.email)}</a>.</p>
      <p><a class="btn btn-primary" href="index.html">Retour à l'accueil</a></p>
    </article>`;
  return layout({
    file: "merci.html",
    title: "Demande envoyée",
    description: "Votre demande de devis a été envoyée à CTH, Centre Technique de l'Habitat.",
    body,
    graph: [businessNode()],
    robots: "noindex,follow",
  });
}

export function render404() {
  const body = `<article class="wrap missing">
      <p class="kicker">404</p>
      <h1>Cette page n'est pas là.</h1>
      <p>Le lien est ancien ou incomplet. Les ouvrages de CTH sont sur l'accueil.</p>
      <p><a class="btn btn-primary" href="index.html">Aller à l'accueil</a></p>
    </article>`;
  return layout({
    file: "404.html",
    title: "Page introuvable",
    description: "Page introuvable sur le site de CTH, Centre Technique de l'Habitat.",
    body,
    graph: [businessNode()],
    robots: "noindex,follow",
  });
}
