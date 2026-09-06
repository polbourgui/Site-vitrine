# Site vitrine — Technotropisme

Site statique one-page (HTML/CSS/JS, sans framework ni build) pour la micro-entreprise Technotropisme
(électricité, électronique, réseau, lumière, scénographie).

L'interface est mise en scène comme une **console de gestion lumière** : chaque grande section de
la page est un « canal » numéroté (ch.01 à ch.04), et le scroll pilote leur intensité comme un
jeu d'orgue pilote des faders.

## Aperçu local

Ouvrez `index.html` dans un navigateur, ou lancez un serveur local :

```bash
python3 -m http.server 8000
```

Puis rendez-vous sur `http://localhost:8000`.

## Déploiement

Le site est statique : il peut être déployé tel quel sur Netlify, Vercel, Cloudflare Pages,
GitHub Pages ou tout hébergement mutualisé, en pointant sur la racine du dépôt.

Sur Cloudflare Pages, la configuration attendue est :
- **Build command** : (laisser vide)
- **Build output directory** : `/`

## Le concept « console lumière »

- **Canaux** : chaque section (`.channel`) porte un numéro (`data-channel="1"` à `"4"`) — ch.01 Hero,
  ch.02 Projets, ch.03 Compétences, ch.04 Contact. Un rail de faders fixe (`.fader-rail` en desktop,
  `.rail-mobile` en mobile) reflète en direct l'intensité de chaque canal.
- **Scroll = dimmer** (`js/dimmer.js`) : sur desktop, les canaux sont épinglés à la même position
  écran (`.stage.is-dimmer`) et le scroll pilote un fondu-enchaîné entre eux (plateau à pleine
  intensité, puis transition partagée avec le voisin — jamais deux canaux pleinement visibles en
  même temps). Sur mobile et sous `prefers-reduced-motion`, repli en flux normal : les sections
  s'affichent l'une sous l'autre, à intensité maximale, sans JS requis pour accéder au contenu.
- **Frames vides** (`.channel--blank`) : un canal sans contenu est inséré entre chaque canal réel,
  pour laisser voir le(s) halo(s) sans aucun bloc de texte par-dessus pendant une partie du scroll.
  Le rail et la nav référencent les canaux par leur numéro (`data-channel`/`data-fader`/`data-nav`),
  pas par leur position dans la liste, donc ces frames n'ont pas besoin d'être comptées à part.
- **Halo(s) ambiant(s)** (`.channel-halos`) : un calque de lumière global et fixe, en dehors de la
  pile de canaux, qui reste à pleine opacité pendant tout le défilement (jamais d'atténuation liée
  au scroll). Sa couleur, son intensité, sa position et ses effets sont pilotés par la mini-console.
- **Mini-console interactive** (`js/console.js`) : panneau flottant et déplaçable, toujours visible,
  qui pilote un ou plusieurs halos (« fixtures ») indépendamment les uns des autres :
  - Intensité et mélange RGB (3 faders 0–255).
  - Position (pan/tilt) via un pavé XY.
  - Mouvement programmé : enregistrer des points de position et les rejouer en boucle.
  - Effets d'intensité mutuellement exclusifs — STROBE (créneau net), BREATHE (onde douce),
    FADE (paliers) — avec un fader de vitesse commun. Le strobe reste plafonné sous le seuil
    général de flash même à vitesse maximale ; les 3 effets et la lecture de trajet sont
    désactivés sous `prefers-reduced-motion`.
  - « + » ajoute une fixture (une couleur de départ différente à chaque fois), les onglets
    permettent de basculer entre elles, « × » d'en supprimer (toujours au moins une).
- **Réactivité de proximité** (`js/proximity.js`) : les éléments `.proximity` (nav, cartes, faders,
  vignettes de projets…) réagissent à la distance du curseur (souris) ou du doigt (tactile) avant
  le clic. Sur les appareils sans pointeur fin, une micro-respiration discrète les anime au repos.

## Accessibilité

- Tout le contenu est présent dans le DOM et lisible sans JavaScript.
- Sous `prefers-reduced-motion: reduce` : pas de scroll-dimmer, pas de proximité, pas d'effets de
  console ni de lecture de trajet — les sections s'affichent normalement, à intensité maximale.
- Les canaux hors-focus sont rendus inertes (`inert` + `aria-hidden`) pendant le scroll-dimmer pour
  qu'ils ne soient jamais atteignables au clavier tant qu'ils ne sont pas visibles.

## À personnaliser avant mise en ligne

- **Formulaire de contact** (`index.html`, section `#contact`) : remplacer
  `https://formspree.io/f/VOTRE_ID_FORMSPREE` par l'URL de votre formulaire
  [Formspree](https://formspree.io) (ou un service équivalent) une fois un compte créé.
- **Coordonnées** : email, téléphone et lien Instagram dans la section `#contact`.
- **Mentions légales** : SIRET et mentions légales dans le pied de page.
- **Réalisations** : remplacer les blocs `.project-tile` (section `#projets`) par vos projets
  (photo, titre, courte description) au fur et à mesure qu'ils sont disponibles.
- **Logo/favicon** : `assets/favicon.svg` est un logo provisoire généré à partir d'un pictogramme
  simple ; à remplacer par votre identité visuelle si vous en développez une.

## Structure

```
├── index.html         Page unique : canaux ch.01–04, frames vides, mini-console, rail de faders
├── css/styles.css      Thème sombre, accent ambre, halos, mini-console, responsive
├── js/main.js          Menu mobile, année du pied de page, envoi du formulaire
├── js/dimmer.js         Moteur scroll → intensité par canal (fondu-enchaîné + repli sans JS)
├── js/proximity.js      Réactivité de proximité curseur/tactile
├── js/console.js        Mini-console : fixtures, RGB, pan/tilt, trajets, effets, panneau déplaçable
└── assets/favicon.svg  Favicon provisoire
```
