/**
 * ============================================================================
 * ANNUAIRE MAURICE+ — Import Google Places (New), île entière
 * ----------------------------------------------------------------------------
 * Ce script interroge l'API Google Places (New) - Text Search pour chaque
 * combinaison région × catégorie ci-dessous, puis écrit chaque lieu dans la
 * feuille Google Sheet active. Il déduplique par place_id (relancer le script
 * plus tard ne recrée pas de doublons) et bride le nombre d'appels API par
 * exécution via CONFIG.MAX_REQUETES.
 *
 * MISE EN ROUTE :
 * 1) Google Sheets → Extensions → Apps Script → collez ce fichier.
 * 2) Dans CONFIG ci-dessous, remplacez API_KEY par votre clé Places API (New)
 *    — ne collez jamais une clé API dans un chat ou un outil tiers, entrez-la
 *    uniquement ici, directement dans l'éditeur Apps Script.
 * 3) Enregistrez, rechargez le Sheet, menu "Annuaire Maurice+ → Importer".
 * 4) Autorisez l'accès demandé (le script n'appelle que l'API Google Places).
 * ============================================================================
 */

// ============================ CONFIGURATION =================================
const CONFIG = {
  // 1) Collez votre clé API Google Places entre les guillemets ci-dessous :
  API_KEY: 'COLLEZ_VOTRE_CLE_API_ICI',

  // 2) Garde-fou budgétaire : nb MAX d'appels API par exécution.
  //    Chaque combinaison région × catégorie = 1 appel par page (PAGES_PAR_REQUETE).
  //    Relancer le menu plusieurs fois (ex: un jour par tranche) ne pose aucun
  //    problème : le dédoublonnage par place_id évite de repayer les mêmes lieux.
  //    Avec ~41 mots-clés × 7 régions = ~287 requêtes de base (jusqu'à 861 avec la
  //    pagination), un seul clic ne suffira probablement pas à tout couvrir —
  //    relancez le menu "Importer" plusieurs fois, sans risque de doublons/surcoût.
  MAX_REQUETES: 400,

  // 3) Pagination : nb de pages par requête (1 page = 20 résultats max ; 3 = 60 max).
  PAGES_PAR_REQUETE: 3,

  // 4) Biais géographique : cercle centré sur l'île entière (pas une restriction
  //    stricte — Text Search se base d'abord sur le texte de la requête, qui
  //    inclut déjà le nom de chaque région ci-dessous).
  CENTRE: { latitude: -20.2000, longitude: 57.5500 },
  RAYON_METRES: 45000,

  // 5) Langue et région
  LANGUE: 'fr',
  REGION: 'MU'
};

// Régions couvrant l'île (utilisées pour cibler chaque requête texte).
const REGIONS = [
  'Grand Baie Nord',
  'Flic en Flac Tamarin Riviere Noire',
  'Le Morne Chamarel',
  'Bel Ombre Souillac Sud',
  'Belle Mare Trou d\'Eau Douce Est',
  'Mahebourg Blue Bay Sud-Est',
  'Port Louis Curepipe Moka Centre'
];

