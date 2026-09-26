/*
 * Identité de la boutique : nom, slogan et coordonnées centralisés ici (PROJET.md §2).
 * Le nom est provisoire. S'il change, modifier ce fichier puis lancer
 * « npm run marque » pour régénérer le logo, les icônes et le manifeste.
 *
 * Les coordonnées publiques définitives (courriel, téléphone, réseaux, permis MAPAQ)
 * viendront des réglages de l'admin via GET /api/settings (PROJET.md §13.4) ;
 * les valeurs ci-dessous servent de repli en attendant.
 */
export const brand = {
  name: 'Pâtisserie',
  tagline: {
    fr: 'Pâtisserie maison à Québec',
    en: 'Homemade pastries in Québec City',
  },
  city: 'Québec',
  email: 'bonjour@patisserie.example',
  phone: '+1 418 555-0100',
  instagramUrl: 'https://www.instagram.com/',
  facebookUrl: 'https://www.facebook.com/',
};

export default brand;
