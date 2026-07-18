const TransportVehicle = require('../models/TransportVehicle');
const VehicleMaintenance = require('../models/VehicleMaintenance');
const VehicleIncident = require('../models/VehicleIncident');

const getAssociationId = (req) => req.user?.association?._id || req.user?.association;

// Vehicles
exports.getVehicles = async (req, res) => {
  try {
    const associationId = getAssociationId(req);
    const { status, search } = req.query;
    const filter = { association: associationId };

    if (status) {
      filter.statut = status;
    }

    if (search) {
      filter.$or = [
        { matricule: { $regex: search, $options: 'i' } },
        { marque: { $regex: search, $options: 'i' } },
        { modele: { $regex: search, $options: 'i' } }
      ];
    }

    const vehicles = await TransportVehicle.find(filter)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: vehicles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.createVehicle = async (req, res) => {
  try {
    const associationId = getAssociationId(req);
    const { matricule, marque, modele, statut, notes } = req.body;

    if (!matricule || !matricule.trim()) {
      return res.status(400).json({
        success: false,
        message: 'La matricule est requise'
      });
    }

    const normalizedMatricule = matricule.trim().toUpperCase();

    const vehicle = await TransportVehicle.create({
      association: associationId,
      matricule: normalizedMatricule,
      marque,
      modele,
      statut,
      notes,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Un vehicule avec cette matricule existe deja'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateVehicle = async (req, res) => {
  try {
    const associationId = getAssociationId(req);
    const { matricule, marque, modele, statut, notes } = req.body;

    const vehicle = await TransportVehicle.findOne({
      _id: req.params.id,
      association: associationId
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicule non trouve'
      });
    }

    if (matricule !== undefined) {
      vehicle.matricule = String(matricule).trim().toUpperCase();
    }
    if (marque !== undefined) vehicle.marque = marque;
    if (modele !== undefined) vehicle.modele = modele;
    if (statut !== undefined) vehicle.statut = statut;
    if (notes !== undefined) vehicle.notes = notes;

    await vehicle.save();

    res.json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Un vehicule avec cette matricule existe deja'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteVehicle = async (req, res) => {
  try {
    const associationId = getAssociationId(req);
    const vehicle = await TransportVehicle.findOne({
      _id: req.params.id,
      association: associationId
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicule non trouve'
      });
    }

    await VehicleMaintenance.deleteMany({ vehicle: vehicle._id, association: associationId });
    await VehicleIncident.deleteMany({ vehicle: vehicle._id, association: associationId });
    await vehicle.deleteOne();

    res.json({
      success: true,
      message: 'Vehicule supprime'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Maintenance
exports.getMaintenance = async (req, res) => {
  try {
    const associationId = getAssociationId(req);
    const { vehicleId } = req.query;
    const filter = { association: associationId };

    if (vehicleId) {
      filter.vehicle = vehicleId;
    }

    const items = await VehicleMaintenance.find(filter)
      .populate('vehicle', 'matricule marque modele')
      .sort({ date: -1 });

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.createMaintenance = async (req, res) => {
  try {
    const associationId = getAssociationId(req);
    const { vehicleId, type, date, cost, mechanic, notes } = req.body;

    if (!vehicleId || !type) {
      return res.status(400).json({
        success: false,
        message: 'Vehicule et type requis'
      });
    }

    const vehicle = await TransportVehicle.findOne({ _id: vehicleId, association: associationId });
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicule non trouve'
      });
    }

    const maintenance = await VehicleMaintenance.create({
      association: associationId,
      vehicle: vehicleId,
      type,
      date: date || Date.now(),
      cost: cost || 0,
      mechanic,
      notes,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: maintenance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateMaintenance = async (req, res) => {
  try {
    const associationId = getAssociationId(req);
    const { type, date, cost, mechanic, notes } = req.body;

    const maintenance = await VehicleMaintenance.findOne({
      _id: req.params.id,
      association: associationId
    });

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance non trouvee'
      });
    }

    if (type !== undefined) maintenance.type = type;
    if (date !== undefined) maintenance.date = date;
    if (cost !== undefined) maintenance.cost = cost;
    if (mechanic !== undefined) maintenance.mechanic = mechanic;
    if (notes !== undefined) maintenance.notes = notes;

    await maintenance.save();

    res.json({
      success: true,
      data: maintenance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteMaintenance = async (req, res) => {
  try {
    const associationId = getAssociationId(req);
    const maintenance = await VehicleMaintenance.findOne({
      _id: req.params.id,
      association: associationId
    });

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance non trouvee'
      });
    }

    await maintenance.deleteOne();

    res.json({
      success: true,
      message: 'Maintenance supprimee'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Incidents
exports.getIncidents = async (req, res) => {
  try {
    const associationId = getAssociationId(req);
    const { vehicleId, status } = req.query;
    const filter = { association: associationId };

    if (vehicleId) {
      filter.vehicle = vehicleId;
    }

    if (status) {
      filter.status = status;
    }

    const incidents = await VehicleIncident.find(filter)
      .populate('vehicle', 'matricule marque modele')
      .sort({ date: -1 });

    res.json({
      success: true,
      data: incidents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.createIncident = async (req, res) => {
  try {
    const associationId = getAssociationId(req);
    const { vehicleId, description, status } = req.body;

    if (!vehicleId || !description) {
      return res.status(400).json({
        success: false,
        message: 'Vehicule et description requis'
      });
    }

    const vehicle = await TransportVehicle.findOne({ _id: vehicleId, association: associationId });
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicule non trouve'
      });
    }

    const incident = await VehicleIncident.create({
      association: associationId,
      vehicle: vehicleId,
      description,
      status: status || 'en_cours',
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: incident
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateIncident = async (req, res) => {
  try {
    const associationId = getAssociationId(req);
    const { description, status } = req.body;

    const incident = await VehicleIncident.findOne({
      _id: req.params.id,
      association: associationId
    });

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident non trouve'
      });
    }

    if (description !== undefined) incident.description = description;
    if (status !== undefined) incident.status = status;

    await incident.save();

    res.json({
      success: true,
      data: incident
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.resolveIncident = async (req, res) => {
  try {
    const associationId = getAssociationId(req);
    const incident = await VehicleIncident.findOne({
      _id: req.params.id,
      association: associationId
    });

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident non trouve'
      });
    }

    incident.status = 'resolu';
    incident.resolvedAt = new Date();
    await incident.save();

    res.json({
      success: true,
      data: incident
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteIncident = async (req, res) => {
  try {
    const associationId = getAssociationId(req);
    const incident = await VehicleIncident.findOne({
      _id: req.params.id,
      association: associationId
    });

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident non trouve'
      });
    }

    await incident.deleteOne();

    res.json({
      success: true,
      message: 'Incident supprime'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
