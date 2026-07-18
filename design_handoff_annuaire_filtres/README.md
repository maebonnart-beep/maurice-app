# Handoff: Refonte ergonomique de l'annuaire Maurice+ (page recherche/filtres/résultats)

## Overview
Nouvelle organisation de la page principale de l'annuaire (recherche, filtres par zone/catégorie/rubrique, résultats). Objectif : réduire l'empilement de 3 rangées de chips à défilement horizontal en une sidebar de catégories à disclosure (un seul niveau de clic), mettre la recherche en avant, et afficher liste + carte côte à côte.

## About the Design Files
Les fichiers de ce bundle sont des **références de design en HTML** — un wireframe basse-fidélité (sketch, gris + un accent) montrant la structure et le flux, pas du code à copier tel quel. La tâche consiste à **recréer cette structure dans l'environnement existant de l'app** (le stack web/mobile réel du projet), avec le vrai design system, les vraies données (businesses.json) et la vraie stack de carte.

## Fidelity
**Basse-fidélité (lofi)** — wireframe structurel en style croquis (police manuscrite, gris/blanc, un seul accent teal). Les couleurs, polices et espacements exacts du wireframe ne doivent PAS être repris ; ils servent uniquement à distinguer les zones (état actif vs inactif, catégorie sélectionnée, etc). Utiliser le design system réel de l'app pour le rendu final.

## Version retenue
Version **web, option "1a"** du fichier `Ergonomie Annuaire Maurice+.dc.html` (screenshot inclus : `1a-web.png`) : sidebar catégories à gauche + résultats (liste + carte) à droite. C'est la seule version à implémenter dans ce handoff (les autres options du fichier — 1b mobile, 2a, 2b — sont des alternatives explorées et écartées, à ignorer).

## Screens / Views

### Écran unique : Recherche & résultats (web, large viewport)

**Layout général**
- Colonne unique en haut : header pleine largeur (recherche + zone), puis en dessous un layout en 2 zones horizontales : sidebar fixe à gauche (270px) + zone de résultats flexible à droite.
- Zone de résultats elle-même divisée en 2 : liste (56% de largeur) à gauche, carte (44%) à droite, toutes deux sur toute la hauteur restante, scrollables indépendamment.

**1. Header**
- Ligne 1 : logo "Maurice+" à gauche, boutons "Se connecter" / "+ Ajouter une adresse" à droite.
- Ligne 2 : barre de recherche pleine largeur, icône loupe + placeholder "Rechercher une activité, un lieu, un nom…", avec un exemple de requête affiché en petit à droite pour donner une affordance ("ex: spa Grand Baie, plongée").
- Ligne 3 : filtre "Zone" — groupe de pills à sélection unique : Toute l'île / Nord (207) / Est (106) / Sud (153) / Ouest (118) / Centre (68). Pill sélectionnée = fond accent, texte blanc.

