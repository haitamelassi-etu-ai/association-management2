const Transport = require('../models/Transport');

// ─── List all buses ───────────────────────────────────────────────────────────
exports.getAllTransports = async (req, res) => {
  try {
    const { search, statut, page = 1, limit = 100 } = req.query;
    const query = {};

    if (statut) query.statut = statut;
    if (search) {
      const re = new RegExp(search, 'i');
      query.$or = [{ matricule: re }, { marque: re }, { modele: re }, { 'chauffeur.nom': re }];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [data, total] = await Promise.all([
      Transport.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Transport.countDocuments(query)
    ]);

    res.json({ success: true, data, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Get single bus ───────────────────────────────────────────────────────────
exports.getTransport = async (req, res) => {
  try {
    const bus = await Transport.findById(req.params.id)
      .populate('historique.effectuePar', 'nom prenom');
    if (!bus) return res.status(404).json({ success: false, message: 'Véhicule non trouvé' });
    res.json({ success: true, data: bus });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Create bus ───────────────────────────────────────────────────────────────
exports.createTransport = async (req, res) => {
  try {
    const bus = await Transport.create({ ...req.body });
    res.status(201).json({ success: true, data: bus });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Ce matricule existe déjà' });
    }
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─── Update bus ───────────────────────────────────────────────────────────────
exports.updateTransport = async (req, res) => {
  try {
    // Prevent overwriting historique via a general update
    delete req.body.historique;
    const bus = await Transport.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!bus) return res.status(404).json({ success: false, message: 'Véhicule non trouvé' });
    res.json({ success: true, data: bus });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Ce matricule existe déjà' });
    }
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─── Delete bus ───────────────────────────────────────────────────────────────
exports.deleteTransport = async (req, res) => {
  try {
    const bus = await Transport.findByIdAndDelete(req.params.id);
    if (!bus) return res.status(404).json({ success: false, message: 'Véhicule non trouvé' });
    res.json({ success: true, message: 'Véhicule supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Add maintenance record ───────────────────────────────────────────────────
exports.addMaintenance = async (req, res) => {
  try {
    const bus = await Transport.findById(req.params.id);
    if (!bus) return res.status(404).json({ success: false, message: 'Véhicule non trouvé' });

    const entretien = {
      ...req.body,
      ...(req.user ? { effectuePar: req.user._id } : {})
    };

    // Update bus kilometrage if provided and higher
    if (entretien.kilometrage && entretien.kilometrage > bus.kilometrage) {
      bus.kilometrage = entretien.kilometrage;
    }

    bus.historique.unshift(entretien);
    await bus.save();

    res.status(201).json({ success: true, data: bus.historique[0], bus });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─── Delete maintenance record ────────────────────────────────────────────────
exports.deleteMaintenance = async (req, res) => {
  try {
    const bus = await Transport.findById(req.params.id);
    if (!bus) return res.status(404).json({ success: false, message: 'Véhicule non trouvé' });

    bus.historique = bus.historique.filter(
      (e) => e._id.toString() !== req.params.entretienId
    );
    await bus.save();

    res.json({ success: true, message: 'Entretien supprimé' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Dashboard statistics ─────────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const buses = await Transport.find({});

    const counts = { total: buses.length, actif: 0, maintenance: 0, inactif: 0 };
    buses.forEach((b) => { counts[b.statut] = (counts[b.statut] || 0) + 1; });

    // Flatten all maintenance records
    const allEntretiens = buses.flatMap((b) =>
      b.historique.map((e) => ({ ...e.toObject(), bus: { _id: b._id, matricule: b.matricule, marque: b.marque } }))
    );

    // Cost by type
    const costByType = {};
    allEntretiens.forEach(({ type, cout }) => {
      if (!costByType[type]) costByType[type] = { count: 0, total: 0 };
      costByType[type].count += 1;
      costByType[type].total += cout || 0;
    });
    const maintenanceCostByType = Object.entries(costByType).map(([type, v]) => ({
      type,
      count: v.count,
      totalCost: v.total
    }));

    // Total cost
    const totalMaintenanceCost = allEntretiens.reduce((sum, e) => sum + (e.cout || 0), 0);

    // Recent 5 records
    const recentMaintenance = allEntretiens
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    // Expiring documents (next 30 days)
    const in30days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const expiringDocs = buses.filter(
      (b) =>
        (b.assuranceExpiration && new Date(b.assuranceExpiration) <= in30days) ||
        (b.controleExpiration && new Date(b.controleExpiration) <= in30days)
    ).length;

    res.json({
      success: true,
      data: { counts, maintenanceCostByType, totalMaintenanceCost, recentMaintenance, expiringDocs }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── All maintenance history (paginated, filterable) ─────────────────────────
exports.getMaintenanceHistory = async (req, res) => {
  try {
    const { busId, type, dateFrom, dateTo, page = 1, limit = 50 } = req.query;

    const busQuery = {};
    if (busId) busQuery._id = busId;

    const buses = await Transport.find(busQuery, 'matricule marque historique');

    let allEntretiens = buses.flatMap((b) =>
      b.historique.map((e) => ({
        ...e.toObject(),
        bus: { _id: b._id, matricule: b.matricule, marque: b.marque }
      }))
    );

    // Filters
    if (type) allEntretiens = allEntretiens.filter((e) => e.type === type);
    if (dateFrom) allEntretiens = allEntretiens.filter((e) => new Date(e.date) >= new Date(dateFrom));
    if (dateTo) allEntretiens = allEntretiens.filter((e) => new Date(e.date) <= new Date(dateTo));

    // Sort by date desc
    allEntretiens.sort((a, b) => new Date(b.date) - new Date(a.date));

    const total = allEntretiens.length;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const data = allEntretiens.slice(skip, skip + parseInt(limit));

    res.json({ success: true, data, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
