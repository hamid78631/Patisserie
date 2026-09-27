/*
 * Génère tous les fichiers de la marque à partir du nom défini dans src/config/brand.js :
 *   - brand/ (racine du dépôt) : logo.svg, logo-white.svg, logo-mark.svg, favicon.svg, planche-logo.png
 *   - client/src/assets/brand/ : copies des logos utilisées par l'application
 *   - client/public/ : favicon.svg, apple-touch-icon.png, icon-192.png, icon-512.png,
 *                      og-image.png, manifest.webmanifest
 *
 * Le texte du logo est vectorisé à partir de Nunito 800 (@fontsource/nunito) :
 * aucune police n'est nécessaire pour afficher le logo.
 *
 * Usage : npm run marque   (à relancer si le nom de la boutique change)
 * Les PNG sont rendus avec Chromium (Playwright). Chemin du navigateur surchargeable
 * avec la variable CHROMIUM_PATH.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import opentype from 'opentype.js';
import { brand } from '../src/config/brand.js';

const require = createRequire(import.meta.url);
const ici = dirname(fileURLToPath(import.meta.url));
const client = resolve(ici, '..');
const racine = resolve(client, '..');
const dossiers = {
  brand: resolve(racine, 'brand'),
  assets: resolve(client, 'src/assets/brand'),
  public: resolve(client, 'public'),
};

// Couleurs de la charte (STYLE.md §2.1)
const C = {
  red: '#C8102E',
  wine: '#6B0F1A',
  blush: '#F7E4E2',
  white: '#FFFFFF',
};

/* ------------------------------------------------------------------ */
/* Cerise : géométrie dans une boîte d'environ 48 × 48                  */
/* ------------------------------------------------------------------ */
const CERISE = {
  // Fruit
  fruit: { cx: 20, cy: 31, r: 14 },
  // Reflet (ellipse inclinée en haut à gauche du fruit)
  reflet: { cx: 14.2, cy: 25.6, rx: 2.4, ry: 4.4, rotation: 35 },
  // Tige (trait) et feuille (aplat)
  tige: 'M20 19.5 C 21 12.5, 25 8, 31 5',
  largeurTige: 2.4,
  feuille: 'M31 5 C 35 0.8, 41 0.6, 46 4 C 41 8.6, 35 8.8, 31 5 Z',
  // Boîte englobante (pour le cadrage)
  boite: { x: 6, y: 1.6, largeur: 40.4, hauteur: 43.4 },
};

const arrondi = (n) => Math.round(n * 100) / 100;

// Ellipse inclinée sous forme de tracé (utile pour la découper dans le fruit)
function ellipseEnTrace({ cx, cy, rx, ry, rotation }) {
  const a = (rotation * Math.PI) / 180;
  // Extrémités du grand axe (vertical avant rotation)
  const dx = -Math.sin(a) * ry;
  const dy = Math.cos(a) * ry;
  const p1 = [arrondi(cx + dx), arrondi(cy + dy)];
  const p2 = [arrondi(cx - dx), arrondi(cy - dy)];
  return `M${p1[0]} ${p1[1]} A${rx} ${ry} ${rotation} 1 0 ${p2[0]} ${p2[1]} A${rx} ${ry} ${rotation} 1 0 ${p1[0]} ${p1[1]} Z`;
}

