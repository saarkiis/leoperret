/*
 * PIÈCES — Léo Perret
 * --------------------------------------------------------------
 * C'est le seul fichier à modifier pour ajouter, retirer ou
 * réordonner une pièce. L'ordre de la liste = l'ordre du carrousel.
 *
 * Pour chaque pièce :
 *   id          identifiant dans l'adresse (lettres minuscules, chiffres, tirets)
 *   name        nom affiché
 *   year        année, ex. "2025"
 *   category    ex. "Assise", "Luminaire", "Table", "Objet"
 *   materials   ex. "Chêne massif, acier brossé"
 *   dimensions  ex. "H 78 × L 46 × P 52 cm"
 *   edition     ex. "Pièce unique", "Édition de 8", "Prototype" (facultatif)
 *   description quelques lignes au maximum
 *   credits     ex. "Photographie : Prénom Nom" (facultatif)
 *   cover       image du carrousel
 *   gallery     photos de la page projet, dans l'ordre de lecture
 *
 * ratio = largeur / hauteur de la photo.
 * Les valeurs à null s'affichent « À renseigner ».
 */

const img = (id, n, w, h, caption) => ({ src: `images/${id}/${n}.jpg`, ratio: w / h, caption });

window.PROJECTS = [
  {
    id: 'assise',
    name: 'Assise',                      // nom provisoire
    year: '2026',
    category: 'Assise',
    materials: null, dimensions: null, edition: null, description: null, credits: null,
    cover: img('assise', '01', 1125, 1398),
    gallery: [
      img('assise', '01', 1125, 1398, 'Mise en situation'),
      img('assise', '02', 1440, 1132, 'Détail de la matière'),
    ],
  },
  {
    id: 'fauteuil-bois-moule',
    name: 'Fauteuil bas',                // nom provisoire
    year: '2026',
    category: 'Fauteuil',
    materials: null, dimensions: null, edition: null, description: null, credits: null,
    cover: img('fauteuil-bois-moule', '01', 1024, 1024),
    gallery: [
      img('fauteuil-bois-moule', '01', 1024, 1024, 'Mise en situation'),
    ],
  },
  {
    id: 'fauteuil-verre',
    name: 'Fauteuil tube et verre',      // nom provisoire
    year: '2025',
    category: 'Fauteuil',
    materials: null, dimensions: null, edition: null, description: null, credits: null,
    cover: img('fauteuil-verre', '01', 2000, 2000),
    gallery: [
      img('fauteuil-verre', '01', 2000, 2000, 'Profil'),
      img('fauteuil-verre', '02', 2000, 2000, 'Mise en situation'),
      img('fauteuil-verre', '03', 1376, 768, 'Installation murale'),
    ],
  },
  {
    id: 'fauteuil-cuir',
    name: 'Fauteuil cuir et laiton',     // nom provisoire
    year: '2025',
    category: 'Fauteuil',
    materials: null, dimensions: null, edition: null, description: null, credits: null,
    cover: img('fauteuil-cuir', '01', 864, 1007),
    gallery: [
      img('fauteuil-cuir', '01', 864, 1007, 'Vue générale'),
      img('fauteuil-cuir', '02', 864, 1100, 'Vue de dessus'),
      img('fauteuil-cuir', '03', 864, 1184, 'Vue complémentaire'),
      img('fauteuil-cuir', '04', 864, 1184, 'Détail de structure'),
    ],
  },
  {
    id: 'luminaire',
    name: 'Luminaire',                   // nom provisoire
    year: '2024',
    category: 'Luminaire',
    materials: null, dimensions: null, edition: null, description: null, credits: null,
    cover: img('luminaire', '01', 1024, 1536),
    gallery: [
      img('luminaire', '01', 1024, 1536, 'Mise en situation'),
    ],
  },
];
