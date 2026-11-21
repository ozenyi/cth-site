/**
 * CTH — réglages du site.
 * L'adresse, l'URL canonique, le RGE et l'assurance se changent ici.
 * Puis : node src/build.mjs
 *
 * Adresse : les sources publiques hésitent entre « 7 » et « 7 bis »
 * rue Bernard Palissy. La ligne `address.line` est la seule valeur publiée.
 */

export const site = {
  siteUrl: "https://ozenyi.github.io/cth-site",
  timezone: "Europe/Paris",
  brand: "CTH Centre Technique de l'Habitat",
  slogan: "L'artisanat au service de votre habitat",
  legalName: "CENTRE TECHNIQUE DE L'HABITAT",
  sigle: "CTH",
  forme: "SARL",
  capital: "25 000 €",
  siren: "533 059 010",
  siret: "533 059 010 00033",
  tva: "FR25533059010",
  rcs: "533 059 010 R.C.S. Orléans",
  ape: "43.29A",
  apeLabel: "Travaux d'isolation",
  activite:
    "Isolation des combles perdus, traitement des toitures, menuiseries, façades et charpente",
  gerant: "Ozen YIGIT",
  since: "2011",
  immatriculation: "21 juin 2011",
  phoneDisplay: "02 38 64 60 07",
  phoneTel: "+33238646007",
  email: "cth45000@gmail.com",
  address: {
    line: "7 rue Bernard Palissy",
    postalCode: "45800",
    city: "Saint-Jean-de-Braye",
    // Point INSEE du n° 7. À revoir si le bâtiment change.
    latitude: 47.915516147,
    longitude: 1.9419218801,
  },
  hours: {
    label: "Lundi – vendredi, 9h–17h",
    closed: "Samedi et dimanche : fermé",
    opens: "09:00",
    closes: "17:00",
  },
  insuranceLabel: "Assurance responsabilité travaux et RC : VHV, police H844-4031",
  rge: {
    number: "E-E95447",
    validUntil: "2026-12-12",
    domains:
      "isolation des murs par l'extérieur, isolation des combles perdus, fenêtres, volets et portes",
  },
  host: {
    name: "GitHub Inc.",
    address: "88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis",
    service: "GitHub Pages",
  },
  area: [
    "Saint-Jean-de-Braye",
    "Orléans",
    "Olivet",
    "Fleury-les-Aubrais",
    "Saran",
    "Saint-Jean-de-la-Ruelle",
    "Chécy",
    "Boigny-sur-Bionne",
    "Semoy",
    "Mardié",
    "Combleux",
    "Ingré",
    "La Chapelle-Saint-Mesmin",
    "Saint-Denis-en-Val",
    "Saint-Pryvé-Saint-Mesmin",
    "Ormes",
  ],
};

export const nav = [
  { href: "index.html", label: "Accueil", home: true },
  { href: "traitement-toiture.html", label: "Traitement de toiture", service: true },
  { href: "facade.html", label: "Façade", service: true },
  { href: "ravalement.html", label: "Ravalement", service: true },
  { href: "isolation-combles.html", label: "Isolation des combles", service: true },
  {
    href: "menuiserie.html",
    label: "Menuiserie",
    service: true,
    children: [
      { href: "menuiserie-portail.html", label: "Portail" },
      { href: "menuiserie-fenetres.html", label: "Fenêtres" },
      { href: "menuiserie-volets.html", label: "Volets roulants" },
    ],
  },
  { href: "allees.html", label: "Allées", service: true },
  { href: "interieurs.html", label: "Intérieurs", service: true },
  { href: "ventilation.html", label: "Ventilation", service: true },
  { href: "contact.html", label: "Contactez-nous" },
];

export function todayInParis(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: site.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Inclusif : le badge reste visible le jour de validUntil, fuseau Europe/Paris. */
export function isRgeValid(today = todayInParis(), until = site.rge.validUntil) {
  return today <= until;
}

export function formatFrDate(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function fullAddress() {
  const a = site.address;
  return `${a.line}, ${a.postalCode} ${a.city}`;
}

export function pageUrl(file) {
  if (!file || file === "index.html") return `${site.siteUrl}/`;
  return `${site.siteUrl}/${file}`;
}
