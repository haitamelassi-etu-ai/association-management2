/**
 * Script de données de démonstration — Association Al Amal
 * Usage : node scripts/seedData.js
 *
 * Ajoute :
 *   - 2 véhicules
 *   - 5 produits alimentaires
 *   - 5 matériels médicaux
 *   - 2 utilisateurs (responsable + personnel)
 *
 * Ne touche pas au compte admin existant.
 * Peut être relancé plusieurs fois (vérifie avant d'insérer).
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const User        = require('../models/User');
const FoodStock   = require('../models/FoodStock');
const MedicalStock = require('../models/MedicalStock');
const Transport   = require('../models/Transport');

// ─── helpers ─────────────────────────────────────────────────────────────────

const date = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d;
};

// ─── données ─────────────────────────────────────────────────────────────────

const USERS = [
  {
    prenom: 'Youssef', nom: 'Benali',
    email: 'youssef.benali@alawal.ma',
    password: 'Staff2024',
    role: 'responsable',
    poste: 'Responsable des stocks',
    telephone: '+212 6 61 23 45 67',
  },
  {
    prenom: 'Fatima', nom: 'El Amrani',
    email: 'fatima.elamrani@alawal.ma',
    password: 'Staff2024',
    role: 'staff',
    poste: 'Agente de terrain',
    telephone: '+212 6 72 34 56 78',
  },
];

const VEHICLES = [
  {
    matricule: '23456-A-7',
    marque: 'Mercedes-Benz',
    modele: 'Sprinter 315',
    annee: 2019,
    capacite: 16,
    couleur: 'Blanc',
    statut: 'actif',
    kilometrage: 87420,
    chauffeur: {
      nom: 'Khalid Moussaoui',
      telephone: '+212 6 55 44 33 22',
      permis: 'D - 2018',
    },
    assuranceExpiration:    date(210),
    controleExpiration:     date(95),
    carteGriseNumero:       'CG-23456-A-7-2019',
    dateMiseEnCirculation:  new Date('2019-03-15'),
    dateExpirationCarteGrise: date(380),
    notes: 'Minibus principal pour le transport des résidents',
    historique: [
      {
        type: 'vidange',
        description: 'Vidange huile moteur + filtre',
        date: date(-45),
        cout: 650,
        kilometrage: 85000,
        prestataire: 'Garage Al Fath – Casablanca',
      },
      {
        type: 'pneus',
        description: 'Remplacement 4 pneus avant/arrière',
        date: date(-120),
        cout: 2400,
        kilometrage: 80000,
        prestataire: 'Pneus Maghreb',
      },
    ],
    mouchard: [
      {
        dateDepart:        date(-3),
        dateRetour:        date(-3),
        destination:       'Hôpital Ibn Rochd – Casablanca',
        conducteur:        'Khalid Moussaoui',
        kilometrageDepart: 87300,
        kilometrageRetour: 87360,
        commentaire:       'Transport de 6 résidents pour consultation médicale',
      },
      {
        dateDepart:        date(-7),
        dateRetour:        date(-7),
        destination:       'Marché de gros Derb Sultan',
        conducteur:        'Khalid Moussaoui',
        kilometrageDepart: 87220,
        kilometrageRetour: 87300,
        commentaire:       'Collecte de dons alimentaires',
      },
    ],
  },
  {
    matricule: '78901-B-3',
    marque: 'Renault',
    modele: 'Trafic L2H1',
    annee: 2021,
    capacite: 9,
    couleur: 'Gris',
    statut: 'actif',
    kilometrage: 34800,
    chauffeur: {
      nom: 'Omar Tahiri',
      telephone: '+212 6 61 88 77 55',
      permis: 'B - 2015',
    },
    assuranceExpiration:    date(310),
    controleExpiration:     date(180),
    carteGriseNumero:       'CG-78901-B-3-2021',
    dateMiseEnCirculation:  new Date('2021-06-01'),
    dateExpirationCarteGrise: date(545),
    notes: 'Véhicule utilitaire — livraisons et collectes',
    historique: [
      {
        type: 'revision',
        description: 'Révision complète 30 000 km',
        date: date(-20),
        cout: 1100,
        kilometrage: 30000,
        prestataire: 'Renault Casablanca Centre',
      },
    ],
    mouchard: [
      {
        dateDepart:        date(-1),
        destination:       'Donation Carrefour Ain Sebaâ',
        conducteur:        'Omar Tahiri',
        kilometrageDepart: 34750,
        commentaire:       'Collecte en cours',
      },
    ],
  },
];

const FOOD_ITEMS = [
  {
    nom: 'Semoule fine',
    categorie: 'cereales-pains',
    quantite: 180,
    quantiteInitiale: 200,
    unite: 'kg',
    prix: 8,
    seuilCritique: 30,
    fournisseur: 'Minoterie Atlas – Casablanca',
    emplacement: 'Entrepôt A – Étagère 1',
    dateAchat: date(-12),
    dateExpiration: date(180),
    type: 'alimentaire',
    notes: 'Semoule pour couscous du vendredi',
  },
  {
    nom: 'Huile de table',
    categorie: 'huiles-graisses',
    quantite: 48,
    quantiteInitiale: 60,
    unite: 'bouteilles',
    prix: 22,
    seuilCritique: 10,
    fournisseur: 'Lesieur Cristal',
    emplacement: 'Entrepôt A – Étagère 2',
    dateAchat: date(-8),
    dateExpiration: date(365),
    type: 'alimentaire',
  },
  {
    nom: 'Sucre en poudre',
    categorie: 'sucre-confiserie',
    quantite: 95,
    quantiteInitiale: 100,
    unite: 'kg',
    prix: 9,
    seuilCritique: 15,
    fournisseur: 'COSUMAR',
    emplacement: 'Entrepôt A – Étagère 1',
    dateAchat: date(-5),
    dateExpiration: date(540),
    type: 'alimentaire',
  },
  {
    nom: 'Riz thaï',
    categorie: 'cereales-pains',
    quantite: 12,
    quantiteInitiale: 80,
    unite: 'kg',
    prix: 15,
    seuilCritique: 20,
    fournisseur: 'Grossiste El Ouardia',
    emplacement: 'Entrepôt A – Étagère 3',
    dateAchat: date(-30),
    dateExpiration: date(240),
    type: 'alimentaire',
    notes: '⚠️ Stock faible — réapprovisionner',
  },
  {
    nom: 'Conserves de tomates',
    categorie: 'conserves',
    quantite: 144,
    quantiteInitiale: 144,
    unite: 'boîtes',
    prix: 7,
    seuilCritique: 24,
    fournisseur: 'Aïcha – Conserves du Maroc',
    emplacement: 'Entrepôt B – Étagère 1',
    dateAchat: date(-3),
    dateExpiration: date(720),
    type: 'alimentaire',
  },
];

const MEDICAL_ITEMS = [
  {
    nom: 'Fauteuil roulant',
    categorie: 'mobilite',
    quantite: 4,
    unite: 'pièces',
    etat: 'bon',
    statut: 'disponible',
    valeur: 1800,
    fournisseur: 'Médical Plus – Casablanca',
    emplacement: 'Salle médicale – Couloir',
    dateAcquisition: new Date('2023-09-01'),
    notes: '2 pliants, 2 fixes',
  },
  {
    nom: 'Béquilles réglables',
    categorie: 'mobilite',
    quantite: 6,
    unite: 'paires',
    etat: 'bon',
    statut: 'disponible',
    valeur: 250,
    fournisseur: 'Médical Plus – Casablanca',
    emplacement: 'Salle médicale – Armoire 1',
    dateAcquisition: new Date('2023-09-01'),
  },
  {
    nom: 'Tensiomètre électronique',
    categorie: 'diagnostic',
    quantite: 2,
    unite: 'pièces',
    etat: 'bon',
    statut: 'disponible',
    valeur: 650,
    fournisseur: 'Omron Maroc',
    emplacement: 'Salle médicale – Bureau infirmier',
    dateAcquisition: new Date('2024-01-15'),
    numeroSerie: 'OMR-2024-0087',
  },
  {
    nom: 'Lit médicalisé',
    categorie: 'rehabilitation',
    quantite: 1,
    unite: 'pièces',
    etat: 'endommage',
    statut: 'maintenance',
    valeur: 4500,
    fournisseur: 'Équipements Hospitaliers SARL',
    emplacement: 'Salle de soins',
    dateAcquisition: new Date('2022-06-10'),
    notes: 'Mécanisme de réglage défaillant — en attente de réparation',
  },
  {
    nom: 'Kit premiers secours',
    categorie: 'soins',
    quantite: 3,
    unite: 'boîtes',
    etat: 'bon',
    statut: 'disponible',
    valeur: 320,
    fournisseur: 'Pharmacie Al Amal – Ain Sebaâ',
    emplacement: 'Salle médicale + 2 postes',
    dateAcquisition: date(-15),
    notes: 'À renouveler tous les 6 mois',
  },
];

// ─── main ─────────────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connecté\n');

  // ── Utilisateurs ──────────────────────────────────────
  console.log('👤 Ajout des utilisateurs...');
  for (const u of USERS) {
    const exists = await User.findOne({ email: u.email });
    if (exists) {
      console.log(`   ⏭️  ${u.prenom} ${u.nom} — déjà existant`);
      continue;
    }
    await User.create(u);
    console.log(`   ✅ ${u.prenom} ${u.nom} (${u.role}) — ${u.email} / ${u.password}`);
  }

  // ── Véhicules ─────────────────────────────────────────
  console.log('\n🚌 Ajout des véhicules...');
  for (const v of VEHICLES) {
    const exists = await Transport.findOne({ matricule: v.matricule });
    if (exists) {
      console.log(`   ⏭️  ${v.marque} ${v.modele} (${v.matricule}) — déjà existant`);
      continue;
    }
    await Transport.create(v);
    console.log(`   ✅ ${v.marque} ${v.modele} — ${v.matricule}`);
  }

  // ── Stock alimentaire ─────────────────────────────────
  console.log('\n🍎 Ajout du stock alimentaire...');
  for (const f of FOOD_ITEMS) {
    const exists = await FoodStock.findOne({ nom: f.nom });
    if (exists) {
      console.log(`   ⏭️  ${f.nom} — déjà existant`);
      continue;
    }
    await FoodStock.create(f);
    console.log(`   ✅ ${f.nom} — ${f.quantite} ${f.unite}`);
  }

  // ── Matériel médical ──────────────────────────────────
  console.log('\n🏥 Ajout du matériel médical...');
  for (const m of MEDICAL_ITEMS) {
    const exists = await MedicalStock.findOne({ nom: m.nom });
    if (exists) {
      console.log(`   ⏭️  ${m.nom} — déjà existant`);
      continue;
    }
    await MedicalStock.create(m);
    console.log(`   ✅ ${m.nom} — ${m.quantite} ${m.unite} (${m.etat})`);
  }

  // ── Résumé ─────────────────────────────────────────────
  console.log('\n══════════════════════════════════════');
  console.log('🎉 Données de démonstration ajoutées !');
  console.log('══════════════════════════════════════');
  console.log('\n📋 Comptes disponibles :');
  console.log('   admin@alawal.ma           → AlAmal2024  (Admin)');
  console.log('   youssef.benali@alawal.ma  → Staff2024   (Responsable)');
  console.log('   fatima.elamrani@alawal.ma → Staff2024   (Personnel)');
  console.log('\n🌐 Ouvrir : http://localhost:5173');

  process.exit(0);
}

seed().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