// Catégories recherchées dans chaque région : "categorie" = une des 6 catégories
// top-level de web/data/categories.ts (activites/food/utiles/coaching/seconde-main/
// evenements), "theme" = une sous-catégorie (SUBCATEGORIES) de cette catégorie.
// Volontairement absentes (pas de vrais "lieux" Google Places individuels) :
// activites/plages, activites/balades-familiales, utiles/bus, utiles/tram, et
// toute la catégorie evenements (sportifs/culturels/business — ce sont des
// événements ponctuels, pas des établissements ; à alimenter à la main).
const CATEGORIES = [
  // --- Activités & loisirs ---
  { mot: 'golf',                                 categorie: 'activites', theme: 'golf' },
  { mot: 'excursions',                           categorie: 'activites', theme: 'excursions' },
  { mot: 'parc animalier',                       categorie: 'activites', theme: 'parcs-animaliers' },
  { mot: 'parc aventure accrobranche',           categorie: 'activites', theme: 'parcs-aventures' },
  { mot: 'complexe sportif',                     categorie: 'activites', theme: 'complexes-sportifs' },
  { mot: 'sports nautiques',                     categorie: 'activites', theme: 'sports-nautiques' },
  { mot: 'randonnée guidée',                     categorie: 'activites', theme: 'randonnee-trail' },
  { mot: 'pêche au gros',                        categorie: 'activites', theme: 'peche' },
  { mot: 'jardin botanique',                     categorie: 'activites', theme: 'parcs-botaniques' },
  { mot: 'musée patrimoine',                     categorie: 'activites', theme: 'culture-patrimoine' },
  { mot: 'centre commercial boutiques',          categorie: 'activites', theme: 'malls-shopping' },
  { mot: 'activités enfants famille',            categorie: 'activites', theme: 'activites-enfants-famille' },
  { mot: 'animation anniversaire enfant',        categorie: 'activites', theme: 'centres-loisirs-animations-enfants' },
  { mot: 'spa institut de beauté',               categorie: 'activites', theme: 'spa-bien-etre' },

  // --- Food ---
  { mot: 'restaurants',                          categorie: 'food',      theme: 'restaurants' },
  { mot: 'bars',                                 categorie: 'food',      theme: 'bars' },
  { mot: 'café terrasse',                        categorie: 'food',      theme: 'cafes-terrasses' },
  { mot: 'snack plage',                          categorie: 'food',      theme: 'snacks-plage' },
  { mot: 'table d\'hôtes',                       categorie: 'food',      theme: 'tables-hotes' },
  { mot: 'chef à domicile traiteur',             categorie: 'food',      theme: 'chefs-domicile' },
  { mot: 'supermarché hypermarché',              categorie: 'food',      theme: 'grandes-surfaces' },
  { mot: 'épicerie',                             categorie: 'food',      theme: 'epiceries-specialisees' },
  { mot: 'boucherie',                            categorie: 'food',      theme: 'boucheries' },
  { mot: 'poissonnerie',                         categorie: 'food',      theme: 'poissonneries' },
  { mot: 'marché',                               categorie: 'food',      theme: 'marches' },
  { mot: 'livraison repas à domicile',           categorie: 'food',      theme: 'livraisons' },
  { mot: 'boulangerie pâtisserie',               categorie: 'food',      theme: 'boulangeries' },

  // --- Utiles ---
  { mot: 'clinique privée',                      categorie: 'utiles',    theme: 'cliniques-privees' },
  { mot: 'poste de police',                      categorie: 'utiles',    theme: 'postes-police' },
  { mot: 'compagnie assurance',                  categorie: 'utiles',    theme: 'assurances' },
  { mot: 'banque',                               categorie: 'utiles',    theme: 'banques' },
  { mot: 'dépannage plombier électricien serrurier', categorie: 'utiles', theme: 'depannages' },
  { mot: 'taxi',                                 categorie: 'utiles',    theme: 'taxis' },
  { mot: 'transfert aéroport',                   categorie: 'utiles',    theme: 'transferts' },

  // --- Coaching ---
  { mot: 'coach sportif',                        categorie: 'coaching',  theme: 'sports-bien-etre' },
  { mot: 'coach business entreprise',            categorie: 'coaching',  theme: 'business' },
  { mot: 'coach parental famille',               categorie: 'coaching',  theme: 'famille' },

  // --- Seconde main ---
  { mot: 'brocante dépôt-vente meubles',         categorie: 'seconde-main', theme: 'equipement-maison' },
  { mot: 'voitures occasion',                    categorie: 'seconde-main', theme: 'voitures-2-roues' },
  { mot: 'friperie vêtements occasion',          categorie: 'seconde-main', theme: 'habits-adultes' },
  { mot: 'vêtements enfants occasion',           categorie: 'seconde-main', theme: 'habits-enfants' },
  { mot: 'livres jeux occasion',                 categorie: 'seconde-main', theme: 'jeux-livres' }
];

// Construit REQUETES = produit cartésien REGIONS × CATEGORIES.
const REQUETES = [];
for (const region of REGIONS) {
  for (const cat of CATEGORIES) {
    REQUETES.push({
      query: cat.mot + ' ' + region + ' Ile Maurice',
      categorie: cat.categorie,
      theme: cat.theme
    });
  }
}

// Colonnes du Sheet (la dernière, place_id, sert au dédoublonnage : masquable)
const ENTETES = [
  'Nom', 'Catégorie', 'Thème', 'Adresse', 'Téléphone', 'Site web',
  'Latitude', 'Longitude', 'Lien Google Maps', "Date d'import", 'Statut', 'place_id'
];

// Field mask MINIMAL : inclut téléphone + site web, SANS rating/reviews/atmosphere.
// places.id est gratuit (tier "ID only") et sert uniquement au dédoublonnage.
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.location',
  'places.types',
  'places.googleMapsUri',
  'nextPageToken'
].join(',');

// ============================ MENU DANS LE SHEET ============================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Annuaire Maurice+')
    .addItem('▶ Importer (île entière)', 'importerActivites')
    .addToUi();
}

