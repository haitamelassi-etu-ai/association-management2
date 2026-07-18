import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  AlertTriangle,
  ArrowUpRight,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  DoorOpen,
  FileText,
  Megaphone,
  PackageCheck,
  Pill,
  Plus,
  RefreshCcw,
  UtensilsCrossed,
  Users
} from 'lucide-react';
import { beneficiariesAPI } from '../services/api';
import NotificationBell from './NotificationBell';
import NotificationCenter from './NotificationCenter';
import ChatFloatingButton from './ChatFloatingButton';
import ThemeToggle from '../components/ThemeToggle';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { ProfessionalSidebar } from './SharedSidebar';
import { CHART_COLORS as COLORS, CHART_TOKENS } from '../utils/chartTheme';
import './ProfessionalDashboard.css';

const POST_HOSTING_LABELS = {
  nazil_bilmarkaz: 'Résident au centre',
  mughAdara: 'Départ',
  idmaj_usari: 'Réintégration familiale',
  firAr: 'Fuite',
  tard: 'Exclusion',
  wafat: 'Décès'
};

const MONTH_NAMES = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

const actionLabels = {
  create: { text: 'Création', cls: 'new' },
  update: { text: 'Mise à jour', cls: 'update' },
  delete: { text: 'Suppression', cls: 'danger' },
  login: { text: 'Connexion', cls: 'info' },
  export: { text: 'Export', cls: 'info' },
  import: { text: 'Import', cls: 'success' },
  view: { text: 'Consultation', cls: 'info' },
  status_change: { text: 'Changement de statut', cls: 'update' },
  attendance_marked: { text: 'Pointage', cls: 'success' },
  exit_recorded: { text: 'Sortie enregistrée', cls: 'update' },
  meal_served: { text: 'Repas servi', cls: 'success' }
};

const resourceLabels = {
  beneficiary: 'bénéficiaire',
  user: 'utilisateur',
  attendance: 'pointage',
  announcement: 'annonce',
  medication: 'médicament',
  meal: 'repas',
  pharmacy: 'pharmacie',
  foodStock: 'stock alimentaire',
  document: 'document',
  report: 'rapport',
  system: 'système'
};

const MiniTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="mini-tooltip">
      <span>{item?.name || item?.payload?.name}: <strong>{item?.value}</strong></span>
    </div>
  );
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Hier';
  if (days < 7) return `Il y a ${days} j`;
  return new Date(dateStr).toLocaleDateString('fr-FR');
};

const statValue = (value) => Number(value || 0);

function ProfessionalDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('professionalUser');
    if (!userData) {
      navigate('/login');
      return;
    }

    try {
      setUser(JSON.parse(userData));
      fetchStats();
    } catch {
      navigate('/login');
    }
  }, [navigate]);

  const fetchStats = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await beneficiariesAPI.getStats();
      setStats(response.data.data);
    } catch (requestError) {
      console.error('Erreur stats:', requestError);
      setError("Les données temps réel ne sont pas disponibles. Vérifiez que le serveur backend est lancé.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('professionalUser');
    localStorage.removeItem('professionalToken');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const dateStr = useMemo(() => (
    new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  ), []);

  const postHostingData = stats?.maBaadStats?.map((item) => ({
    name: POST_HOSTING_LABELS[item._id] || item._id,
    value: item.count
  })) || [];

  const locationData = stats?.lieuStats?.map((item) => ({
    name: item._id || 'Non renseigné',
    value: item.count
  })) || [];

  const trendData = stats?.monthlyTrend?.map((item) => {
    const [, month] = String(item._id).split('-');
    const monthName = MONTH_NAMES[Number(month) - 1] || item._id;
    return { name: monthName, value: item.count };
  }) || [];

  const activities = stats?.recentActivities || [];
  const announcements = stats?.announcements || [];
  const recentBeneficiaries = stats?.recentBeneficiaries || [];

  const total = statValue(stats?.total);
  const hosted = statValue(stats?.heberge);
  const exited = statValue(stats?.sorti);
  const newThisMonth = statValue(stats?.nouveauxCeMois);
  const exitsThisMonth = statValue(stats?.sortisCeMois);
  const staffCount = statValue(stats?.staffCount);
  const mealsThisMonth = statValue(stats?.distributionsCeMois);
  const occupancyRate = total ? Math.round((hosted / total) * 100) : 0;

  const kpis = [
    { label: 'Actuellement hébergés', value: hosted, meta: `${occupancyRate}% du total`, icon: BedDouble, tone: 'gold' },
    { label: 'Nouveaux ce mois', value: newThisMonth, meta: `${exitsThisMonth} sorties ce mois`, icon: Users, tone: 'blue' },
    { label: 'Repas distribués', value: mealsThisMonth, meta: 'Ce mois', icon: UtensilsCrossed, tone: 'green' },
    { label: 'Personnel actif', value: staffCount, meta: 'Comptes équipe', icon: ClipboardCheck, tone: 'slate' },
    { label: 'Total sortis', value: exited, meta: 'Parcours clôturés', icon: DoorOpen, tone: 'red' },
    { label: 'Bénéficiaires total', value: total, meta: 'Depuis la création', icon: FileText, tone: 'purple' }
  ];

  const quickActions = [
    { label: 'Nouveau bénéficiaire', to: '/professional/beneficiaries', icon: Plus, primary: true },
    { label: 'Pointage staff', to: '/professional/attendance', icon: ClipboardCheck },
    { label: 'Repas du jour', to: '/professional/meals', icon: UtensilsCrossed },
    { label: 'Sortie résident', to: '/professional/exit-tracking', icon: DoorOpen },
    { label: 'Stock alimentaire', to: '/professional/food-stock', icon: PackageCheck },
    { label: 'Rapport', to: '/professional/reports', icon: FileText }
  ];

  const operations = [
    { label: 'Capacité centre', value: `${hosted}`, detail: 'résidents à suivre', icon: BedDouble, status: hosted ? 'Actif' : 'À vérifier' },
    { label: 'Entrées du mois', value: `${newThisMonth}`, detail: 'nouveaux dossiers', icon: Users, status: newThisMonth ? 'En cours' : 'Stable' },
    { label: 'Repas', value: `${mealsThisMonth}`, detail: 'distributions mensuelles', icon: UtensilsCrossed, status: 'Suivi' },
    { label: 'Traitements', value: stats?.medicationsDueToday || 0, detail: 'à confirmer aujourd’hui', icon: Pill, status: 'Santé' }
  ];

  if (!user) {
    return (
      <div className="dash-loading">
        <div className="dash-spinner" />
      </div>
    );
  }

  return (
    <div className="professional-dashboard">
      <ProfessionalSidebar user={user} onLogout={handleLogout} />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-left">
            <p className="dashboard-kicker">Centre opérationnel</p>
            <h1>Tableau de bord</h1>
            <p className="header-date">{dateStr}</p>
            <p className="header-welcome">
              Bienvenue, <strong>{user?.prenom || ''} {user?.nom || ''}</strong>
            </p>
          </div>

          <div className="header-actions">
            <LanguageSwitcher />
            <ThemeToggle />
            <NotificationBell onClick={() => setShowNotifications(true)} />
            <button className="btn-action" type="button" onClick={fetchStats}>
              <RefreshCcw size={16} />
              Actualiser
            </button>
            <Link to="/professional/announcements" className="btn-action">
              <Megaphone size={16} />
              Annonces
            </Link>
            <Link to="/professional/beneficiaries" className="btn-action primary">
              <Plus size={16} />
              Nouveau dossier
            </Link>
          </div>
        </header>

        {error && (
          <div className="dashboard-alert" role="alert">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="dash-loading">
            <div className="dash-spinner" />
            <p>Chargement du portail...</p>
          </div>
        ) : (
          <>
            <section className="ops-hero" aria-label="Synthèse du jour">
              <div className="ops-summary">
                <p className="dashboard-kicker">Priorités du jour</p>
                <h2>Garder l’accueil, les soins et la logistique sous contrôle.</h2>
                <p>
                  Les indicateurs les plus utiles à l’équipe sont regroupés ici pour décider vite,
                  suivre les urgences et ouvrir les modules importants en un clic.
                </p>
                <div className="ops-actions">
                  {quickActions.slice(0, 3).map((action) => {
                    const Icon = action.icon;
                    return (
                      <Link key={action.label} to={action.to} className={`ops-action ${action.primary ? 'primary' : ''}`}>
                        <Icon size={17} />
                        <span>{action.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="ops-panel">
                {operations.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="ops-item">
                      <div className="ops-icon"><Icon size={19} /></div>
                      <div>
                        <span className="ops-label">{item.label}</span>
                        <strong>{item.value}</strong>
                        <small>{item.detail}</small>
                      </div>
                      <span className="ops-status">{item.status}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="stats-grid" aria-label="Indicateurs clés">
              {kpis.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.label} className={`stat-card ${item.tone}`}>
                    <div className="stat-icon"><Icon size={22} /></div>
                    <div className="stat-content">
                      <span className="stat-label">{item.label}</span>
                      <strong className="stat-value">{item.value}</strong>
                      <span className="stat-sub">{item.meta}</span>
                    </div>
                  </article>
                );
              })}
            </section>

            <section className="dashboard-charts" aria-label="Analytique">
              <article className="dash-chart-card wide">
                <div className="chart-title">
                  <h3>Évolution des entrées</h3>
                  <span className="chart-period">12 derniers mois</span>
                </div>
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={trendData} margin={{ top: 8, right: 18, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="dashboardGold" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_TOKENS.gold} stopOpacity={0.35} />
                          <stop offset="95%" stopColor={CHART_TOKENS.gold} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART_TOKENS.grid} />
                      <XAxis dataKey="name" fontSize={11} stroke={CHART_TOKENS.axis} />
                      <YAxis fontSize={11} stroke={CHART_TOKENS.axis} />
                      <Tooltip content={<MiniTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={CHART_TOKENS.gold}
                        strokeWidth={2.5}
                        fill="url(#dashboardGold)"
                        dot={{ fill: CHART_TOKENS.gold, r: 3 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="no-data">Aucune donnée d’évolution disponible</div>
                )}
              </article>

              <article className="dash-chart-card">
                <div className="chart-title">
                  <h3>Post-hébergement</h3>
                </div>
                {postHostingData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={190}>
                      <PieChart>
                        <Pie data={postHostingData} cx="50%" cy="50%" outerRadius={72} innerRadius={38} dataKey="value" paddingAngle={2}>
                          {postHostingData.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<MiniTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mini-legend">
                      {postHostingData.map((item, index) => (
                        <div key={item.name} className="mini-legend-item">
                          <span className="dot" style={{ background: COLORS[index % COLORS.length] }} />
                          <span className="lbl">{item.name}</span>
                          <span className="val">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="no-data">Aucune donnée disponible</div>
                )}
              </article>

              <article className="dash-chart-card">
                <div className="chart-title">
                  <h3>Zones d’intervention</h3>
                </div>
                {locationData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={locationData} layout="vertical" margin={{ top: 8, right: 14, left: 6, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART_TOKENS.grid} />
                      <XAxis type="number" fontSize={11} stroke={CHART_TOKENS.axis} />
                      <YAxis type="category" dataKey="name" fontSize={11} stroke={CHART_TOKENS.axis} width={104} />
                      <Tooltip content={<MiniTooltip />} />
                      <Bar dataKey="value" radius={[0, 5, 5, 0]}>
                        {locationData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="no-data">Aucune zone renseignée</div>
                )}
              </article>
            </section>

            <section className="dashboard-bottom" aria-label="Activité récente">
              <article className="content-card">
                <div className="card-header">
                  <h3>Activités récentes</h3>
                  <span className="card-count">{activities.length ? `${activities.length} dernières` : 'Aucune activité'}</span>
                </div>
                <div className="activities-list">
                  {activities.length > 0 ? activities.map((activity, index) => {
                    const info = actionLabels[activity.action] || { text: activity.action || 'Action', cls: 'info' };
                    const userName = activity.user ? `${activity.user.prenom || ''} ${activity.user.nom || ''}`.trim() : 'Système';
                    const resource = resourceLabels[activity.resource] || activity.resource || 'module';
                    return (
                      <div key={`${activity.timestamp || index}-${index}`} className="activity-item">
                        <div className={`activity-icon ${info.cls}`}><CheckCircle2 size={17} /></div>
                        <div className="activity-details">
                          <div className="activity-title">{info.text} - {resource}</div>
                          <div className="activity-meta">{userName} · {timeAgo(activity.timestamp)}</div>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="empty-state">
                      <CheckCircle2 size={22} />
                      <p>Aucune activité récente à afficher.</p>
                    </div>
                  )}
                </div>
              </article>

              <article className="content-card">
                <div className="card-header">
                  <h3>Annonces internes</h3>
                  <Link to="/professional/announcements" className="link-more">
                    Voir tout <ArrowUpRight size={14} />
                  </Link>
                </div>
                <div className="announcements-list">
                  {announcements.length > 0 ? announcements.map((announcement, index) => (
                    <div key={`${announcement._id || index}`} className={`announcement-item ${announcement.type || 'info'}`}>
                      <span className="announcement-badge">
                        {announcement.type === 'urgent' ? 'Urgent' : announcement.type === 'tache' ? 'Tâche' : announcement.type === 'evenement' ? 'Événement' : 'Info'}
                      </span>
                      <strong className="announcement-title">{announcement.titre}</strong>
                      <span className="announcement-date">{timeAgo(announcement.createdAt)}</span>
                    </div>
                  )) : (
                    <div className="empty-state">
                      <Megaphone size={22} />
                      <p>Aucune annonce active.</p>
                    </div>
                  )}
                </div>

                {recentBeneficiaries.length > 0 && (
                  <div className="recent-bens-section">
                    <div className="card-header compact">
                      <h3>Derniers inscrits</h3>
                      <Link to="/professional/beneficiaries" className="link-more">
                        Ouvrir <ArrowUpRight size={14} />
                      </Link>
                    </div>
                    <div className="recent-bens-list">
                      {recentBeneficiaries.map((beneficiary, index) => (
                        <div key={`${beneficiary._id || index}`} className="recent-ben-item">
                          <div className="ben-avatar">{beneficiary.nom?.[0] || '?'}</div>
                          <div className="ben-info">
                            <span className="ben-name">{beneficiary.prenom} {beneficiary.nom}</span>
                            <span className="ben-meta">
                              #{beneficiary.numeroOrdre || '---'} · {beneficiary.dateEntree ? new Date(beneficiary.dateEntree).toLocaleDateString('fr-FR') : 'Date non renseignée'}
                            </span>
                          </div>
                          <span className={`ben-badge ${beneficiary.statut}`}>
                            {beneficiary.statut === 'heberge' ? 'Hébergé' : beneficiary.statut === 'sorti' ? 'Sorti' : beneficiary.statut || 'Suivi'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            </section>

            <section className="quick-actions-bar" aria-label="Actions rapides">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.label} to={action.to} className="quick-action-btn">
                    <Icon size={17} />
                    <span>{action.label}</span>
                  </Link>
                );
              })}
            </section>
          </>
        )}
      </main>

      {showNotifications && <NotificationCenter onClose={() => setShowNotifications(false)} />}
      <ChatFloatingButton />
    </div>
  );
}

export default ProfessionalDashboard;
