const mongoose = require('mongoose');

const medicalStockSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom est obligatoire'],
    trim: true,
    index: true
  },
  categorie: {
    type: String,
    required: true,
    enum: ['mobilite', 'soins', 'diagnostic', 'rehabilitation', 'hygiene', 'autre'],
    default: 'autre',
    index: true
  },
  quantite: {
    type: Number,
    required: true,
    default: 1,
    min: [0, 'La quantité ne peut pas être négative']
  },
  unite: {
    type: String,
    default: 'pièces',
    enum: ['pièces', 'unités', 'boîtes', 'paires', 'lots']
  },
  etat: {
    type: String,
    enum: ['bon', 'endommage', 'hors_service'],
    default: 'bon',
    index: true
  },
  statut: {
    type: String,
    enum: ['disponible', 'en_pret', 'maintenance', 'hors_service'],
    default: 'disponible',
    index: true
  },
  fournisseur:      { type: String, trim: true },
  emplacement:      { type: String, trim: true },
  dateAcquisition:  { type: Date, default: Date.now },
  valeur:           { type: Number, default: 0, min: 0 },
  numeroSerie:      { type: String, trim: true },
  notes:            { type: String, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('MedicalStock', medicalStockSchema);
