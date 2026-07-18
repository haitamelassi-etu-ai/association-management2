const mongoose = require('mongoose');

const vehicleIncidentSchema = new mongoose.Schema({
  association: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Association',
    required: true,
    index: true
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TransportVehicle',
    required: true,
    index: true
  },
  description: {
    type: String,
    required: [true, 'La description est requise'],
    trim: true
  },
  status: {
    type: String,
    enum: ['en_cours', 'resolu'],
    default: 'en_cours'
  },
  date: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('VehicleIncident', vehicleIncidentSchema);
