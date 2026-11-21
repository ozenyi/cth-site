# CTH — Centre Technique de l'Habitat

Site vitrine statique de **CTH**, entreprise de Saint-Jean-de-Braye (Loiret). Il est prévu pour GitHub Pages, à l'adresse <https://ozenyi.github.io/cth-site/>, et pour un domaine propre plus tard.

Les textes, l'adresse, le téléphone, le RGE et l'assurance viennent de `site.config.mjs`. On ne les répète pas dans les pages.

## Première mise en ligne

Le workflow `.github/workflows/pages.yml` construit `dist/` et le publie. GitHub n'accepte ce déploiement qu'après un réglage unique, que le jeton du workflow ne peut pas faire seul :

1. Dépôt GitHub → **Settings** → **Pages**.
2. **Build and deployment** → **Source** : **GitHub Actions**.
3. Relancer le workflow **Pages** sur la branche `main`.

L'adresse est alors <https://ozenyi.github.io/cth-site/>.

## Générer le site

```bash
node src/build.mjs
```

Le résultat est dans `dist/`. Pour le voir :

```bash
python3 -m http.server 4173 --directory dist
```

Les tests (`node tests/check.mjs`) vérifient les pages, les liens, l'adresse, le badge RGE et l'absence d'avis inventés. Ils reconstruisent d'abord le site avec `npm test`.

## Remplacer les photos

Deux familles, à ne pas mélanger.

### Illustrations (licence Pexels)

`assets/images/illustrations/` sert les grandes photos d'ambiance. Ce ne sont **pas** des chantiers CTH. Les auteurs sont dans `assets/images/LICENSES.txt`.

Pour en changer une, gardez le nom (`toiture-1600.webp` et `toiture-800.webp`) ou mettez à jour `assets/images/manifest.json` (chemin, largeur, hauteur, texte alternatif). Le texte alternatif doit continuer à dire que c'est une illustration.

### Chantiers

Les photos de chantiers sont des WebP (largeur max 1600 px, variante 800 px), sans métadonnées. Le fichier plein s'appelle `avant.webp`, `pendant.webp` ou `apres.webp`.

| Page | Dossier | Phases |
|---|---|---|
| Accueil et Ravalement | `chantiers/ravalement` | avant, pendant, après |
| Traitement de toiture | `chantiers/couverture` | avant, pendant, après |
| Traitement de toiture, en plus | `chantiers/toiture/realisation-toiture`, `realisation-facade` | même maison, deux prestations |
| Façade | `chantiers/facade` | avant, après |
| Isolation des combles | `chantiers/isolation-combles` | avant, après |
| Volets roulants | `chantiers/menuiserie-volets-roulants` | avant, après |
| Portail | `chantiers/menuiserie-portail` | après seulement |
| Fenêtres | `chantiers/menuiserie-fenetres` | après seulement |
| Allées | `chantiers/allees` | après seulement, recadrée |
| Intérieurs | `chantiers/interieurs` | après seulement |
| Ventilation | `chantiers/ventilations` | pendant, après — pas un avant / après |

Une seule phase s'affiche en photo, pas en comparateur. L'accueil groupe les cinq comparateurs dans des onglets.

`scripts/prepare_chantiers.py` régénère les WebP réels à partir de l'archive JPEG (hors dépôt). Il retire l'EXIF et masque visages, plaques et numéros de rue. Ne le relancez pas sans les originaux. `scripts/prepare_images.py` ne réécrit pas une série déjà marquée `real` dans le manifeste.

## Logo

Le logo du site est un mot-symbole provisoire : chevron terracotta, **CTH** en anthracite, sous-titre terracotta. Quand le fichier source arrive, remplacez le SVG dans `src/render.mjs` (fonction `logo`) et `assets/favicon.svg`.

## Adresse (7 ou 7 bis)

Une seule ligne décide de tout le site :

```js
address: {
  line: "7 rue Bernard Palissy",
  ...
}
```

dans `site.config.mjs`. L'INSEE, Qualibat et Pages Jaunes écrivent « 7 ». Plusieurs actes RCS écrivent « 7 bis ». Pour passer à l'autre formulation, changez `line`, puis reconstruisez. Les coordonnées du plan sont le point INSEE du n° 7 : à revoir seulement si le bâtiment change.

## Badge RGE

`site.rge.validUntil` vaut `2026-12-12`. Le badge **RGE Qualibat n° E-E95447**, avec la mention « valable jusqu'au 12/12/2026 », reste visible ce jour-là (heure de Paris) et disparaît le lendemain, sans nouvelle mise en ligne : un script dans chaque page retire les blocs `data-rge`. Après un renouvellement, mettez la nouvelle date (et le numéro s'il change) puis reconstruisez.

## Formulaire de devis

Le formulaire de `contact.html` est envoyé à **cth45000@gmail.com** par [FormSubmit](https://formsubmit.co/cth45000@gmail.com), sans backend. Il y a un champ piège anti-spam, une case d'accord, et un lien `mailto:` de secours.

**Activation, une seule fois :** le premier envoi n'arrive pas tant que la boîte n'a pas confirmé. Il faut :

1. Ouvrir la page Contact du site en ligne.
2. Envoyer un essai.
3. Ouvrir `cth45000@gmail.com` et cliquer le lien d'activation FormSubmit.

Sans ce clic, les demandes des visiteurs ne sont pas délivrées. Ensuite, chaque envoi arrive par e-mail. La page de remerciement est `merci.html`.

## Domaine propre (CNAME)

1. Dans `site.config.mjs`, remplacez `siteUrl` par `https://votredomaine.fr` (sans slash final). Reconstruisez : canoniques, Open Graph, sitemap, JSON-LD et l'adresse de retour du formulaire suivent cette valeur. Les liens internes restent relatifs, donc le site fonctionne aussi bien sous `/cth-site/` que à la racine d'un domaine.
2. Ajoutez un fichier `CNAME` contenant uniquement le domaine, et faites-le copier dans `dist/` par `src/build.mjs` (une ligne `writeFile` suffit).
3. Dans le dépôt GitHub : Settings → Pages → Custom domain.
4. Chez le registrar, un enregistrement `A` / `AAAA` ou `CNAME` vers GitHub Pages, comme indiqué par GitHub. `cth45.fr` est déjà au nom de l'entreprise (à renouveler avant le 3 janvier 2027, et l'adresse whois y est encore l'ancien siège). `cth-renovation.fr` était libre le 21 novembre 2026 : à revérifier avant tout dépôt.

## Ce qui reste à compléter

- Trancher **7** ou **7 bis** rue Bernard Palissy.
- Remplacer les cadres encore vides : allées, intérieurs, ventilation, portail, fenêtres, page Menuiserie.
- Fournir le fichier source du logo.
- Activer FormSubmit depuis `cth45000@gmail.com`.
- Médiateur de la consommation : `[À COMPLÉTER]` dans les mentions.
- Durée précise de conservation des demandes sans suite, et garanties du transfert FormSubmit : `[À COMPLÉTER]` dans la politique de confidentialité.
- Renouveler le RGE avant le 12 décembre 2026 si le badge doit rester.
- Ne pas publier d'avis tant qu'un accord n'est pas donné. Ne pas présenter CTH comme membre du Réseau CTH national.
