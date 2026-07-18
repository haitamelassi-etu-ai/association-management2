const mongoose = require('mongoose');

const associationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true,
    index: true
  },
  logoUrl: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  hasStock: {
    type: Boolean,
    default: true
  },
  hasTransport: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

associationSchema.index({ name: 1 });
associationSchema.index({ isDefault: 1 });

module.exports = mongoose.model('Association', associationSchema);
