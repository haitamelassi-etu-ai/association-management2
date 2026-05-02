const MedicalStock = require('../models/MedicalStock');

exports.getAll = async (req, res) => {
  try {
    const { etat, statut, categorie, search } = req.query;
    const filter = {};
    if (etat)     filter.etat     = etat;
    if (statut)   filter.statut   = statut;
    if (categorie) filter.categorie = categorie;
    if (search) {
      const re = new RegExp(search, 'i');
      filter.$or = [{ nom: re }, { fournisseur: re }, { emplacement: re }, { numeroSerie: re }];
    }
    const items = await MedicalStock.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: items, total: items.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const item = await MedicalStock.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const item = await MedicalStock.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Article non trouvé' });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const item = await MedicalStock.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Article non trouvé' });
    res.json({ success: true, message: 'Article supprimé' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const items = await MedicalStock.find({});
    const total = items.length;
    const byEtat    = {};
    const byStatut  = {};
    const byCategorie = {};
    let valeurTotale = 0;

    items.forEach(i => {
      byEtat[i.etat]       = (byEtat[i.etat]       || 0) + 1;
      byStatut[i.statut]   = (byStatut[i.statut]   || 0) + 1;
      byCategorie[i.categorie] = (byCategorie[i.categorie] || 0) + 1;
      valeurTotale += (i.valeur || 0) * i.quantite;
    });

    res.json({ success: true, data: { total, byEtat, byStatut, byCategorie, valeurTotale } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
