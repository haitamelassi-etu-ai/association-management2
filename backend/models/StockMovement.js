const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema({
  itemType: {
    type: String,
    enum: ['food', 'medical'],
    required: true,
    index: true
  },
  itemId:   { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  itemName: { type: String, required: true },
  action: {
    type: String,
    enum: ['create', 'update', 'add', 'remove', 'consume', 'delete'],
    required: true,
    index: true
  },
  quantityBefore: { type: Number },
  quantityAfter:  { type: Number },
  quantityChange: { type: Number },
  unite:  { type: String },
  reason: { type: String },
  performedBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name:   { type: String },
    email:  { type: String },
    role:   { type: String }
  }
}, { timestamps: true });

stockMovementSchema.index({ createdAt: -1 });

module.exports = mongoose.model('StockMovement', stockMovementSchema);
