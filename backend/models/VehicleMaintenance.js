const mongoose = require('mongoose');

const vehicleMaintenanceSchema = new mongoose.Schema({
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
  type: {
    type: String,
    required: [true, 'Le type est requis'],
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  cost: {
    type: Number,
    default: 0,
    min: 0
  },
  mechanic: {
    type: String,
    trim: true
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

module.exports = mongoose.model('VehicleMaintenance', vehicleMaintenanceSchema);
