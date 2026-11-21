# leoperret.com — mode d'emploi

Site statique, sans abonnement ni dépendance : `index.html`, `styles.css`, `app.js`, `projects.js` et un dossier `images/`.
Hébergé gratuitement sur GitHub Pages. Le formulaire de contact passe par FormSubmit (gratuit, sans compte) :
messages vers leo16.perret@gmail.com, copie à contact@leoperret.com (adresses en tête de app.js).

## Ajouter / modifier une pièce
Tout se passe dans **projects.js** (l'ordre de la liste = l'ordre du carrousel).
1. Mets les photos dans `images/<id-de-la-piece>/` (JPG, ~2000 px sur le grand côté).
2. Dans `projects.js`, renseigne `year`, `materials`, `dimensions`, `description`… et les images.
3. Envoie les fichiers modifiés sur GitHub (Add file → Upload files) : le site se met à jour en une minute.

## Nom de domaine (Squarespace → DNS)
- Ne jamais toucher aux enregistrements Zoho : MX, TXT SPF, TXT DKIM.
