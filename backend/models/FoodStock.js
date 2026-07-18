const mongoose = require('mongoose');

const foodStockSchema = new mongoose.Schema({
  association: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Association',
    required: true,
    index: true
  },
  barcode: {
    type: String,
    trim: true
  },
  nom: {
    type: String,
    required: [true, 'Le nom est obligatoire'],
    trim: true,
    index: true
  },
  categorie: {
    type: String,
    required: [true, 'La catégorie est obligatoire'],
    enum: ['fruits-legumes', 'viandes-poissons', 'produits-laitiers', 'cereales-pains', 'conserves', 'boissons', 'epices-condiments', 'huiles-graisses', 'sucre-confiserie', 'produits-nettoyage', 'autres'],
    index: true
  },
  quantite: {
    type: Number,
    required: [true, 'La quantité est obligatoire'],
    min: [0, 'La quantité ne peut pas être négative']
  },
  unite: {
    type: String,
    required: [true, 'L\'unité est obligatoire'],
    enum: ['kg', 'g', 'L', 'ml', 'unités', 'boîtes', 'sachets', 'bouteilles', 'pièces', 'paquets']
  },
  quantiteInitiale: {
    type: Number,
    required: true
  },
  prix: {
    type: Number,
    required: [true, 'Le prix est obligatoire'],
    min: [0, 'Le prix ne peut pas être négatif']
  },
  dateAchat: {
    type: Date,
    required: [true, 'La date d\'achat est obligatoire'],
    default: Date.now
  },
  dateExpiration: {
    type: Date,
    required: false,
    index: true
  },
  seuilCritique: {
    type: Number,
    required: [true, 'Le seuil critique est obligatoire'],
    min: [0, 'Le seuil critique ne peut pas être négatif']
  },
  fournisseur: {
    type: String,
    trim: true
  },
  statut: {
    type: String,
    enum: ['disponible', 'faible', 'critique', 'expire'],
    default: 'disponible',
    index: true
  },
  emplacement: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  importBatchId: {
    type: String,
    index: true,
    sparse: true
  },
  historique: [{
    date: {
      type: Date,
      default: Date.now
    },
    action: {
      type: String,
      enum: ['ajout', 'consommation', 'modification', 'reapprovisionnement', 'sortie'],
      required: true
    },
    typeSortie: {
      type: String,
      enum: ['don', 'transfert', 'perte', 'expire_jete', 'retour_fournisseur', 'autre'],
      default: null
    },
    destination: {
      type: String,
      trim: true
    },
    quantite: Number,
    quantiteRestante: Number,
    utilisateur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }]
}, {
  timestamps: true
});

// Index composé pour les recherches fréquentes
foodStockSchema.index({ association: 1, barcode: 1 }, { unique: true, sparse: true });
foodStockSchema.index({ association: 1, statut: 1, dateExpiration: 1 });
foodStockSchema.index({ association: 1, categorie: 1, statut: 1 });

const computeFoodStockStatus = (quantite, seuilCritique, dateExpiration) => {
  const maintenant = new Date();

  if (dateExpiration) {
    const joursRestants = Math.ceil((dateExpiration - maintenant) / (1000 * 60 * 60 * 24));
    if (joursRestants <= 0) return 'expire';
  }

  if (quantite <= seuilCritique) return 'critique';
  if (quantite <= (seuilCritique * 1.5)) return 'faible';
  return 'disponible';
};

foodStockSchema.methods.recalculateStatus = function() {
  this.statut = computeFoodStockStatus(this.quantite, this.seuilCritique, this.dateExpiration);
  return this.statut;
};

foodStockSchema.statics.computeStatus = computeFoodStockStatus;

// Hook pre-save pour calculer automatiquement le statut
foodStockSchema.pre('save', function(next) {
  this.recalculateStatus();
  next();
});

// Méthode pour calculer la consommation journalière recommandée
foodStockSchema.methods.calculerConsommationJournaliere = function(joursRestants) {
  if (joursRestants <= 0) return 0;
  return Math.ceil(this.quantite / joursRestants);
};

// Méthode pour obtenir les jours restants avant expiration
foodStockSchema.methods.getJoursRestants = function() {
  if (!this.dateExpiration) return null;
  const maintenant = new Date();
  return Math.ceil((this.dateExpiration - maintenant) / (1000 * 60 * 60 * 24));
};

// Méthode pour enregistrer une consommation
foodStockSchema.methods.enregistrerConsommation = function(quantite, utilisateur, raison = '') {
  const quantiteDemandee = Number(quantite);
  if (!quantiteDemandee || quantiteDemandee <= 0) {
    throw new Error('La quantite doit etre superieure a 0');
  }
  if (quantiteDemandee > this.quantite) {
    throw new Error('Quantite demandee superieure au stock disponible');
  }

  this.quantite -= quantiteDemandee;
  
  this.historique.push({
    action: 'consommation',
    quantite: quantiteDemandee,
    quantiteRestante: this.quantite,
    utilisateur: utilisateur,
    notes: raison
  });

  this.recalculateStatus();
};

// Méthode pour enregistrer une sortie
foodStockSchema.methods.enregistrerSortie = function(quantite, utilisateur, typeSortie, destination = '', raison = '') {
  const quantiteDemandee = Number(quantite);
  if (!quantiteDemandee || quantiteDemandee <= 0) {
    throw new Error('La quantite doit etre superieure a 0');
  }
  if (quantiteDemandee > this.quantite) {
    throw new Error('Quantite demandee superieure au stock disponible');
  }

  this.quantite -= quantiteDemandee;
  
  this.historique.push({
    action: 'sortie',
    quantite: quantiteDemandee,
    quantiteRestante: this.quantite,
    utilisateur: utilisateur,
    typeSortie: typeSortie,
    destination: destination,
    notes: raison
  });

  this.recalculateStatus();
};

const FoodStock = mongoose.model('FoodStock', foodStockSchema);

module.exports = FoodStock;
