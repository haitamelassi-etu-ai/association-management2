const mongoose = require('mongoose');

const transportVehicleSchema = new mongoose.Schema({
  association: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Association',
    required: true,
    index: true
  },
  matricule: {
    type: String,
    required: [true, 'La matricule est requise'],
    trim: true
  },
  marque: {
    type: String,
    trim: true
  },
  modele: {
    type: String,
    trim: true
  },
  statut: {
    type: String,
    enum: ['actif', 'en_panne', 'maintenance'],
    default: 'actif'
  },
  notes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

transportVehicleSchema.index({ association: 1, matricule: 1 }, { unique: true });

module.exports = mongoose.model('TransportVehicle', transportVehicleSchema);
