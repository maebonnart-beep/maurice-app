/**
 * ============================================================================
 * ANNUAIRE GRAND BAIE — Import Google Places (New)
 * MVP catégorie "Activités & loisirs"
 * ----------------------------------------------------------------------------
 * Ce script interroge l'API Google Places (New) - Text Search pour plusieurs
 * requêtes ciblées, puis écrit chaque lieu dans la feuille Google Sheet active.
 * Il déduplique par place_id et bride le nombre d'appels API par exécution.
 * ============================================================================
 */

// ============================ CONFIGURATION =================================
const CONFIG = {
  // 1) Collez votre clé API Google Places entre les guillemets ci-dessous :
  API_KEY: 'COLLEZ_VOTRE_CLE_API_ICI',

  // 2) Garde-fou budgétaire : nb MAX d'appels API par exécution
  MAX_REQUETES: 200,

  // 3) Pagination : nb de pages par requête (1 page = 20 résultats max ; 3 = 60 max)
  PAGES_PAR_REQUETE: 2,

  // 4) Centre approximatif de Grand Baie (cible géographiquement les résultats)
  CENTRE: { latitude: -20.0064, longitude: 57.5802 },
  RAYON_METRES: 6000,

  // 5) Langue et région
  LANGUE: 'fr',
  REGION: 'MU'
};

// Requêtes ciblées (sous-catégories). "categorie" = libellé écrit dans le Sheet.
const REQUETES = [
  { query: 'excursions Grand Baie Ile Maurice',        categorie: 'Excursions' },
  { query: 'sports nautiques Grand Baie Ile Maurice',  categorie: 'Sports nautiques' },
  { query: 'plongée sous-marine Grand Baie',           categorie: 'Plongée' },
  { query: 'snorkeling Grand Baie',                    categorie: 'Snorkeling' },
  { query: 'randonnée Grand Baie Ile Maurice',         categorie: 'Randonnée' },
  { query: 'spa bien-être Grand Baie',                 categorie: 'Spa & bien-être' },
  { query: 'golf Grand Baie Ile Maurice',              categorie: 'Golf' },
  { query: 'visites guidées Grand Baie',               categorie: 'Visites guidées' },
  { query: 'croisière catamaran Grand Baie',           categorie: 'Croisières / Catamaran' },
  { query: 'pêche au gros Grand Baie',                 categorie: 'Pêche au gros' },
  { query: 'kitesurf Grand Baie',                      categorie: 'Kitesurf / Glisse' },
  { query: 'location jet ski Grand Baie',              categorie: 'Jet ski' },
  { query: 'quad buggy Grand Baie',                    categorie: 'Quad & Buggy' },
  { query: 'parachute ascensionnel Grand Baie',        categorie: 'Parasailing' },
  { query: 'activités loisirs Grand Baie Ile Maurice', categorie: 'Activités & loisirs' },

  { query: 'restaurants Grand Baie Ile Maurice',        categorie: 'restaurants' },
  { query: 'bars Grand Baie Ile Maurice',                categorie: 'restaurants' },
  { query: 'boutiques Grand Baie Ile Maurice',           categorie: 'shopping' },
  { query: 'salon de beauté Grand Baie Ile Maurice',     categorie: 'shopping' }
];

// Colonnes du Sheet (la dernière, place_id, sert au dédoublonnage : masquable)
const ENTETES = [
  'Nom', 'Catégorie', 'Adresse', 'Téléphone', 'Site web',
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
    .createMenu('Annuaire Grand Baie')
    .addItem('▶ Importer les activités', 'importerActivites')
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

  let compteurRequetes = 0;
  let totalEcrits = 0;
  const nouvellesLignes = [];
  const dateImport = new Date();

  for (const item of REQUETES) {
    if (compteurRequetes >= CONFIG.MAX_REQUETES) {
      console.warn('⚠️ Limite de ' + CONFIG.MAX_REQUETES + ' requêtes atteinte. Arrêt.');
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
        nouvellesLignes.push(construireLigne(p, item.categorie, dateImport));
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
  console.log('   Requêtes API utilisées : ' + compteurRequetes + ' / ' + CONFIG.MAX_REQUETES);
  console.log('   Nouvelles fiches écrites : ' + totalEcrits);
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
function construireLigne(p, categorie, dateImport) {
  const nom = p.displayName ? p.displayName.text : '';
  const lat = p.location ? p.location.latitude : '';
  const lng = p.location ? p.location.longitude : '';
  return [
    nom,
    categorie,
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