**2. Sidebar catégories (gauche, 270px, hauteur pleine, scroll vertical propre)**
- Liste verticale de catégories : Tout (2049), Activités & loisirs (652), Food (945), Utiles (219), Coaching (49), Seconde main (29), Business & TTV (14), Événements (0, grisé/désactivé si vide).
- Une seule catégorie peut être "ouverte" à la fois (accordéon, pas d'accumulation). La catégorie ouverte a un fond accent (teal) et une flèche vers le bas.
- Sous la catégorie ouverte : liste indentée des rubriques (sous-catégories) avec leur compteur, reliée par une ligne verticale en pointillé. Une rubrique peut être sélectionnée (fond clair). Si plus de ~5 rubriques, afficher les plus importantes (par volume) puis un lien "+ N autres rubriques" qui déplie le reste.
- Comportement clé : cliquer une catégorie fermée l'ouvre et ferme l'accordéon précédent ; cliquer une rubrique la sélectionne et filtre les résultats sans changer de page.

**3. Barre de résultats (au-dessus de liste+carte)**
- À gauche : fil d'ariane compact du filtre actif ("🏄 Sports nautiques — 48 résultats").
- À droite : tri (dropdown "Note ▾", "Distance ▾" — pas de valeur par défaut imposée pour l'instant) + bouton "Liste + Carte" (toggle vers "Liste seule" / "Carte seule" en dessous de la largeur `md`, cf. Responsive).

**4. Liste de résultats (gauche, 56%)**
- Cartes empilées verticalement, scroll interne indépendant de la carte.
- Contenu de chaque carte : vignette photo (ratio carré, à gauche), nom du lieu, distance (haut droite), catégorie + rubrique + localité (une ligne), note en étoiles + nombre d'avis, 3 boutons d'action : "📞 Appeler", "🌐 Site", "📍 Itinéraire".
- La carte survolée/sélectionnée doit se synchroniser avec le pin correspondant sur la carte (survol réciproque).

**5. Carte (droite, 44%)**
- Carte plein cadre, épingles pour chaque résultat visible.
- Toggle "n'afficher que la zone visible de la carte" (déjà présent dans l'écran actuel, à conserver).
- Clic sur un pin → scroll + surlignage de la fiche correspondante dans la liste.

## Interactions & Behavior
- Sélection de zone : un seul choix actif à la fois (radio-like), pas de multi-sélection.
- Accordéon catégories : ouverture exclusive (accordion, pas de multi-expand) ; état ouvert visuellement distinct (fond accent + chevron).
- Sélection de rubrique : filtre additif au-dessus de la catégorie + zone déjà choisies ; doit rester visible/sticky en haut de la sidebar une fois sélectionnée pour qu'on sache où on est.
- Recherche texte : recherche libre sur nom/rubrique/lieu, doit fonctionner indépendamment des filtres (les filtres restreignent, la recherche cherche dans le sous-ensemble filtré).
- Hover carte de résultat ⇄ pin carte : surlignage réciproque.
- Aucun tri par défaut requis pour l'instant (l'utilisateur n'a pas encore arbitré) — prévoir le point d'extension (Note / Distance / Prix / Ouvert maintenant) sans l'imposer en V1.
- Responsive : en dessous d'un breakpoint desktop (à définir avec le design system cible), la sidebar catégories devient une feuille (bottom sheet / drawer) invocable par un bouton filtre, et liste/carte basculent en onglets plutôt qu'en côte-à-côte (cf. option mobile "1b" du fichier source pour l'inspiration, non retenue telle quelle mais utile comme référence de pattern).

## State Management
- `activeZone`: une valeur parmi Toute l'île/Nord/Est/Sud/Ouest/Centre.
- `openCategory`: id de la catégorie actuellement dépliée dans la sidebar (une seule à la fois).
- `activeSubcategory`: id de la rubrique sélectionnée (optionnel, peut être vide = toute la catégorie).
- `searchQuery`: texte libre.
- `hoveredResultId` / `selectedResultId`: pour la synchronisation liste ⇄ carte.
- `mapBoundsOnly`: booléen (toggle "n'afficher que la zone visible").
- Données : nombre de résultats par catégorie/rubrique déjà calculé côté source (`businesses.json` mentionné par l'utilisateur) — la sidebar doit lire des compteurs dynamiques, pas des valeurs figées.

## Design Tokens
Le wireframe n'impose pas de valeurs finales — reprendre le design system existant de l'app. Repères structurels seulement :
- Sidebar : largeur fixe ~260–280px.
- Split liste/carte : ~55/45.
- Cartes de résultats : vignette carrée ~72–80px, 3 boutons d'action alignés horizontalement sous les infos.
- Un seul niveau d'accent couleur pour signaler l'état actif (zone sélectionnée, catégorie ouverte, rubrique sélectionnée, onglet actif) — cohérent partout.

## Assets
Aucun asset réel utilisé (photos, icônes = placeholders texte/emoji dans le wireframe). Prévoir de vraies photos de lieux et un jeu d'icônes cohérent avec le design system cible pour la version finale.

## Files
- `Ergonomie Annuaire Maurice+.dc.html` — fichier source complet du wireframe (toutes les options 1a/1b/2a/2b). Seule l'option **1a** (ancrage `#1a`) fait foi pour ce handoff.
- `1a-web.png` — capture de la version retenue.