// ============================ FONCTION PRINCIPALE ===========================
function importerActivites() {
  const feuille = SpreadsheetApp.getActiveSheet();

  // Vérif clé API
  if (!CONFIG.API_KEY || CONFIG.API_KEY.indexOf('COLLEZ') === 0) {
    throw new Error('⛔ Clé API manquante : ouvrez le script et remplacez COLLEZ_VOTRE_CLE_API_ICI par votre clé.');
  }

  // En-têtes si la feuille est vide
  if (feuille.getLastRow() === 0) {
    feuille.appendRow(ENTETES);
    feuille.getRange(1, 1, 1, ENTETES.length).setFontWeight('bold');
    feuille.setFrozenRows(1);
    console.log('En-têtes créés.');
  }

  // Charger les place_id déjà présents (pour dédoublonner)
  const idsExistants = chargerIdsExistants(feuille);
  console.log('place_id déjà en base : ' + idsExistants.size);
  console.log('Nombre de requêtes région×catégorie disponibles : ' + REQUETES.length);

  let compteurRequetes = 0;
  let totalEcrits = 0;
  const nouvellesLignes = [];
  const dateImport = new Date();

  for (const item of REQUETES) {
    if (compteurRequetes >= CONFIG.MAX_REQUETES) {
      console.warn('⚠️ Limite de ' + CONFIG.MAX_REQUETES + ' requêtes atteinte. Relancez le menu plus tard pour continuer (aucun doublon).');
      break;
    }

    let pageToken = null;
    for (let page = 0; page < CONFIG.PAGES_PAR_REQUETE; page++) {
      if (compteurRequetes >= CONFIG.MAX_REQUETES) break;

      compteurRequetes++;
      console.log('➡️  Requête #' + compteurRequetes + ' : "' + item.query + '" (page ' + (page + 1) + ')');

      const reponse = appelerTextSearch(item.query, pageToken);
      if (!reponse) break; // erreur API : on passe à la requête suivante

      const places = reponse.places || [];
      console.log('    ✔ ' + places.length + ' résultat(s) trouvé(s).');

      let ajoutes = 0;
      for (const p of places) {
        if (!p.id || idsExistants.has(p.id)) continue; // doublon → ignoré
        idsExistants.add(p.id);
        nouvellesLignes.push(construireLigne(p, item.categorie, item.theme, dateImport));
        totalEcrits++;
        ajoutes++;
      }
      console.log('    ➕ ' + ajoutes + ' nouvelle(s) fiche(s) (hors doublons).');

      pageToken = reponse.nextPageToken || null;
      if (!pageToken) break;
      Utilities.sleep(2000); // laisser le token de page suivante se propager
    }
  }

  // Écriture groupée (1 seule opération = rapide)
  if (nouvellesLignes.length > 0) {
    feuille.getRange(feuille.getLastRow() + 1, 1, nouvellesLignes.length, ENTETES.length)
           .setValues(nouvellesLignes);
    console.log('💾 Écriture effectuée : ' + nouvellesLignes.length + ' ligne(s) ajoutée(s).');
  } else {
    console.log('💾 Aucune nouvelle fiche à écrire.');
  }

  console.log('=========================================');
  console.log('✅ Terminé.');
  console.log('   Requêtes API utilisées : ' + compteurRequetes + ' / ' + REQUETES.length + ' disponibles (plafond ' + CONFIG.MAX_REQUETES + ')');
  console.log('   Nouvelles fiches écrites : ' + totalEcrits);
  if (compteurRequetes >= CONFIG.MAX_REQUETES && compteurRequetes < REQUETES.length) {
    console.log('   ↻ Relancez le menu pour traiter les requêtes restantes (aucun doublon créé).');
  }
  console.log('=========================================');

  SpreadsheetApp.getActiveSpreadsheet()
    .toast(totalEcrits + ' nouvelles fiches (' + compteurRequetes + ' requêtes API).', 'Import terminé', 8);
}

// ============================ APPEL API TEXT SEARCH =========================
function appelerTextSearch(texte, pageToken) {
  const url = 'https://places.googleapis.com/v1/places:searchText';

  const corps = {
    textQuery: texte,
    languageCode: CONFIG.LANGUE,
    regionCode: CONFIG.REGION,
    pageSize: 20,
    locationBias: {
      circle: {
        center: { latitude: CONFIG.CENTRE.latitude, longitude: CONFIG.CENTRE.longitude },
        radius: CONFIG.RAYON_METRES
      }
    }
  };
  if (pageToken) corps.pageToken = pageToken;

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'X-Goog-Api-Key': CONFIG.API_KEY,
      'X-Goog-FieldMask': FIELD_MASK
    },
    payload: JSON.stringify(corps),
    muteHttpExceptions: true
  };

  const res = UrlFetchApp.fetch(url, options);
  const code = res.getResponseCode();
  if (code !== 200) {
    console.error('    ⛔ Erreur API (HTTP ' + code + ') : ' + res.getContentText());
    return null;
  }
  return JSON.parse(res.getContentText());
}

// ============================ OUTILS ========================================
function construireLigne(p, categorie, theme, dateImport) {
  const nom = p.displayName ? p.displayName.text : '';
  const lat = p.location ? p.location.latitude : '';
  const lng = p.location ? p.location.longitude : '';
  return [
    nom,
    categorie,
    theme,
    p.formattedAddress || '',
    p.internationalPhoneNumber || '',
    p.websiteUri || '',
    lat,
    lng,
    p.googleMapsUri || '',
    dateImport,
    '',          // Statut : vide, à remplir plus tard ("vérifié" / "à vérifier")
    p.id || ''   // place_id : sert au dédoublonnage (colonne masquable)
  ];
}

function chargerIdsExistants(feuille) {
  const ids = new Set();
  const dernLigne = feuille.getLastRow();
  if (dernLigne < 2) return ids; // rien à part l'en-tête
  const colId = ENTETES.length;  // place_id = dernière colonne
  const valeurs = feuille.getRange(2, colId, dernLigne - 1, 1).getValues();
  for (const v of valeurs) {
    if (v[0]) ids.add(String(v[0]));
  }
  return ids;
}
