import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Archive,
  CheckCircle,
  ClipboardList,
  DatabaseBackup,
  Download,
  FileJson,
  Home,
  Lock,
  Package,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Upload,
  UserCog,
  Users
} from 'lucide-react';
import './BackupManager.css';
import { API_URL, getAuthHeaders } from '../utils/api';
import ProfessionalLayout from '../professional/ProfessionalLayout';

const TEXT = {
  title: 'Sauvegarde et restauration',
  subtitle: 'Protegez les donnees de l association avec des exports controles et une restauration admin securisee.',
  statsTitle: 'Perimetre actuel',
  exportTitle: 'Exporter les donnees',
  restoreTitle: 'Restaurer une sauvegarde complete',
  restoreWarning: 'La restauration remplace les donnees actuelles par celles du fichier. Utilisez uniquement un fichier recent et verifie.',
  restoreHelp: 'Tapez RESTAURER pour confirmer l operation.',
  fileLabel: 'Fichier JSON de sauvegarde',
  confirmLabel: 'Confirmation',
  confirmPlaceholder: 'RESTAURER',
  exportSuccess: 'Sauvegarde telechargee.',
  exportError: 'Impossible de creer la sauvegarde.',
  restoreSuccess: 'Restauration terminee.',
  restoreError: 'Impossible de restaurer la sauvegarde.',
  loadError: 'Impossible de lire les statistiques.',
  noFile: 'Selectionnez un fichier de sauvegarde.',
  badConfirmation: 'Tapez RESTAURER pour confirmer.',
  previewInvalid: 'Fichier JSON invalide.',
  previewTitle: 'Apercu du fichier',
  fullOnly: 'La restauration accepte uniquement une sauvegarde complete.',
  sensitiveTitle: 'A proteger',
  sensitiveCopy: 'Une sauvegarde complete contient les comptes utilisateurs et les informations sensibles. Gardez le fichier hors des dossiers publics.'
};

const statCards = [
  { key: 'beneficiaries', label: 'Beneficiaires', icon: Users },
  { key: 'users', label: 'Utilisateurs', icon: UserCog },
  { key: 'foodStock', label: 'Stock alimentaire', icon: Package },
  { key: 'rooms', label: 'Chambres', icon: Home },
  { key: 'distributions', label: 'Distributions', icon: ClipboardList },
  { key: 'auditLogs', label: 'Journal audit', icon: Activity }
];

const exportOptions = [
  {
    type: 'all',
    title: 'Sauvegarde complete',
    description: 'Beneficiaires, utilisateurs, stock, chambres, distributions, sante, medicaments et journal audit.',
    icon: DatabaseBackup,
    primary: true
  },
  {
    type: 'beneficiaries',
    title: 'Beneficiaires',
    description: 'Export rapide des dossiers beneficiaires lies a l association.',
    icon: Users
  },
  {
    type: 'foodStock',
    title: 'Stock alimentaire',
    description: 'Export des articles, quantites, seuils, dates et historiques du stock.',
    icon: Package
  },
  {
    type: 'auditLogs',
    title: 'Journal audit',
    description: 'Export des actions importantes tracees sur la plateforme.',
    icon: ShieldAlert
  }
];

const formatDate = (value) => {
  if (!value) return 'Non renseigne';
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const totalCounts = (counts = {}) => Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0);

