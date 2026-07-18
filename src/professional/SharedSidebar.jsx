import { Link, useLocation } from 'react-router-dom';
import { useMemo, useState } from 'react';
import {
  LayoutDashboard,
  LineChart,
  Users,
  ClipboardCheck,
  LogOut as ExitDoor,
  Megaphone,
  Newspaper,
  Boxes,
  Truck,
  FileText,
  BarChart3,
  HardDriveDownload,
  UtensilsCrossed,
  Stethoscope,
  Pill,
  CalendarDays,
  TicketCheck,
  FolderOpen,
  CheckCircle2,
  ScrollText,
  DoorOpen,
  HandHeart,
  Wallet,
  BedDouble,
  Heart,
  MessagesSquare,
  Plug,
  Bell,
  Upload,
  Search,
  Settings,
  ShieldCheck,
  ShieldUser,
  Menu,
  X,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { canAccessPath, getRoleLabel } from '../utils/permissions';

const normalize = (value) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const ProfessionalSidebar = ({ user, onLogout }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [collapsedSections, setCollapsedSections] = useState({});

  const hasStock = user?.association ? Boolean(user.association.hasStock) : true;
  const hasTransport = user?.association ? Boolean(user.association.hasTransport) : false;

  const sections = useMemo(() => [
    {
      id: 'overview',
      label: "Vue d'ensemble",
      items: [
        { path: '/professional/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
        { path: '/professional/analytics', icon: LineChart, label: 'Analytique' },
        { path: '/professional/advanced-reports', icon: BarChart3, label: 'Rapports avancés' },
        { path: '/professional/reports', icon: FileText, label: 'Rapports' }
      ]
    },
    {
      id: 'people',
      label: 'Accueil & suivi',
      items: [
        { path: '/professional/beneficiaries', icon: Users, label: 'Bénéficiaires' },
        { path: '/professional/attendance', icon: ClipboardCheck, label: 'Pointage staff' },
        { path: '/professional/exit-tracking', icon: ExitDoor, label: 'Sorties résidents' },
        { path: '/professional/visitors', icon: DoorOpen, label: 'Visiteurs' },
        { path: '/professional/volunteers', icon: HandHeart, label: 'Bénévoles' },
        { path: '/professional/rooms', icon: BedDouble, label: 'Chambres' }
      ]
    },
    {
      id: 'health',
      label: 'Santé & soins',
      items: [
        { path: '/professional/health-records', icon: Heart, label: 'Dossiers médicaux' },
        { path: '/professional/pharmacy', icon: Stethoscope, label: 'Pharmacie' },
        { path: '/professional/medications', icon: Pill, label: 'Prescriptions' },
        { path: '/professional/meals', icon: UtensilsCrossed, label: 'Repas' }
      ]
    },
    {
      id: 'ops',
      label: 'Logistique',
      items: [
        ...(hasStock ? [{ path: '/professional/food-stock', icon: Boxes, label: 'Stock alimentaire' }] : []),
        ...(hasTransport ? [{ path: '/professional/transport', icon: Truck, label: 'Transport' }] : []),
        { path: '/professional/schedule', icon: CalendarDays, label: 'Planning' },
        { path: '/professional/financial', icon: Wallet, label: 'Finances' },
        { path: '/professional/documents', icon: FolderOpen, label: 'Documents' }
      ]
    },
    {
      id: 'comm',
      label: 'Communication',
      items: [
        { path: '/professional/announcements', icon: Megaphone, label: 'Annonces' },
        { path: '/professional/site-news', icon: Newspaper, label: 'Actualités du site' },
        { path: '/professional/communications', icon: MessagesSquare, label: 'Communications' },
        { path: '/professional/notifications', icon: Bell, label: 'Notifications' },
        { path: '/professional/tickets', icon: TicketCheck, label: 'Tickets' }
      ]
    },
    {
      id: 'system',
      label: 'Système',
      items: [
        { path: '/professional/approvals', icon: CheckCircle2, label: 'Approbations' },
        { path: '/professional/audit-log', icon: ScrollText, label: "Journal d'audit" },
        { path: '/professional/backup', icon: HardDriveDownload, label: 'Sauvegarde' },
        { path: '/professional/integrations', icon: Plug, label: 'Intégrations' },
        { path: '/professional/export-reports', icon: Upload, label: 'Export rapports' },
        { path: '/professional/search', icon: Search, label: 'Recherche' },
        { path: '/professional/two-factor', icon: ShieldCheck, label: 'Sécurité 2FA' },
        { path: '/professional/settings', icon: Settings, label: 'Paramètres' },
        { path: '/admin', icon: ShieldUser, label: 'Panneau admin' }
      ]
    }
  ].map((section) => ({
    ...section,
    items: section.items.filter((item) => canAccessPath(user, item.path))
  })).filter((section) => section.items.length), [hasStock, hasTransport, user]);

  const filteredSections = useMemo(() => {
    const needle = normalize(query.trim());
    if (!needle) return sections;

    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          normalize(`${section.label} ${item.label}`).includes(needle)
        )
      }))
      .filter((section) => section.items.length);
  }, [query, sections]);

  const toggleSection = (id) => {
    setCollapsedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const initials = `${user?.nom?.[0] || 'U'}${user?.prenom?.[0] || ''}`.toUpperCase();
  const roleLabel = getRoleLabel(user?.role);

  return (
    <>
      <button
        className="mobile-menu-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Ouvrir le menu"
        type="button"
      >
        <Menu size={20} />
      </button>

      {isOpen && (
        <button
          className="sidebar-overlay"
          onClick={() => setIsOpen(false)}
          aria-label="Fermer le menu"
          type="button"
        />
      )}

      <aside className={`dashboard-sidebar ${isOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <img src="/images/logo.png" alt="Logo Adel Alwaref" className="sidebar-logo" />
          <div className="sidebar-header-text">
            <strong>Portail équipe</strong>
            <small>Adel Alwaref</small>
          </div>
          <button
            className="mobile-close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Fermer le menu"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <label className="sidebar-search">
          <Search size={15} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un module"
          />
        </label>

        <nav className="sidebar-nav" aria-label="Navigation principale">
          {filteredSections.map((section) => {
            const collapsed = !query && collapsedSections[section.id];
            return (
              <div key={section.id} className="sidebar-section">
                <button
                  type="button"
                  className={`sidebar-section-head ${collapsed ? 'is-collapsed' : ''}`}
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={!collapsed}
                >
                  <span>{section.label}</span>
                  <ChevronRight size={14} className="sidebar-section-chevron" />
                </button>
                {!collapsed && (
                  <div className="sidebar-section-items">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = location.pathname === item.path;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`nav-item ${active ? 'active' : ''}`}
                          onClick={() => setIsOpen(false)}
                        >
                          <span className="nav-icon"><Icon size={17} strokeWidth={1.8} /></span>
                          <span className="nav-label">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {filteredSections.length === 0 && (
            <div className="sidebar-empty">Aucun module trouvé</div>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{initials}</div>
            <div className="user-details">
              <div className="user-name">{user?.prenom || ''} {user?.nom || ''}</div>
              <div className="user-role">{roleLabel}</div>
            </div>
          </div>
          <button onClick={onLogout} className="btn-logout-sidebar" type="button">
            <LogOut size={15} strokeWidth={2} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
};
