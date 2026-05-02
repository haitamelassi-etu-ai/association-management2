// Notifications disabled — stubs to avoid breaking existing imports
const createNotification = async () => null;
const notifyAdmins      = async () => true;
const notifyAllStaff    = async () => true;
const notificationTemplates = {};

module.exports = { createNotification, notifyAdmins, notifyAllStaff, notificationTemplates };
