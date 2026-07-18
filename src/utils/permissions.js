export const ROLE_LABELS = {
  admin: 'Administrateur',
  responsable: 'Responsable',
  staff: 'Equipe',
  volunteer: 'Benevole'
};

export const MODULE_PERMISSIONS = {
  dashboard: ['admin', 'responsable', 'staff', 'volunteer'],
  analytics: ['admin', 'responsable'],
  advancedReports: ['admin', 'responsable'],
  reports: ['admin', 'responsable', 'staff'],
  beneficiaries: ['admin', 'responsable', 'staff'],
  attendance: ['admin', 'responsable', 'staff'],
  exitTracking: ['admin', 'responsable', 'staff'],
  visitors: ['admin', 'responsable', 'staff'],
  volunteers: ['admin', 'responsable', 'staff'],
  rooms: ['admin', 'responsable'],
  healthRecords: ['admin', 'responsable', 'staff'],
  pharmacy: ['admin', 'responsable', 'staff'],
  medications: ['admin', 'responsable', 'staff'],
  meals: ['admin', 'responsable', 'staff'],
  foodStock: ['admin', 'responsable', 'staff'],
  transport: ['admin', 'responsable', 'staff'],
  schedule: ['admin', 'responsable', 'staff', 'volunteer'],
  announcements: ['admin', 'responsable', 'staff', 'volunteer'],
  siteNews: ['admin'],
  communications: ['admin', 'responsable', 'staff'],
  notifications: ['admin', 'responsable', 'staff', 'volunteer'],
  tickets: ['admin', 'responsable', 'staff', 'volunteer'],
  approvals: ['admin', 'responsable'],
  auditLog: ['admin', 'responsable'],
  backup: ['admin', 'responsable'],
  integrations: ['admin'],
  exportReports: ['admin', 'responsable'],
  search: ['admin', 'responsable', 'staff'],
  twoFactor: ['admin', 'responsable', 'staff', 'volunteer'],
  settings: ['admin', 'responsable', 'staff', 'volunteer'],
  financial: ['admin', 'responsable'],
  documents: ['admin', 'responsable', 'staff'],
  adminPanel: ['admin']
};

export const PATH_PERMISSIONS = {
  '/professional/dashboard': 'dashboard',
  '/professional/analytics': 'analytics',
  '/professional/advanced-reports': 'advancedReports',
  '/professional/reports': 'reports',
  '/professional/beneficiaries': 'beneficiaries',
  '/professional/attendance': 'attendance',
  '/professional/exit-tracking': 'exitTracking',
  '/professional/visitors': 'visitors',
  '/professional/volunteers': 'volunteers',
  '/professional/rooms': 'rooms',
  '/professional/health-records': 'healthRecords',
  '/professional/pharmacy': 'pharmacy',
  '/professional/medications': 'medications',
  '/professional/meals': 'meals',
  '/professional/food-stock': 'foodStock',
  '/professional/transport': 'transport',
  '/professional/schedule': 'schedule',
  '/professional/announcements': 'announcements',
  '/professional/site-news': 'siteNews',
  '/professional/communications': 'communications',
  '/professional/notifications': 'notifications',
  '/professional/tickets': 'tickets',
  '/professional/approvals': 'approvals',
  '/professional/audit-log': 'auditLog',
  '/professional/backup': 'backup',
  '/professional/integrations': 'integrations',
  '/professional/export-reports': 'exportReports',
  '/professional/search': 'search',
  '/professional/two-factor': 'twoFactor',
  '/professional/settings': 'settings',
  '/professional/financial': 'financial',
  '/professional/documents': 'documents',
  '/admin': 'adminPanel'
};

const normalizeRole = (role) => (role === 'manager' ? 'responsable' : role);

export const canAccessModule = (user, moduleKey) => {
  if (!moduleKey) return true;

  const role = normalizeRole(user?.role);
  const allowedRoles = MODULE_PERMISSIONS[moduleKey] || [];
  if (!allowedRoles.includes(role)) return false;

  if (moduleKey === 'foodStock' && user?.association && !user.association.hasStock) return false;
  if (moduleKey === 'transport' && user?.association && !user.association.hasTransport) return false;

  return true;
};

export const canAccessPath = (user, path) => canAccessModule(user, PATH_PERMISSIONS[path]);

export const getRoleLabel = (role) => ROLE_LABELS[normalizeRole(role)] || role || 'Equipe';
