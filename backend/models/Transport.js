const mongoose = require('mongoose');

const entretienSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['vidange', 'pneus', 'reparation', 'revision', 'controle_technique', 'nettoyage', 'carburant', 'autre']
  },
  description: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now },
  cout: { type: Number, default: 0, min: 0 },
  kilometrage: { type: Number, min: 0 },
  prestataire: { type: String, trim: true },
  notes: { type: String },
  effectuePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const transportSchema = new mongoose.Schema({
  matricule: {
    type: String,
    required: [true, 'Le matricule est obligatoire'],
    unique: true,
    trim: true,
    uppercase: true,
    index: true
  },
  marque: {
    type: String,
    required: [true, 'La marque est obligatoire'],
    trim: true
  },
  modele: { type: String, trim: true },
  annee: {
    type: Number,
    min: [1990, 'Année invalide'],
    max: [new Date().getFullYear() + 1, 'Année invalide']
  },
  capacite: { type: Number, min: 1, default: 20 },
  couleur: { type: String, trim: true },
  statut: {
    type: String,
    enum: ['actif', 'maintenance', 'inactif'],
    default: 'actif',
    index: true
  },
  chauffeur: {
    nom: { type: String, trim: true },
    telephone: { type: String, trim: true },
    permis: { type: String, trim: true }
  },
  kilometrage: { type: Number, default: 0, min: 0 },
  assuranceExpiration: { type: Date, index: true },
  controleExpiration: { type: Date, index: true },
  notes: { type: String },
  historique: [entretienSchema]
}, { timestamps: true });

module.exports = mongoose.model('Transport', transportSchema);
