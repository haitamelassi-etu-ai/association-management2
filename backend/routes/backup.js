const express = require('express');
const multer = require('multer');
const router = express.Router();

const Announcement = require('../models/Announcement');
const Attendance = require('../models/Attendance');
const AuditLog = require('../models/AuditLog');
const Beneficiary = require('../models/Beneficiary');
const Distribution = require('../models/Distribution');
const FoodStock = require('../models/FoodStock');
const HealthRecord = require('../models/HealthRecord');
const Medication = require('../models/Medication');
const Notification = require('../models/Notification');
const PharmacyStock = require('../models/PharmacyStock');
const Room = require('../models/Room');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('Format non supporte. Utilisez un fichier JSON.'), false);
    }
  }
});

const BACKUP_VERSION = '2.0';

const getAssociationId = (req) => req.user?.association?._id || req.user?.association;

const objectIds = (documents) => documents.map((doc) => doc._id);

const collectionDefinitions = ({ associationId, beneficiaryIds, userIds }) => ({
  users: {
    model: User,
    query: { association: associationId },
    find: () => User.find({ association: associationId })
      .select('+password +twoFactorSecret +twoFactorTempSecret +twoFactorBackupCodes.code')
      .lean()
  },
  beneficiaries: {
    model: Beneficiary,
    query: { association: associationId },
    find: () => Beneficiary.find({ association: associationId }).lean()
  },
  distributions: {
    model: Distribution,
    query: { beneficiary: { $in: beneficiaryIds } },
    find: () => Distribution.find({ beneficiary: { $in: beneficiaryIds } }).lean()
  },
  foodStock: {
    model: FoodStock,
    query: { association: associationId },
    find: () => FoodStock.find({ association: associationId }).lean()
  },
  rooms: {
    model: Room,
    query: {},
    find: () => Room.find({}).lean()
  },
  attendance: {
    model: Attendance,
    query: { user: { $in: userIds } },
    find: () => Attendance.find({ user: { $in: userIds } }).lean()
  },
  announcements: {
    model: Announcement,
    query: { createdBy: { $in: userIds } },
    find: () => Announcement.find({ createdBy: { $in: userIds } }).lean()
  },
  notifications: {
    model: Notification,
    query: { $or: [{ recipient: { $in: userIds } }, { createdBy: { $in: userIds } }] },
    find: () => Notification.find({ $or: [{ recipient: { $in: userIds } }, { createdBy: { $in: userIds } }] }).lean()
  },
  auditLogs: {
    model: AuditLog,
    query: { association: associationId },
    find: () => AuditLog.find({ association: associationId }).lean()
  },
  healthRecords: {
    model: HealthRecord,
    query: { beneficiaire: { $in: beneficiaryIds } },
    find: () => HealthRecord.find({ beneficiaire: { $in: beneficiaryIds } }).lean()
  },
  medications: {
    model: Medication,
    query: { beneficiary: { $in: beneficiaryIds } },
    find: () => Medication.find({ beneficiary: { $in: beneficiaryIds } }).lean()
  },
  pharmacyStock: {
    model: PharmacyStock,
    query: { createdBy: { $in: userIds } },
    find: () => PharmacyStock.find({ createdBy: { $in: userIds } }).lean()
  }
});

const orderedRestoreCollections = [
  'users',
  'beneficiaries',
  'foodStock',
  'rooms',
  'attendance',
  'announcements',
  'notifications',
  'auditLogs',
  'distributions',
  'healthRecords',
  'pharmacyStock',
  'medications'
];

const buildBackup = async (req, type = 'all') => {
  const associationId = getAssociationId(req);
  if (!associationId) {
    const error = new Error('Association non configuree');
    error.statusCode = 403;
    throw error;
  }

  const beneficiaries = await Beneficiary.find({ association: associationId }).lean();
  const users = await User.find({ association: associationId })
    .select('+password +twoFactorSecret +twoFactorTempSecret +twoFactorBackupCodes.code')
    .lean();
  const beneficiaryIds = objectIds(beneficiaries);
  const userIds = objectIds(users);
  const definitions = collectionDefinitions({ associationId, beneficiaryIds, userIds });
  const selectedKeys = type === 'all' ? Object.keys(definitions) : [type];

  if (type !== 'all' && !definitions[type]) {
    const error = new Error('Type de sauvegarde inconnu');
    error.statusCode = 400;
    throw error;
  }

  const data = {};
  for (const key of selectedKeys) {
    if (key === 'beneficiaries') data[key] = beneficiaries;
    else if (key === 'users') data[key] = users;
    else data[key] = await definitions[key].find();
  }

  const counts = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, Array.isArray(value) ? value.length : 0])
  );

  return {
    version: BACKUP_VERSION,
    type,
    exportedAt: new Date().toISOString(),
    exportedBy: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role
    },
    association: {
      id: associationId,
      name: req.user.association?.name || null
    },
    counts,
    data
  };
};

