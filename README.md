# Site vitrine — Technotropisme

Site statique one-page (HTML/CSS/JS, sans framework ni build) pour la micro-entreprise Technotropisme
(électricité, lumière, effets spéciaux spectacle vivant, réseau, électronique, vidéo).

## Aperçu local

Ouvrez `index.html` dans un navigateur, ou lancez un serveur local :

```bash
cd technotropisme-site
python3 -m http.server 8000
```

Puis rendez-vous sur `http://localhost:8000`.

## Déploiement

Le site est statique : il peut être déployé tel quel sur Netlify, Vercel, GitHub Pages ou tout
hébergement mutualisé, en pointant sur le dossier `technotropisme-site/`.

## À personnaliser avant mise en ligne

- **Formulaire de contact** (`index.html`, section `#contact`) : remplacer
  `https://formspree.io/f/VOTRE_ID_FORMSPREE` par l'URL de votre formulaire
  [Formspree](https://formspree.io) (ou un service équivalent) une fois un compte créé.
- **Coordonnées** : email, téléphone et lien Instagram dans la section `#contact`.
- **Mentions légales** : SIRET et mentions légales dans le pied de page.
- **Réalisations** : remplacer les trois blocs `.portfolio-placeholder` par vos projets
  (photo, titre, courte description) au fur et à mesure qu'ils sont disponibles.
- **Logo/favicon** : `assets/favicon.svg` est un logo provisoire généré à partir d'un pictogramme
  simple ; à remplacer par votre identité visuelle si vous en développez une.

## Structure

```
technotropisme-site/
├── index.html        Page unique (sections : accueil, services, secteurs, réalisations, à propos, contact)
├── css/styles.css     Thème sombre, accent ambré
├── js/main.js         Menu mobile, animations au scroll, envoi du formulaire
└── assets/favicon.svg Favicon provisoire
```
