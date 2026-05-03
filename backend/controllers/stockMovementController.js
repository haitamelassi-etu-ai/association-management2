const StockMovement = require('../models/StockMovement');

exports.getAll = async (req, res) => {
  try {
    const { itemType, action, search, dateFrom, dateTo, userId, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (itemType) filter.itemType = itemType;
    if (action)   filter.action   = action;
    if (userId)   filter['performedBy.userId'] = userId;

    if (search) {
      const re = new RegExp(search, 'i');
      filter.$or = [
        { itemName: re },
        { reason: re },
        { 'performedBy.name': re },
        { 'performedBy.email': re }
      ];
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo)   filter.createdAt.$lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      StockMovement.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      StockMovement.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: items,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const [total, byType, byAction, last7days] = await Promise.all([
      StockMovement.countDocuments(),
      StockMovement.aggregate([{ $group: { _id: '$itemType', count: { $sum: 1 } } }]),
      StockMovement.aggregate([{ $group: { _id: '$action',   count: { $sum: 1 } } }]),
      StockMovement.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } })
    ]);

    res.json({
      success: true,
      data: {
        total,
        byType:   Object.fromEntries(byType.map(x   => [x._id, x.count])),
        byAction: Object.fromEntries(byAction.map(x => [x._id, x.count])),
        last7days
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
