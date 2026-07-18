import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { jsPDF } from 'jspdf';
import { API_URL } from '../utils/api';
import { CHART_COLORS, CHART_TOKENS } from '../utils/chartTheme';
import './AnalyticsDashboard.css';

// On-brand palettes — warm gold/sage/terracotta scale for charts.
const PALETTE = {
  primary: ['#caa24a', '#a0805a', '#d4924a', '#1f6d3b', '#5b8068', '#7a6f5e'],
  maBaad:  ['#caa24a', '#a0805a', '#1f6d3b', '#b82920', '#7a6f5e', '#25231f'],
  health:  ['#1f6d3b', '#b82920', '#caa24a', '#a0805a', '#5b8068', '#d4924a', '#7a6f5e', '#25231f', '#8a7e69', '#9b3a32'],
  age:     ['#f0d489', '#caa24a', '#a0805a', '#7a6f5e', '#5b8068', '#1f6d3b', '#25231f', '#8a7e69'],
  lieu:    ['#caa24a', '#1f6d3b', '#d4924a', '#b82920', '#a0805a', '#7a6f5e'],
};

const RADIAN = Math.PI / 180;

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  if (percent < 0.03) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 1.15;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill={CHART_TOKENS.charcoal} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontWeight={500}>
      {name} ({(percent * 100).toFixed(0)}%)
    </text>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="analytics-tooltip">
      <p className="tooltip-label">{label || payload[0]?.name}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }}>
          {p.name || p.dataKey}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

function AnalyticsDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [printMode, setPrintMode] = useState(false);
  const printRef = useRef(null);
  const [aiReport, setAiReport] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  const handlePrint = () => {
    setPrintMode(true);
  };

  // ── AI Monthly Report ──
  const handleGenerateAIReport = async () => {
    try {
      setAiLoading(true);
      setShowAiModal(true);
      setAiReport('');
      const professionalUser = localStorage.getItem('professionalUser');
      if (!professionalUser) return;
      const { token } = JSON.parse(professionalUser);

      const payload = {
        totalBeneficiaries: overview?.total || 0,
        activeBeneficiaries: overview?.heberge || 0,
        totalMeals: 0,
        hygieneDistributions: 0,
        stockAlerts: [],
        occupancyRate: overview?.total ? Math.round((overview.heberge / overview.total) * 100) : 0,
        donationsReceived: 0,
      };

      // Try to fetch extra data silently
      try {
        const [mealsRes, stockRes, roomsRes, finRes] = await Promise.allSettled([
          axios.get(`${API_URL}/meals/stats`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/food-stock`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/rooms/stats`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/financial/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (mealsRes.status === 'fulfilled' && mealsRes.value.data?.data) {
          payload.totalMeals = mealsRes.value.data.data.totalToday || mealsRes.value.data.data.total || 0;
        }
        if (stockRes.status === 'fulfilled' && stockRes.value.data?.data) {
          const items = stockRes.value.data.data;
          if (Array.isArray(items)) {
            payload.stockAlerts = items.filter(i => i.quantite <= (i.seuilAlerte || 10)).map(i => i.nom || i.name);
          }
        }
        if (roomsRes.status === 'fulfilled' && roomsRes.value.data?.data) {
          payload.occupancyRate = roomsRes.value.data.data.occupancyRate || payload.occupancyRate;
        }
        if (finRes.status === 'fulfilled' && finRes.value.data?.data) {
          payload.donationsReceived = finRes.value.data.data.monthlyRevenue || finRes.value.data.data.totalRevenu || 0;
        }
      } catch (_) { /* silent */ }

      const res = await axios.post(`${API_URL}/ai/monthly-report`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setAiReport(res.data.data.report);
      } else {
        setAiReport('❌ ' + (res.data.message || 'Erreur'));
      }
    } catch (err) {
      console.error('AI report error:', err);
      setAiReport('❌ ' + (err.response?.data?.message || err.message || 'Erreur de génération'));
    } finally {
      setAiLoading(false);
    }
  };

  const handleExportAIPdf = () => {
    if (!aiReport) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
    let y = 20;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Rapport Mensuel – Association Deuxième Chance', margin, y);
    y += 10;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} par IA (GPT-4o)`, margin, y);
    y += 10;
    doc.setDrawColor(200);
    doc.line(margin, y, margin + pageWidth, y);
    y += 8;

    doc.setFontSize(11);
    const lines = doc.splitTextToSize(aiReport, pageWidth);
    for (const line of lines) {
      if (y > 275) { doc.addPage(); y = 20; }
      // Bold section headings
      if (/^\d+\.\s|^\*\*/.test(line.trim())) {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }
      doc.text(line, margin, y);
      y += 6;
    }

    doc.save(`rapport-mensuel-${new Date().toISOString().slice(0, 7)}.pdf`);
  };

  // When printMode activates: wait for all recharts SVGs to render, then print
  useEffect(() => {
    if (!printMode) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 60; // 60 × 50ms = 3s max wait

    const waitForCharts = () => {
      if (cancelled) return;
      attempts++;

      // Count all recharts-surface SVGs that have real rendered content
      const container = printRef.current || document;
      const svgs = container.querySelectorAll('.recharts-surface');
      const allReady = svgs.length >= 6 && Array.from(svgs).every(svg => {
        const w = parseFloat(svg.getAttribute('width'));
        const h = parseFloat(svg.getAttribute('height'));
        return w > 50 && h > 50;
      });

      if (allReady || attempts >= maxAttempts) {
        // One final rAF to ensure paint is flushed
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (!cancelled) window.print();
          });
        });
      } else {
        setTimeout(waitForCharts, 50);
      }
    };

    // Start polling after React commit + first paint
    requestAnimationFrame(() => {
      setTimeout(waitForCharts, 100);
    });

    const onAfterPrint = () => { setPrintMode(false); };
    window.addEventListener('afterprint', onAfterPrint);
    return () => {
      cancelled = true;
      window.removeEventListener('afterprint', onAfterPrint);
    };
  }, [printMode]);

  useEffect(() => {
    const professionalUser = localStorage.getItem('professionalUser');
    if (!professionalUser) { navigate('/login'); return; }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const professionalUser = localStorage.getItem('professionalUser');
      if (!professionalUser) { setError('يرجى تسجيل الدخول'); setLoading(false); return; }
      const { token } = JSON.parse(professionalUser);
      const res = await axios.get(`${API_URL}/analytics/beneficiaries/full`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) setData(res.data.data);
    } catch (err) {
      console.error('Analytics error:', err);
      setError(err.response?.data?.message || 'خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="analytics-loading">
      <div className="spinner"></div>
      <p>جاري تحميل الإحصائيات...</p>
    </div>
  );

  if (error) return (
    <div className="analytics-error">
      <p>{error}</p>
      <button onClick={fetchData} className="btn-retry">إعادة المحاولة</button>
    </div>
  );

  if (!data) return null;

  const { overview, maBaad, situation, health, lieuIntervention, entiteOrientatrice, birthPlace, age, entryTimeline, monthlyEntry, departTimeline, stayDuration, entryVsExit, cin } = data;

  const tabs = [
    { id: 'overview', label: 'نظرة عامة', icon: '📊' },
    { id: 'demographics', label: 'الفئات العمرية', icon: '👥' },
    { id: 'status', label: 'الحالة والوضعية', icon: '📋' },
    { id: 'health', label: 'الصحة', icon: '🏥' },
    { id: 'geography', label: 'التوزيع الجغرافي', icon: '🗺️' },
    { id: 'timeline', label: 'التطور الزمني', icon: '📈' },
  ];

  return (
    <div className={`analytics-dashboard ${printMode ? 'print-mode' : ''}`} dir="rtl" ref={printRef}>
      {/* Header */}
      <div className="analytics-header">
        <div className="header-title">
          <h1>📊 لوحة الإحصائيات والتحليلات</h1>
          <p className="header-subtitle">تحليل شامل لبيانات المستفيدين</p>
        </div>
        <div className="header-actions-analytics">
          <button onClick={handleGenerateAIReport} className="btn-ai-report">🤖 Rapport IA Mensuel</button>
          <button onClick={handlePrint} className="btn-print">🖨️ طباعة التقارير</button>
          <button onClick={fetchData} className="btn-refresh">🔄 تحديث</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-total">
          <div className="kpi-icon">👥</div>
          <div className="kpi-info">
            <span className="kpi-label">المجموع الكلي</span>
            <span className="kpi-value">{overview.total}</span>
          </div>
        </div>
        <div className="kpi-card kpi-heberge">
          <div className="kpi-icon">🏠</div>
          <div className="kpi-info">
            <span className="kpi-label">نزلاء حاليون</span>
            <span className="kpi-value">{overview.heberge}</span>
          </div>
        </div>
        <div className="kpi-card kpi-sorti">
          <div className="kpi-icon">🚪</div>
          <div className="kpi-info">
            <span className="kpi-label">خرجوا</span>
            <span className="kpi-value">{overview.sorti}</span>
          </div>
        </div>
        <div className="kpi-card kpi-cin">
          <div className="kpi-icon">🪪</div>
          <div className="kpi-info">
            <span className="kpi-label">يحملون ب.و.ت</span>
            <span className="kpi-value">{overview.withCIN}</span>
          </div>
        </div>
        <div className="kpi-card kpi-stay">
          <div className="kpi-icon">📅</div>
          <div className="kpi-info">
            <span className="kpi-label">متوسط الإقامة</span>
            <span className="kpi-value">{overview.avgStayDays} <small>يوم</small></span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      {!printMode && (
        <div className="analytics-tabs">
          {tabs.map(t => (
            <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
              <span className="tab-icon">{t.icon}</span>
              <span className="tab-label">{t.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Tab Content */}
      <div className="tab-content">

        {/* ===== OVERVIEW ===== */}
        {(activeTab === 'overview' || printMode) && (
        <div className="tab-panel">
          {printMode && <h2 className="print-section-title">📊 نظرة عامة</h2>}
          <div className="charts-section">
            <div className="charts-row">
              <div className="chart-card">
                <div className="chart-header">
                  <h3>🏠 مابعد الايواء</h3>
                  <span className="chart-badge">{maBaad.length} فئات</span>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie data={maBaad} cx="50%" cy="50%" outerRadius={110} innerRadius={50} dataKey="value"
                      label={renderCustomLabel} labelLine={false}>
                      {maBaad.map((_, i) => <Cell key={i} fill={PALETTE.maBaad[i % PALETTE.maBaad.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="chart-legend-list">
                  {maBaad.map((d, i) => (
                    <div key={i} className="legend-item">
                      <span className="legend-dot" style={{ background: PALETTE.maBaad[i % PALETTE.maBaad.length] }}></span>
                      <span className="legend-name">{d.name}</span>
                      <span className="legend-val">{d.value} ({d.percent}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h3>📋 نوع الوضعية</h3>
                  <span className="chart-badge">{situation.length} أنواع</span>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie data={situation} cx="50%" cy="50%" outerRadius={110} innerRadius={50} dataKey="value"
                      label={renderCustomLabel} labelLine={false}>
                      {situation.map((_, i) => <Cell key={i} fill={PALETTE.primary[i % PALETTE.primary.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="chart-legend-list">
                  {situation.map((d, i) => (
                    <div key={i} className="legend-item">
                      <span className="legend-dot" style={{ background: PALETTE.primary[i % PALETTE.primary.length] }}></span>
                      <span className="legend-name">{d.name}</span>
                      <span className="legend-val">{d.value} ({d.percent}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="charts-row">
              <div className="chart-card chart-narrow">
                <div className="chart-header"><h3>🪪 البطاقة الوطنية</h3></div>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={cin} cx="50%" cy="50%" outerRadius={90} innerRadius={40} dataKey="value"
                      label={renderCustomLabel} labelLine={false}>
                      <Cell fill={CHART_TOKENS.sage} />
                      <Cell fill={CHART_TOKENS.terracotta} />
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card chart-wide">
                <div className="chart-header"><h3>📈 الدخول مقابل الخروج حسب السنة</h3></div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={entryVsExit} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_TOKENS.grid} />
                    <XAxis dataKey="name" stroke={CHART_TOKENS.axis} fontSize={12} />
                    <YAxis stroke={CHART_TOKENS.axis} fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="entries" name="الدخول" fill={CHART_TOKENS.gold} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="exits" name="الخروج" fill={CHART_TOKENS.terracotta} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>)}

        {/* ===== DEMOGRAPHICS ===== */}
        {(activeTab === 'demographics' || printMode) && (
        <div className="tab-panel">
          {printMode && <h2 className="print-section-title">👥 الفئات العمرية</h2>}
          <div className="charts-section">
            <div className="charts-row">
              <div className="chart-card chart-full">
                <div className="chart-header"><h3>🎂 التوزيع حسب الفئات العمرية</h3></div>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={age} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_TOKENS.grid} />
                    <XAxis dataKey="name" stroke={CHART_TOKENS.axis} fontSize={13} />
                    <YAxis stroke={CHART_TOKENS.axis} fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="العدد" radius={[6, 6, 0, 0]}>
                      {age.map((_, i) => <Cell key={i} fill={PALETTE.age[i % PALETTE.age.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="charts-row">
              <div className="chart-card">
                <div className="chart-header"><h3>📊 نسب الفئات العمرية</h3></div>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie data={age} cx="50%" cy="50%" outerRadius={110} innerRadius={50} dataKey="value"
                      label={renderCustomLabel} labelLine={false}>
                      {age.map((_, i) => <Cell key={i} fill={PALETTE.age[i % PALETTE.age.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="chart-legend-list">
                  {age.map((d, i) => (
                    <div key={i} className="legend-item">
                      <span className="legend-dot" style={{ background: PALETTE.age[i % PALETTE.age.length] }}></span>
                      <span className="legend-name">{d.name}</span>
                      <span className="legend-val">{d.value} ({d.percent}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header"><h3>⏱️ مدة الإقامة</h3></div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={stayDuration} layout="vertical" margin={{ top: 10, right: 30, left: 80, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_TOKENS.grid} />
                    <XAxis type="number" stroke={CHART_TOKENS.axis} fontSize={12} />
                    <YAxis type="category" dataKey="name" stroke={CHART_TOKENS.axis} fontSize={12} width={80} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="العدد" fill={CHART_TOKENS.goldDeep} radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>)}

        {/* ===== STATUS ===== */}
        {(activeTab === 'status' || printMode) && (
        <div className="tab-panel">
          {printMode && <h2 className="print-section-title">📋 الحالة والوضعية</h2>}
          <div className="charts-section">
            <div className="charts-row">
              <div className="chart-card">
                <div className="chart-header"><h3>🏠 مابعد الايواء - تفصيل</h3></div>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={maBaad} layout="vertical" margin={{ top: 10, right: 30, left: 100, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_TOKENS.grid} />
                    <XAxis type="number" stroke={CHART_TOKENS.axis} fontSize={12} />
                    <YAxis type="category" dataKey="name" stroke={CHART_TOKENS.axis} fontSize={13} width={100} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="العدد" radius={[0, 6, 6, 0]}>
                      {maBaad.map((_, i) => <Cell key={i} fill={PALETTE.maBaad[i % PALETTE.maBaad.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <div className="chart-header"><h3>📋 نوع الوضعية - تفصيل</h3></div>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={situation} layout="vertical" margin={{ top: 10, right: 30, left: 120, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_TOKENS.grid} />
                    <XAxis type="number" stroke={CHART_TOKENS.axis} fontSize={12} />
                    <YAxis type="category" dataKey="name" stroke={CHART_TOKENS.axis} fontSize={13} width={120} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="العدد" radius={[0, 6, 6, 0]}>
                      {situation.map((_, i) => <Cell key={i} fill={PALETTE.primary[i % PALETTE.primary.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="charts-row">
              <div className="chart-card chart-full">
                <div className="chart-header"><h3>📊 ملخص الحالات</h3></div>
                <div className="data-cards-grid">
                  {maBaad.map((d, i) => (
                    <div key={i} className="data-stat-card" style={{ borderRightColor: PALETTE.maBaad[i % PALETTE.maBaad.length] }}>
                      <span className="data-stat-val">{d.value}</span>
                      <span className="data-stat-name">{d.name}</span>
                      <span className="data-stat-pct">{d.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>)}

        {/* ===== HEALTH ===== */}
        {(activeTab === 'health' || printMode) && (
        <div className="tab-panel">
          {printMode && <h2 className="print-section-title">🏥 الصحة</h2>}
          <div className="charts-section">
            <div className="charts-row">
              <div className="chart-card chart-full">
                <div className="chart-header"><h3>🏥 توزيع الحالة الصحية</h3></div>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={health} layout="vertical" margin={{ top: 10, right: 30, left: 120, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_TOKENS.grid} />
                    <XAxis type="number" stroke={CHART_TOKENS.axis} fontSize={12} />
                    <YAxis type="category" dataKey="name" stroke={CHART_TOKENS.axis} fontSize={13} width={120} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="العدد" radius={[0, 6, 6, 0]}>
                      {health.map((_, i) => <Cell key={i} fill={PALETTE.health[i % PALETTE.health.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="charts-row">
              <div className="chart-card">
                <div className="chart-header"><h3>📊 نسب الحالة الصحية</h3></div>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie data={health.slice(0, 6)} cx="50%" cy="50%" outerRadius={120} innerRadius={50} dataKey="value"
                      label={renderCustomLabel} labelLine={false}>
                      {health.slice(0, 6).map((_, i) => <Cell key={i} fill={PALETTE.health[i]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <div className="chart-header"><h3>📋 جدول الحالة الصحية</h3></div>
                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr><th>الحالة</th><th>العدد</th><th>النسبة</th></tr>
                    </thead>
                    <tbody>
                      {health.map((d, i) => (
                        <tr key={i}>
                          <td>
                            <span className="legend-dot inline" style={{ background: PALETTE.health[i % PALETTE.health.length] }}></span>
                            {d.name}
                          </td>
                          <td className="num-cell">{d.value}</td>
                          <td className="num-cell">{d.percent}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>)}

        {/* ===== GEOGRAPHY ===== */}
        {(activeTab === 'geography' || printMode) && (
        <div className="tab-panel">
          {printMode && <h2 className="print-section-title">🗺️ التوزيع الجغرافي</h2>}
          <div className="charts-section">
            <div className="charts-row">
              <div className="chart-card">
                <div className="chart-header"><h3>🗺️ مكان التدخل</h3></div>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={lieuIntervention} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_TOKENS.grid} />
                    <XAxis dataKey="name" stroke={CHART_TOKENS.axis} fontSize={12} />
                    <YAxis stroke={CHART_TOKENS.axis} fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="العدد" radius={[6, 6, 0, 0]}>
                      {lieuIntervention.map((_, i) => <Cell key={i} fill={PALETTE.lieu[i % PALETTE.lieu.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="chart-legend-list">
                  {lieuIntervention.map((d, i) => (
                    <div key={i} className="legend-item">
                      <span className="legend-dot" style={{ background: PALETTE.lieu[i % PALETTE.lieu.length] }}></span>
                      <span className="legend-name">{d.name}</span>
                      <span className="legend-val">{d.value} ({d.percent}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header"><h3>🏛️ الجهة الموجهة</h3></div>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={entiteOrientatrice} layout="vertical" margin={{ top: 10, right: 30, left: 140, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_TOKENS.grid} />
                    <XAxis type="number" stroke={CHART_TOKENS.axis} fontSize={12} />
                    <YAxis type="category" dataKey="name" stroke={CHART_TOKENS.axis} fontSize={12} width={140} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="العدد" fill={CHART_TOKENS.gold} radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="charts-row">
              <div className="chart-card chart-full">
                <div className="chart-header"><h3>🏙️ أهم مدن الازدياد (أعلى 20)</h3></div>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={birthPlace} layout="vertical" margin={{ top: 10, right: 30, left: 120, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_TOKENS.grid} />
                    <XAxis type="number" stroke={CHART_TOKENS.axis} fontSize={12} />
                    <YAxis type="category" dataKey="name" stroke={CHART_TOKENS.axis} fontSize={12} width={120} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="العدد" fill={CHART_TOKENS.sageSoft} radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>)}

        {/* ===== TIMELINE ===== */}
        {(activeTab === 'timeline' || printMode) && (
        <div className="tab-panel">
          {printMode && <h2 className="print-section-title">📈 التطور الزمني</h2>}
          <div className="charts-section">
            <div className="charts-row">
              <div className="chart-card chart-full">
                <div className="chart-header"><h3>📈 تطور الدخول حسب السنة</h3></div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={entryTimeline} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorEntry" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_TOKENS.grid} />
                    <XAxis dataKey="name" stroke={CHART_TOKENS.axis} fontSize={12} />
                    <YAxis stroke={CHART_TOKENS.axis} fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="value" name="الدخول" stroke={CHART_TOKENS.gold} strokeWidth={3}
                      fill="url(#colorEntry)" dot={{ fill: '#0ea5e9', r: 4 }} activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="charts-row">
              <div className="chart-card chart-full">
                <div className="chart-header"><h3>📊 الدخول مقابل الخروج حسب السنة</h3></div>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={entryVsExit} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_TOKENS.grid} />
                    <XAxis dataKey="name" stroke={CHART_TOKENS.axis} fontSize={13} />
                    <YAxis stroke={CHART_TOKENS.axis} fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="entries" name="الدخول" fill={CHART_TOKENS.gold} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="exits" name="الخروج" fill={CHART_TOKENS.terracotta} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {monthlyEntry.length > 0 && (
              <div className="charts-row">
                <div className="chart-card chart-full">
                  <div className="chart-header"><h3>📅 الدخول الشهري (آخر سنتين)</h3></div>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={monthlyEntry} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorMonthly" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART_TOKENS.grid} />
                      <XAxis dataKey="name" stroke={CHART_TOKENS.axis} fontSize={11} angle={-25} textAnchor="end" height={60} />
                      <YAxis stroke={CHART_TOKENS.axis} fontSize={12} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="value" name="الدخول" stroke={CHART_TOKENS.sage} strokeWidth={2}
                        fill="url(#colorMonthly)" dot={{ fill: '#22c55e', r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="charts-row">
              <div className="chart-card">
                <div className="chart-header"><h3>🚪 تطور الخروج حسب السنة</h3></div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={departTimeline} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorDepart" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_TOKENS.grid} />
                    <XAxis dataKey="name" stroke={CHART_TOKENS.axis} fontSize={12} />
                    <YAxis stroke={CHART_TOKENS.axis} fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="value" name="الخروج" stroke={CHART_TOKENS.terracotta} strokeWidth={2}
                      fill="url(#colorDepart)" dot={{ fill: '#f97316', r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <div className="chart-header"><h3>⏱️ مدة الإقامة</h3></div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stayDuration} layout="vertical" margin={{ top: 10, right: 30, left: 80, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_TOKENS.grid} />
                    <XAxis type="number" stroke={CHART_TOKENS.axis} fontSize={12} />
                    <YAxis type="category" dataKey="name" stroke={CHART_TOKENS.axis} fontSize={12} width={80} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="العدد" fill={CHART_TOKENS.goldDeep} radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>)}
      </div>

      {/* Footer summary */}
      <div className="analytics-footer">
        <div className="footer-stat">
          <span className="footer-label">المجموع</span>
          <span className="footer-val">{overview.total}</span>
        </div>
        <div className="footer-stat">
          <span className="footer-label">نزلاء</span>
          <span className="footer-val">{overview.heberge}</span>
        </div>
        <div className="footer-stat">
          <span className="footer-label">خرجوا</span>
          <span className="footer-val">{overview.sorti}</span>
        </div>
        <div className="footer-stat">
          <span className="footer-label">متوسط الإقامة</span>
          <span className="footer-val">{overview.avgStayDays} يوم</span>
        </div>
      </div>

      {/* AI Report Modal */}
      {showAiModal && (
        <div className="ai-modal-overlay" onClick={() => !aiLoading && setShowAiModal(false)}>
          <div className="ai-modal" onClick={e => e.stopPropagation()} dir="ltr">
            <div className="ai-modal-header">
              <h2>🤖 Rapport Mensuel IA</h2>
              <button className="ai-modal-close" onClick={() => !aiLoading && setShowAiModal(false)}>✕</button>
            </div>
            <div className="ai-modal-body">
              {aiLoading ? (
                <div className="ai-loading">
                  <div className="ai-spinner"></div>
                  <p>Génération du rapport en cours via GPT-4o...</p>
                  <p className="ai-loading-sub">Cela peut prendre 10-20 secondes</p>
                </div>
              ) : (
                <div className="ai-report-content">
                  {aiReport.split('\n').map((line, i) => {
                    if (/^#{1,3}\s/.test(line)) return <h3 key={i}>{line.replace(/^#+\s/, '')}</h3>;
                    if (/^\*\*.*\*\*$/.test(line.trim())) return <h4 key={i}>{line.replace(/\*\*/g, '')}</h4>;
                    if (/^\d+\.\s\*\*/.test(line)) return <h4 key={i}>{line.replace(/\*\*/g, '')}</h4>;
                    if (line.trim() === '') return <br key={i} />;
                    if (/^[-•]\s/.test(line.trim())) return <li key={i}>{line.replace(/^[-•]\s/, '')}</li>;
                    return <p key={i}>{line}</p>;
                  })}
                </div>
              )}
            </div>
            {!aiLoading && aiReport && !aiReport.startsWith('❌') && (
              <div className="ai-modal-footer">
                <button onClick={handleExportAIPdf} className="btn-ai-pdf">📄 Exporter PDF</button>
                <button onClick={() => { navigator.clipboard.writeText(aiReport); }} className="btn-ai-copy">📋 Copier</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AnalyticsDashboard;