router.get('/export/:type', protect, authorize('admin', 'responsable'), async (req, res) => {
  try {
    const backup = await buildBackup(req, req.params.type);

    await logAudit({
      user: req.user,
      action: 'backup',
      resource: 'backup',
      details: {
        type: backup.type,
        counts: backup.counts,
        version: backup.version
      },
      req
    });

    res.json({
      success: true,
      message: 'Sauvegarde creee avec succes',
      backup
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Erreur lors de la creation de la sauvegarde'
    });
  }
});

router.post('/restore', protect, authorize('admin'), upload.single('backup'), async (req, res) => {
  try {
    const confirmation = req.body.confirmation;
    if (confirmation !== 'RESTAURER') {
      return res.status(400).json({
        success: false,
        message: 'Confirmation requise. Tapez RESTAURER pour lancer la restauration.'
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucun fichier de sauvegarde fourni' });
    }

    const associationId = getAssociationId(req);
    if (!associationId) {
      return res.status(403).json({ success: false, message: 'Association non configuree' });
    }

    let backup;
    try {
      backup = JSON.parse(req.file.buffer.toString('utf8'));
    } catch {
      return res.status(400).json({ success: false, message: 'Fichier JSON invalide' });
    }

    if (!backup?.data || !backup?.version) {
      return res.status(400).json({ success: false, message: 'Format de sauvegarde invalide' });
    }

    if (backup.type && backup.type !== 'all') {
      return res.status(400).json({
        success: false,
        message: 'La restauration accepte uniquement une sauvegarde complete'
      });
    }

    const backupAssociationId = backup.association?.id?.toString();
    if (backupAssociationId && backupAssociationId !== associationId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cette sauvegarde appartient a une autre association'
      });
    }

    const existingBeneficiaries = await Beneficiary.find({ association: associationId }).select('_id').lean();
    const existingUsers = await User.find({ association: associationId }).select('_id').lean();
    const definitions = collectionDefinitions({
      associationId,
      beneficiaryIds: objectIds(existingBeneficiaries),
      userIds: objectIds(existingUsers)
    });

    const restored = {};
    for (const key of orderedRestoreCollections) {
      const docs = backup.data[key];
      if (!Array.isArray(docs) || !definitions[key]) continue;

      await definitions[key].model.deleteMany(definitions[key].query);
      if (docs.length > 0) {
        const sanitizedDocs = docs.map((doc) => ({
          ...doc,
          association: key === 'users' || key === 'beneficiaries' || key === 'foodStock' || key === 'auditLogs'
            ? associationId
            : doc.association
        }));
        await definitions[key].model.insertMany(sanitizedDocs, { ordered: false });
      }
      restored[key] = docs.length;
    }

    await logAudit({
      user: req.user,
      action: 'restore',
      resource: 'backup',
      details: {
        version: backup.version,
        type: backup.type || 'all',
        restored
      },
      req
    });

    res.json({
      success: true,
      message: 'Restauration terminee avec succes',
      restored
    });
  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la restauration'
    });
  }
});

router.get('/stats', protect, authorize('admin', 'responsable'), async (req, res) => {
  try {
    const associationId = getAssociationId(req);
    const beneficiaries = await Beneficiary.find({ association: associationId }).select('_id').lean();
    const users = await User.find({ association: associationId }).select('_id').lean();
    const beneficiaryIds = objectIds(beneficiaries);
    const userIds = objectIds(users);

    const stats = {
      beneficiaries: beneficiaries.length,
      users: users.length,
      foodStock: await FoodStock.countDocuments({ association: associationId }),
      distributions: await Distribution.countDocuments({ beneficiary: { $in: beneficiaryIds } }),
      rooms: await Room.countDocuments({}),
      attendance: await Attendance.countDocuments({ user: { $in: userIds } }),
      auditLogs: await AuditLog.countDocuments({ association: associationId }),
      healthRecords: await HealthRecord.countDocuments({ beneficiaire: { $in: beneficiaryIds } }),
      medications: await Medication.countDocuments({ beneficiary: { $in: beneficiaryIds } }),
      pharmacyStock: await PharmacyStock.countDocuments({ createdBy: { $in: userIds } }),
      lastChecked: new Date()
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error getting backup stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recuperation des statistiques'
    });
  }
});

module.exports = router;
