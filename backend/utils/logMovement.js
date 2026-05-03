const StockMovement = require('../models/StockMovement');

/**
 * Log a stock movement. Failures are silent (won't break the main operation).
 */
async function logMovement({ user, itemType, itemId, itemName, action, before, after, reason, unite }) {
  try {
    await StockMovement.create({
      itemType,
      itemId,
      itemName,
      action,
      quantityBefore: before,
      quantityAfter:  after,
      quantityChange: (after != null && before != null) ? (after - before) : undefined,
      unite,
      reason,
      performedBy: user ? {
        userId: user._id,
        name:   `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email,
        email:  user.email,
        role:   user.role
      } : undefined
    });
  } catch (e) {
    console.warn('[logMovement] failed:', e.message);
  }
}

module.exports = { logMovement };