function cercleEnTrace({ cx, cy, r }) {
  return `M${cx - r} ${cy} A${r} ${r} 0 1 0 ${cx + r} ${cy} A${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;
}

/**
 * Éléments SVG de la cerise.
 * mode 'couleur' : fruit rouge, tige et feuille bordeaux, reflet blanc.
 * mode 'blanc'   : tout en blanc, reflet découpé dans le fruit (laisse voir le fond).
 */
function elementsCerise(mode) {
  const { fruit, reflet, tige, largeurTige, feuille } = CERISE;
  if (mode === 'blanc') {
    return [
      `<path d="${tige}" fill="none" stroke="${C.white}" stroke-width="${largeurTige}" stroke-linecap="round"/>`,
      `<path d="${feuille}" fill="${C.white}"/>`,
      `<path d="${cercleEnTrace(fruit)} ${ellipseEnTrace(reflet)}" fill="${C.white}" fill-rule="evenodd"/>`,
    ].join('');
  }
  return [
    `<path d="${tige}" fill="none" stroke="${C.wine}" stroke-width="${largeurTige}" stroke-linecap="round"/>`,
    `<path d="${feuille}" fill="${C.wine}"/>`,
    `<circle cx="${fruit.cx}" cy="${fruit.cy}" r="${fruit.r}" fill="${C.red}"/>`,
    `<path d="${ellipseEnTrace(reflet)}" fill="${C.white}"/>`,
  ].join('');
}

/* ------------------------------------------------------------------ */
/* Mot-symbole vectorisé                                                */
/* ------------------------------------------------------------------ */
async function chargerPolice() {
  const fichier = require.resolve('@fontsource/nunito/files/nunito-latin-800-normal.woff');
  const tampon = await readFile(fichier);
  return opentype.parse(tampon.buffer.slice(tampon.byteOffset, tampon.byteOffset + tampon.byteLength));
}

function traceTexte(police, texte, x, ligneDeBase, taille) {
  // Léger resserrement des lettres (-0,01 em), comme les titres du site
  // Placement manuel des glyphes (avec crénage) : opentype.js ne gère pas toutes
  // les substitutions contextuelles de DM Sans, inutiles pour un mot-symbole.
  const echelle = taille / police.unitsPerEm;
  const glyphes = Array.from(texte).map((c) => police.charToGlyph(c));
  const trace = new opentype.Path();
  let curseur = x;
  glyphes.forEach((glyphe, i) => {
    trace.extend(glyphe.getPath(curseur, ligneDeBase, taille));
    curseur += glyphe.advanceWidth * echelle - 0.01 * taille;
    const suivant = glyphes[i + 1];
    if (suivant) curseur += police.getKerningValue(glyphe, suivant) * echelle;
  });
  return { d: trace.toPathData(2), boite: trace.getBoundingBox() };
}

/* ------------------------------------------------------------------ */
/* Fichiers SVG                                                         */
/* ------------------------------------------------------------------ */
const entete = (viewBox, largeur, hauteur, titre) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${largeur}" height="${hauteur}" role="img" aria-label="${titre}"><title>${titre}</title>`;

function construireLogos(police) {
  const taille = 34;
  const ligneDeBase = 43;
  const ecart = 9; // espace entre la cerise et le texte
  const xTexte = CERISE.boite.x + CERISE.boite.largeur + ecart;
  const texte = traceTexte(police, brand.name, xTexte, ligneDeBase, taille);

  const minX = CERISE.boite.x;
  const minY = Math.min(CERISE.boite.y, texte.boite.y1);
  const maxX = texte.boite.x2;
  const maxY = Math.max(CERISE.boite.y + CERISE.boite.hauteur, texte.boite.y2);
  const l = arrondi(maxX - minX);
  const h = arrondi(maxY - minY);
  const vb = `${arrondi(minX)} ${arrondi(minY)} ${l} ${h}`;
  // Taille intrinsèque : hauteur de 40 px (au-dessus du minimum de 28 px)
  const largeurPx = Math.round((l / h) * 40);

  const logo = `${entete(vb, largeurPx, 40, brand.name)}${elementsCerise('couleur')}<path d="${texte.d}" fill="${C.wine}"/></svg>\n`;
  const logoBlanc = `${entete(vb, largeurPx, 40, brand.name)}${elementsCerise('blanc')}<path d="${texte.d}" fill="${C.white}"/></svg>\n`;

  // Cerise seule, cadrée dans un carré
  const b = CERISE.boite;
  const cote = Math.max(b.largeur, b.hauteur);
  const vbCerise = `${arrondi(b.x - (cote - b.largeur) / 2)} ${arrondi(b.y - (cote - b.hauteur) / 2)} ${arrondi(cote)} ${arrondi(cote)}`;
  const cerise = `${entete(vbCerise, 48, 48, brand.name)}${elementsCerise('couleur')}</svg>\n`;

  return { logo, logoBlanc, cerise, ratio: l / h };
}

// Cerise centrée sur un carré rose poudré (favicon et icônes d'application)
function construireIcone({ arrondiCoins, marge }) {
  const b = CERISE.boite;
  const cote = Math.max(b.largeur, b.hauteur) / (1 - 2 * marge);
  const x0 = arrondi(b.x + b.largeur / 2 - cote / 2);
  const y0 = arrondi(b.y + b.hauteur / 2 - cote / 2);
  const rayon = arrondi(cote * arrondiCoins);
  return `${entete(`${x0} ${y0} ${arrondi(cote)} ${arrondi(cote)}`, 64, 64, brand.name)}<rect x="${x0}" y="${y0}" width="${arrondi(cote)}" height="${arrondi(cote)}" rx="${rayon}" fill="${C.blush}"/>${elementsCerise('couleur')}</svg>\n`;
}

/* ------------------------------------------------------------------ */
/* Rendu PNG avec Chromium                                              */
/* ------------------------------------------------------------------ */
function cheminChromium() {
  const candidats = [process.env.CHROMIUM_PATH, '/opt/pw-browsers/chromium'].filter(Boolean);
  return candidats.find((c) => existsSync(c));
}

// Nunito intégrée pour les légendes de la planche (rendu hors ligne)
let policeCss = '';
async function chargerPoliceCss() {
  const fichier = require.resolve('@fontsource/nunito/files/nunito-latin-400-normal.woff2');
  const base64 = (await readFile(fichier)).toString('base64');
  policeCss = `@font-face{font-family:'Nunito';font-weight:400;src:url(data:font/woff2;base64,${base64}) format('woff2')}`;
}

async function rendrePng(navigateur, html, largeur, hauteur, sortie) {
  const page = await navigateur.newPage({ viewport: { width: largeur, height: hauteur } });
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${policeCss}
    html,body{margin:0;padding:0;width:${largeur}px;height:${hauteur}px;overflow:hidden}
    body,div{font-family:'Nunito',sans-serif!important}
  </style></head><body>${html}</body></html>`);
  await page.screenshot({ path: sortie, omitBackground: false });
  await page.close();
}

const dataUri = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

function htmlCentre(svg, largeur, hauteur, fond, hauteurImage) {
  return `<div style="width:${largeur}px;height:${hauteur}px;background:${fond};display:flex;align-items:center;justify-content:center">
    <img src="${dataUri(svg)}" style="height:${hauteurImage}px;width:auto" alt=""></div>`;
}

function htmlPlanche({ logo, logoBlanc, cerise, favicon }) {
  const cadre = (fond, contenu, legende, texteClair = false) => `
    <figure style="margin:0;display:flex;flex-direction:column;gap:12px">
      <div style="background:${fond};border-radius:24px;height:260px;display:flex;align-items:center;justify-content:center;${fond === C.white ? `box-shadow:inset 0 0 0 1px #EEDFDD;` : ''}">${contenu}</div>
      <figcaption style="font-size:15px;color:${texteClair ? C.white : '#6E5A5C'}">${legende}</figcaption>
    </figure>`;
  const img = (svg, h) => `<img src="${dataUri(svg)}" style="height:${h}px;width:auto" alt="">`;
  const pastille = (hex, nom) => `<div style="display:flex;flex-direction:column;gap:8px">
      <div style="width:100%;height:72px;border-radius:14px;background:${hex};box-shadow:inset 0 0 0 1px #EEDFDD"></div>
      <div style="font-size:14px;color:#2A1215">${nom}<br><span style="color:#6E5A5C">${hex}</span></div></div>`;
  return `<div style="width:1600px;height:1010px;background:#FFFFFF;padding:72px;box-sizing:border-box;display:flex;flex-direction:column;gap:40px">
    <div style="display:flex;justify-content:space-between;align-items:baseline">
      <div style="font-size:15px;letter-spacing:.08em;text-transform:uppercase;color:#6E5A5C">Planche de logo — ${brand.name}</div>
      <div style="font-size:15px;color:#6E5A5C">Logo provisoire · Nunito 800 vectorisé</div>
    </div>
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:32px">
      ${cadre(C.white, img(logo, 96), 'Logo principal — fond blanc')}
      ${cadre(C.blush, img(cerise, 140), 'Cerise seule — en-tête mobile, avatar, filigrane')}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:32px">
      ${cadre(C.red, img(logoBlanc, 64), 'Version blanche — fond rouge vif')}
      ${cadre(C.wine, img(logoBlanc, 64), 'Version blanche — fond bordeaux')}
      ${cadre('#FDF7F6', img(favicon, 120), 'Favicon et icône d’application')}
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:32px">
      ${pastille(C.red, 'Rouge vif')}
      ${pastille(C.wine, 'Bordeaux')}
      ${pastille(C.blush, 'Rose poudré')}
      ${pastille(C.white, 'Blanc')}
    </div>
  </div>`;
}

/* ------------------------------------------------------------------ */
/* Programme principal                                                  */
/* ------------------------------------------------------------------ */
async function principal() {
  const police = await chargerPolice();
  const { logo, logoBlanc, cerise, ratio } = construireLogos(police);
  const favicon = construireIcone({ arrondiCoins: 0.22, marge: 0.16 });
  // Icônes d'application : carré plein (le système arrondit lui-même),
  // marge plus large pour rester dans la zone sûre des icônes « maskable »
  const iconeApp = construireIcone({ arrondiCoins: 0, marge: 0.22 });

  for (const d of Object.values(dossiers)) await mkdir(d, { recursive: true });

  const fichiers = {
    [`${dossiers.brand}/logo.svg`]: logo,
    [`${dossiers.brand}/logo-white.svg`]: logoBlanc,
    [`${dossiers.brand}/logo-mark.svg`]: cerise,
    [`${dossiers.brand}/favicon.svg`]: favicon,
    [`${dossiers.assets}/logo.svg`]: logo,
    [`${dossiers.assets}/logo-white.svg`]: logoBlanc,
    [`${dossiers.assets}/logo-mark.svg`]: cerise,
    [`${dossiers.public}/favicon.svg`]: favicon,
  };
  for (const [chemin, contenu] of Object.entries(fichiers)) await writeFile(chemin, contenu);

  const manifeste = {
    name: brand.name,
    short_name: brand.name,
    description: brand.tagline.fr,
    lang: 'fr-CA',
    start_url: '/',
    display: 'standalone',
    background_color: C.white,
    theme_color: C.white,
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  };
  await writeFile(`${dossiers.public}/manifest.webmanifest`, `${JSON.stringify(manifeste, null, 2)}\n`);

  const executable = cheminChromium();
  if (!executable) {
    console.warn('Chromium introuvable (définir CHROMIUM_PATH) : les PNG ne sont pas régénérés.');
    return;
  }
  const { chromium } = await import('playwright-core');
  await chargerPoliceCss();
  const navigateur = await chromium.launch({ executablePath: executable });
  try {
    await rendrePng(navigateur, htmlCentre(iconeApp, 180, 180, C.blush, 180), 180, 180, `${dossiers.public}/apple-touch-icon.png`);
    await rendrePng(navigateur, htmlCentre(iconeApp, 192, 192, C.blush, 192), 192, 192, `${dossiers.public}/icon-192.png`);
    await rendrePng(navigateur, htmlCentre(iconeApp, 512, 512, C.blush, 512), 512, 512, `${dossiers.public}/icon-512.png`);
    // Image de partage : logo centré sur fond rose poudré (STYLE.md §4)
    const hauteurLogo = Math.min(120, Math.round(760 / ratio));
    await rendrePng(navigateur, htmlCentre(logo, 1200, 630, C.blush, hauteurLogo), 1200, 630, `${dossiers.public}/og-image.png`);
    await rendrePng(navigateur, htmlPlanche({ logo, logoBlanc, cerise, favicon }), 1600, 1010, `${dossiers.brand}/planche-logo.png`);
  } finally {
    await navigateur.close();
  }
  console.log('Marque générée : brand/, client/src/assets/brand/, client/public/');
}

principal().catch((erreur) => {
  console.error(erreur);
  process.exit(1);
});