const BackupManager = () => {
  const [exportingType, setExportingType] = useState('');
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [restoreFile, setRestoreFile] = useState(null);
  const [restorePreview, setRestorePreview] = useState(null);
  const [confirmation, setConfirmation] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const messageTimerRef = useRef(null);

  const canRestore = restoreFile && confirmation === 'RESTAURER' && restorePreview?.valid && restorePreview?.type === 'all';

  const restoredSummary = useMemo(() => {
    if (!restorePreview?.counts) return null;
    return `${totalCounts(restorePreview.counts)} enregistrements dans ${Object.keys(restorePreview.counts).length} collections`;
  }, [restorePreview]);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    window.clearTimeout(messageTimerRef.current);
    messageTimerRef.current = window.setTimeout(() => setMessage({ text: '', type: '' }), 6000);
  };

  const downloadJSON = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleBackup = async (type) => {
    setExportingType(type);
    try {
      const response = await fetch(`${API_URL}/backup/export/${type}`, {
        headers: getAuthHeaders()
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || TEXT.exportError);
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `sauvegarde_association_${type}_${timestamp}.json`;
      downloadJSON(result.backup, filename);
      showMessage(`${TEXT.exportSuccess} ${totalCounts(result.backup?.counts)} enregistrements exportes.`, 'success');
    } catch (error) {
      console.error('Backup error:', error);
      showMessage(error.message || TEXT.exportError, 'error');
    } finally {
      setExportingType('');
    }
  };

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const response = await fetch(`${API_URL}/backup/stats`, {
        headers: getAuthHeaders()
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || TEXT.loadError);
      }
      setStats(result.stats);
    } catch (error) {
      console.error('Error loading backup stats:', error);
      showMessage(error.message || TEXT.loadError, 'error');
    } finally {
      setStatsLoading(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setRestoreFile(file);
    setRestorePreview(null);

    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        setRestorePreview({
          valid: Boolean(parsed?.data && parsed?.version),
          version: parsed.version,
          type: parsed.type || 'all',
          exportedAt: parsed.exportedAt,
          association: parsed.association?.name || parsed.association?.id || 'Association',
          counts: parsed.counts || {}
        });
      } catch {
        setRestorePreview({ valid: false, error: TEXT.previewInvalid });
      }
    };
    reader.onerror = () => setRestorePreview({ valid: false, error: TEXT.previewInvalid });
    reader.readAsText(file);
  };

  const handleRestore = async (event) => {
    event.preventDefault();

    if (!restoreFile) {
      showMessage(TEXT.noFile, 'error');
      return;
    }

    if (confirmation !== 'RESTAURER') {
      showMessage(TEXT.badConfirmation, 'error');
      return;
    }

    if (!restorePreview?.valid || restorePreview.type !== 'all') {
      showMessage(TEXT.fullOnly, 'error');
      return;
    }

    setIsRestoring(true);
    try {
      const formData = new FormData();
      formData.append('backup', restoreFile);
      formData.append('confirmation', confirmation);

      const response = await fetch(`${API_URL}/backup/restore`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || TEXT.restoreError);
      }

      showMessage(`${TEXT.restoreSuccess} ${totalCounts(result.restored)} enregistrements restaures.`, 'success');
      setRestoreFile(null);
      setRestorePreview(null);
      setConfirmation('');
      event.target.reset();
      await loadStats();
    } catch (error) {
      console.error('Restore error:', error);
      showMessage(error.message || TEXT.restoreError, 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  useEffect(() => {
    loadStats();

    return () => {
      window.clearTimeout(messageTimerRef.current);
    };
  }, []);

  return (
    <ProfessionalLayout noPadding>
      <div className="backup-manager">
        <header className="backup-header">
          <div>
            <span className="backup-kicker"><Archive size={16} /> Administration systeme</span>
            <h2>{TEXT.title}</h2>
            <p>{TEXT.subtitle}</p>
          </div>
          <button className="backup-icon-btn" type="button" onClick={loadStats} disabled={statsLoading} title="Actualiser">
            <RefreshCw size={18} />
          </button>
        </header>

        {message.text && (
          <div className={`backup-message ${message.type}`} role="status">
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            <span>{message.text}</span>
          </div>
        )}

        <section className="backup-section">
          <div className="section-heading">
            <h3>{TEXT.statsTitle}</h3>
            <span>{stats?.lastChecked ? `Controle le ${formatDate(stats.lastChecked)}` : 'Chargement'}</span>
          </div>

          <div className="stats-grid">
            {statCards.map(({ key, label, icon: Icon }) => (
              <article className="stat-card" key={key}>
                <Icon size={20} />
                <strong>{statsLoading && !stats ? '-' : stats?.[key] ?? 0}</strong>
                <span>{label}</span>
              </article>
            ))}
          </div>
        </section>

        <div className="backup-workspace">
          <section className="backup-section">
            <div className="section-heading">
              <h3>{TEXT.exportTitle}</h3>
              <span>JSON telechargeable</span>
            </div>

            <div className="backup-cards">
              {exportOptions.map(({ type, title, description, icon: Icon, primary }) => (
                <article className={`backup-card ${primary ? 'primary' : ''}`} key={type}>
                  <div className="card-icon"><Icon size={22} /></div>
                  <h4>{title}</h4>
                  <p>{description}</p>
                  <button
                    className="backup-btn"
                    type="button"
                    onClick={() => handleBackup(type)}
                    disabled={Boolean(exportingType)}
                  >
                    <Download size={17} />
                    {exportingType === type ? 'Export...' : 'Exporter'}
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="backup-section restore-section">
            <div className="section-heading">
              <h3>{TEXT.restoreTitle}</h3>
              <span>Admin uniquement</span>
            </div>

            <div className="restore-warning">
              <ShieldAlert size={20} />
              <p>{TEXT.restoreWarning}</p>
            </div>

            <form className="restore-form" onSubmit={handleRestore}>
              <label>
                <span>{TEXT.fileLabel}</span>
                <input type="file" accept="application/json,.json" onChange={handleFileChange} />
              </label>

              {restorePreview && (
                <div className={`backup-preview ${restorePreview.valid ? '' : 'invalid'}`}>
                  <div className="preview-title">
                    <FileJson size={18} />
                    <strong>{TEXT.previewTitle}</strong>
                  </div>
                  {restorePreview.valid ? (
                    <>
                      <span>Version {restorePreview.version}</span>
                      <span>Type: {restorePreview.type === 'all' ? 'complete' : restorePreview.type}</span>
                      <span>Export: {formatDate(restorePreview.exportedAt)}</span>
                      <span>Association: {restorePreview.association}</span>
                      {restoredSummary && <strong>{restoredSummary}</strong>}
                      {restorePreview.type !== 'all' && <em>{TEXT.fullOnly}</em>}
                    </>
                  ) : (
                    <span>{restorePreview.error || TEXT.previewInvalid}</span>
                  )}
                </div>
              )}

              <label>
                <span>{TEXT.confirmLabel}</span>
                <input
                  type="text"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  placeholder={TEXT.confirmPlaceholder}
                  autoComplete="off"
                />
              </label>

              <p className="restore-help">{TEXT.restoreHelp}</p>

              <button className="backup-btn danger" type="submit" disabled={!canRestore || isRestoring}>
                <RotateCcw size={17} />
                {isRestoring ? 'Restauration...' : 'Restaurer'}
              </button>
            </form>
          </section>
        </div>

        <section className="backup-security-note">
          <Lock size={20} />
          <div>
            <h3>{TEXT.sensitiveTitle}</h3>
            <p>{TEXT.sensitiveCopy}</p>
          </div>
          <Upload size={20} />
        </section>
      </div>
    </ProfessionalLayout>
  );
};

export default BackupManager;
