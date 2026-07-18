import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { API_URL, getAuthToken } from '../utils/api';
import './MedicationManagement.css';
import ProfessionalLayout from '../professional/ProfessionalLayout';

const MedicationManagement = () => {
  const { t } = useTranslation();
  const [medications, setMedications] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [pharmacyMedications, setPharmacyMedications] = useState([]);
  const [stats, setStats] = useState(null);
  const [refillList, setRefillList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState('all');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showAdministerModal, setShowAdministerModal] = useState(false);
  const [administerData, setAdministerData] = useState({
    medicationId: '',
    medicationName: '',
    time: '',
    quantityGiven: 1,
    notes: '',
    pharmacyStock: 0
  });

  const [newMedication, setNewMedication] = useState({
    beneficiaryId: '',
    pharmacyMedicationId: '',
    dosage: '',
    frequency: 'once_daily',
    times: ['08:00'],
    withFood: false,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    prescribedBy: '',
    instructions: '',
    sideEffects: '',
    chronicTreatment: false
  });

  const frequencies = [
    { value: 'once_daily', label: 'مرة واحدة يومياً', times: 1 },
    { value: 'twice_daily', label: 'مرتين يومياً', times: 2 },
    { value: 'three_times_daily', label: '3 مرات يومياً', times: 3 },
    { value: 'every_6_hours', label: 'كل 6 ساعات', times: 4 },
    { value: 'every_8_hours', label: 'كل 8 ساعات', times: 3 },
    { value: 'every_12_hours', label: 'كل 12 ساعة', times: 2 },
    { value: 'as_needed', label: 'عند الحاجة', times: 0 },
    { value: 'weekly', label: 'أسبوعياً', times: 1 },
    { value: 'monthly', label: 'شهرياً', times: 1 }
  ];

  const getToken = () => {
    const professionalUser = localStorage.getItem('professionalUser');
    if (professionalUser) {
      const userData = JSON.parse(professionalUser);
      return userData.token;
    }
    return getAuthToken();
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  useEffect(() => {
    fetchMedications();
    fetchBeneficiaries();
    fetchPharmacyMedications();
    fetchStats();
    fetchRefillList();
  }, [selectedBeneficiary]);

  const fetchMedications = async () => {
    setLoading(true);
    try {
      const token = getToken();
      let url = `${API_URL}/medications?active=true`;
      if (selectedBeneficiary !== 'all') {
        url += `&beneficiaryId=${selectedBeneficiary}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = await response.json();
      if (result.success) {
        setMedications(result.data);
      }
    } catch (error) {
      console.error('Error fetching medications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBeneficiaries = async () => {
    try {
      const token = getToken();
      console.log('🔑 Token:', token ? 'Exists ✅' : 'Missing ❌');
      
      const response = await fetch(`${API_URL}/beneficiaries`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('📊 Response status:', response.status);
      const result = await response.json();
      console.log('📋 Beneficiaries response:', result);
      if (result.success) {
        console.log('📊 Total beneficiaries:', result.data.length);
        console.log('📊 Statut hebergement values:', result.data.map(b => b.statutHebergement));
        // Accept both "heberge" and "hébergé" or show all if none match
        const heberges = result.data.filter(b => 
          b.statutHebergement === 'heberge' || 
          b.statutHebergement === 'hébergé' ||
          b.statutHebergement === 'Hébergé'
        );
        // If no matches, show all beneficiaries for medication management
        const finalList = heberges.length > 0 ? heberges : result.data;
        console.log('✅ Beneficiaires sélectionnés:', finalList);
        setBeneficiaries(finalList);
      }
    } catch (error) {
      console.error('Error fetching beneficiaries:', error);
    }
  };

  const fetchPharmacyMedications = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/pharmacy?active=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = await response.json();
      console.log('💊 Pharmacy medications response:', result);
      if (result.success) {
        console.log('✅ Médicaments disponibles:', result.data.length);
        setPharmacyMedications(result.data);
      }
    } catch (error) {
      console.error('Error fetching pharmacy medications:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/medications/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = await response.json();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRefillList = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/medications/refill/needed`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = await response.json();
      if (result.success) {
        setRefillList(result.data);
      }
    } catch (error) {
      console.error('Error fetching refill list:', error);
    }
  };

  const handleAddMedication = async (e) => {
    e.preventDefault();
    setLoading(true);

    console.log('Sending medication data:', newMedication);

    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/medications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newMedication)
      });

      const result = await response.json();

      console.log('📥 Réponse prescription:', result);

      if (result.success) {
        showMessage('✅ تمت إضافة الوصفة بنجاح', 'success');
        setShowAddModal(false);
        setNewMedication({
          beneficiaryId: '',
          pharmacyMedicationId: '',
          dosage: '',
          frequency: 'once_daily',
          times: ['08:00'],
          withFood: false,
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          prescribedBy: '',
          instructions: '',
          sideEffects: '',
          chronicTreatment: false
        });
        fetchMedications();
        fetchStats();
      } else {
        showMessage(result.message, 'error');
      }
    } catch (error) {
      console.error('Error adding medication:', error);
      showMessage('❌ حدث خطأ', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openAdministerModal = (medication, time) => {
    setAdministerData({
      medicationId: medication._id,
      medicationName: medication.pharmacyMedication?.medicationName || 'دواء',
      time,
      quantityGiven: 1,
      notes: '',
      pharmacyStock: medication.pharmacyMedication?.stock || 0
    });
    setShowAdministerModal(true);
  };

  const handleAdminister = async () => {
    const { medicationId, time, quantityGiven, notes, pharmacyStock } = administerData;
    
    if (quantityGiven < 1) {
      showMessage('❌ الكمية يجب أن تكون أكبر من صفر', 'error');
      return;
    }
    
    if (quantityGiven > pharmacyStock) {
      showMessage('⚠️ الكمية أكبر من المخزون المتوفر', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = getToken();
      console.log('📤 Sending administration:', { medicationId, time, quantityGiven, notes });
      
      const response = await fetch(`${API_URL}/medications/${medicationId}/administer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ time, administered: true, quantityGiven })
      });

      const result = await response.json();
      console.log('📥 Administration response:', result);

      if (result.success) {
        showMessage(
          `✅ تم تسجيل تناول الدواء بنجاح\n📦 المخزون المتبقي: ${result.remainingStock || 0} وحدة`,
          'success'
        );
        setShowAdministerModal(false);
        setAdministerData({
          medicationId: '',
          medicationName: '',
          time: '',
          quantityGiven: 1,
          notes: '',
          pharmacyStock: 0
        });
        fetchMedications();
        fetchStats();
      } else {
        showMessage(`❌ ${result.message}`, 'error');
      }
    } catch (error) {
      console.error('Error administering medication:', error);
      showMessage('❌ حدث خطأ في تسجيل التناول', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFrequencyChange = (frequency) => {
    const freqData = frequencies.find(f => f.value === frequency);
    let defaultTimes = [];
    
    if (freqData.times === 1) defaultTimes = ['08:00'];
    else if (freqData.times === 2) defaultTimes = ['08:00', '20:00'];
    else if (freqData.times === 3) defaultTimes = ['08:00', '14:00', '20:00'];
    else if (freqData.times === 4) defaultTimes = ['06:00', '12:00', '18:00', '00:00'];
    
    setNewMedication({ ...newMedication, frequency, times: defaultTimes });
  };

  return (
    <ProfessionalLayout noPadding>
    <div className="medication-management">
      <div className="medication-header">
        <div>
          <h2>📋 الوصفات الطبية</h2>
          <p className="medication-subtitle">ربط الأدوية بالمستفيدين</p>
        </div>
        <div className="medication-header-actions">
          <select
            value={selectedBeneficiary}
            onChange={(e) => setSelectedBeneficiary(e.target.value)}
            className="beneficiary-select"
          >
            <option value="all">جميع المستفيدين</option>
            {beneficiaries.map(b => (
              <option key={b._id} value={b._id}>
                {b.nom} {b.prenom}
              </option>
            ))}
          </select>
          <button className="btn-add" onClick={() => setShowAddModal(true)}>
            ➕ إضافة دواء
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`medication-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <div className="medication-stats">
          <div className="stat-card total">
            <div className="stat-icon">💊</div>
            <div>
              <div className="stat-value">{stats.totalActive}</div>
              <div className="stat-label">أدوية نشطة</div>
            </div>
          </div>
          <div className="stat-card chronic">
            <div className="stat-icon">🔄</div>
            <div>
              <div className="stat-value">{stats.chronicTreatments}</div>
              <div className="stat-label">علاجات مزمنة</div>
            </div>
          </div>
          <div className="stat-card refill">
            <div className="stat-icon">⚠️</div>
            <div>
              <div className="stat-value">{stats.needingRefill}</div>
              <div className="stat-label">يحتاج تموين</div>
            </div>
          </div>
          <div className="stat-card adherence">
            <div className="stat-icon">✅</div>
            <div>
              <div className="stat-value">{stats.todayAdherence.rate}%</div>
              <div className="stat-label">الالتزام اليوم</div>
            </div>
          </div>
        </div>
      )}

      {/* Refill Alerts - Now shows pharmacy low stock */}
      {refillList.length > 0 && (
        <div className="refill-alert">
          <h3>⚠️ أدوية تحتاج إعادة تموين في الصيدلية</h3>
          <div className="refill-list">
            {refillList.map(med => (
              <div key={med._id} className="refill-item">
                <div>
                  <strong>{med.pharmacyMedication?.medicationName || med.medicationName || 'غير متوفر'}</strong>
                  <span> - {med.beneficiary?.nom} {med.beneficiary?.prenom}</span>
                </div>
                <div className="refill-stock">
                  المخزون: {med.pharmacyMedication?.stock || 0}
                  <a 
                    href="/professional/pharmacy" 
                    className="btn-refill"
                    title="الذهاب للصيدلية لإضافة المخزون"
                  >
                    🏥 الصيدلية
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medications List */}
      <div className="medications-list">
        {loading ? (
          <div className="loading-spinner">جاري التحميل...</div>
        ) : medications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💊</div>
            <p>لا توجد أدوية مسجلة</p>
          </div>
        ) : (
          medications.map(med => (
            <div key={med._id} className="medication-card">
              <div className="medication-card-header">
                <div>
                  <h3>{med.pharmacyMedication?.medicationName || 'غير متوفر'}</h3>
                  <p className="beneficiary-name">
                    👤 {med.beneficiary.nom} {med.beneficiary.prenom}
                  </p>
                </div>
                <div className="medication-badges">
                  {med.chronicTreatment && <span className="badge chronic">مزمن</span>}
                  {med.pharmacyMedication?.isLowStock && <span className="badge low-stock">مخزون منخفض</span>}
                </div>
              </div>

              <div className="medication-details">
                <div className="detail-row">
                  <span className="detail-label">الجرعة:</span>
                  <span className="detail-value">{med.dosage}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">التكرار:</span>
                  <span className="detail-value">
                    {frequencies.find(f => f.value === med.frequency)?.label}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">المواعيد:</span>
                  <span className="detail-value">
                    {med.times.map((time, idx) => (
                      <span key={idx} className="time-badge">
                        {time}
                        <button
                          className="btn-administer"
                          onClick={() => openAdministerModal(med, time)}
                          title="تسجيل تناول الدواء"
                        >
                          ✓
                        </button>
                      </span>
                    ))}
                  </span>
                </div>
                {med.withFood && (
                  <div className="detail-row">
                    <span className="detail-label">⚠️ يؤخذ مع الطعام</span>
                  </div>
                )}
                {med.pharmacyMedication?.stock !== undefined && (
                  <div className="detail-row">
                    <span className="detail-label">المخزون في الصيدلية:</span>
                    <span className="detail-value stock-value">
                      {med.pharmacyMedication.stock} وحدة
                    </span>
                  </div>
                )}
                {med.prescribedBy && (
                  <div className="detail-row">
                    <span className="detail-label">الطبيب:</span>
                    <span className="detail-value">{med.prescribedBy}</span>
                  </div>
                )}
                {med.instructions && (
                  <div className="detail-row full-width">
                    <span className="detail-label">التعليمات:</span>
                    <p className="instructions">{med.instructions}</p>
                  </div>
                )}
                {med.sideEffects && (
                  <div className="detail-row full-width">
                    <span className="detail-label">الأعراض الجانبية:</span>
                    <p className="side-effects">{med.sideEffects}</p>
                  </div>
                )}
              </div>

              <div className="medication-card-footer">
                <span className="date-range">
                  📅 {new Date(med.startDate).toLocaleDateString('ar-MA')}
                  {med.endDate && ` - ${new Date(med.endDate).toLocaleDateString('ar-MA')}`}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Medication Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>➕ إضافة دواء جديد</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAddMedication} className="medication-form">
              <div className="form-row">
                <label>المستفيد * {beneficiaries.length > 0 && `(${beneficiaries.length} متوفر)`}</label>
                <select
                  value={newMedication.beneficiaryId}
                  onChange={(e) => setNewMedication({ ...newMedication, beneficiaryId: e.target.value })}
                  required
                >
                  <option value="">اختر المستفيد</option>
                  {beneficiaries.map(b => (
                    <option key={b._id} value={b._id}>
                      {b.nom} {b.prenom}
                    </option>
                  ))}
                </select>
                {beneficiaries.length === 0 && (
                  <small style={{color: '#dc3545', marginTop: '0.5rem', display: 'block'}}>
                    ⚠️ لا يوجد مستفيدون مُقيمون. تحقق من صفحة المستفيدين.
                  </small>
                )}
              </div>

              <div className="form-row">
                <label>اختر الدواء من الصيدلية * {pharmacyMedications.length > 0 && `(${pharmacyMedications.length} متوفر)`}</label>
                <select
                  value={newMedication.pharmacyMedicationId}
                  onChange={(e) => {
                    const selectedMed = pharmacyMedications.find(m => m._id === e.target.value);
                    setNewMedication({ 
                      ...newMedication, 
                      pharmacyMedicationId: e.target.value,
                      dosage: selectedMed ? `${selectedMed.strength}` : ''
                    });
                  }}
                  required
                >
                  <option value="">اختر الدواء</option>
                  {pharmacyMedications.map(med => (
                    <option key={med._id} value={med._id}>
                      {med.medicationName} - {med.strength} ({med.dosageForm}) - مخزون: {med.stock}
                    </option>
                  ))}
                </select>
                {pharmacyMedications.length === 0 && (
                  <small style={{color: '#dc3545', marginTop: '0.5rem', display: 'block'}}>
                    ⚠️ لا توجد أدوية في الصيدلية. <a href="/professional/pharmacy" style={{color: '#667eea', textDecoration: 'underline'}}>أضف أدوية أولاً</a>
                  </small>
                )}
              </div>

              <div className="form-row">
                <label>الجرعة *</label>
                <input
                  type="text"
                  placeholder="مثال: 500mg أو 2 حبة"
                  value={newMedication.dosage}
                  onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <label>التكرار *</label>
                <select
                  value={newMedication.frequency}
                  onChange={(e) => handleFrequencyChange(e.target.value)}
                  required
                >
                  {frequencies.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label>المواعيد</label>
                <div className="times-input">
                  {newMedication.times.map((time, idx) => (
                    <input
                      key={idx}
                      type="time"
                      value={time}
                      onChange={(e) => {
                        const newTimes = [...newMedication.times];
                        newTimes[idx] = e.target.value;
                        setNewMedication({ ...newMedication, times: newTimes });
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="form-row checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={newMedication.withFood}
                    onChange={(e) => setNewMedication({ ...newMedication, withFood: e.target.checked })}
                  />
                  يؤخذ مع الطعام
                </label>
              </div>

              <div className="form-row checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={newMedication.chronicTreatment}
                    onChange={(e) => setNewMedication({ ...newMedication, chronicTreatment: e.target.checked })}
                  />
                  علاج مزمن
                </label>
              </div>

              <div className="form-row">
                <label>تاريخ البدء *</label>
                <input
                  type="date"
                  value={newMedication.startDate}
                  onChange={(e) => setNewMedication({ ...newMedication, startDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <label>تاريخ الانتهاء</label>
                <input
                  type="date"
                  value={newMedication.endDate}
                  onChange={(e) => setNewMedication({ ...newMedication, endDate: e.target.value })}
                />
              </div>

              <div className="form-row">
                <label>الطبيب الموصوف</label>
                <input
                  type="text"
                  value={newMedication.prescribedBy}
                  onChange={(e) => setNewMedication({ ...newMedication, prescribedBy: e.target.value })}
                />
              </div>

              <div className="form-row">
                <label>التعليمات</label>
                <textarea
                  value={newMedication.instructions}
                  onChange={(e) => setNewMedication({ ...newMedication, instructions: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="form-row">
                <label>الأعراض الجانبية</label>
                <textarea
                  value={newMedication.sideEffects}
                  onChange={(e) => setNewMedication({ ...newMedication, sideEffects: e.target.value })}
                  rows="2"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowAddModal(false)}>
                  إلغاء
                </button>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'جاري الحفظ...' : '💾 حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Administer Medication Modal */}
      {showAdministerModal && (
        <div className="modal-overlay" onClick={() => setShowAdministerModal(false)}>
          <div className="modal-content administer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💊 تسجيل تناول الدواء</h3>
              <button className="modal-close" onClick={() => setShowAdministerModal(false)}>✕</button>
            </div>

            <div className="administer-form">
              <div className="administer-info-card">
                <div className="info-row">
                  <span className="info-icon">💊</span>
                  <div className="info-content">
                    <span className="info-label">الدواء</span>
                    <span className="info-value">{administerData.medicationName}</span>
                  </div>
                </div>
                <div className="info-row">
                  <span className="info-icon">⏰</span>
                  <div className="info-content">
                    <span className="info-label">الموعد</span>
                    <span className="info-value">{administerData.time}</span>
                  </div>
                </div>
                <div className="info-row">
                  <span className="info-icon">📦</span>
                  <div className="info-content">
                    <span className="info-label">المخزون المتوفر</span>
                    <span className={`info-value ${administerData.pharmacyStock < 10 ? 'low-stock' : ''}`}>
                      {administerData.pharmacyStock} وحدة
                    </span>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <label>الكمية المُعطاة *</label>
                <div className="quantity-control">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => setAdministerData({
                      ...administerData,
                      quantityGiven: Math.max(1, administerData.quantityGiven - 1)
                    })}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={administerData.pharmacyStock}
                    value={administerData.quantityGiven}
                    onChange={(e) => setAdministerData({
                      ...administerData,
                      quantityGiven: parseInt(e.target.value) || 1
                    })}
                    className="qty-input"
                  />
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => setAdministerData({
                      ...administerData,
                      quantityGiven: Math.min(administerData.pharmacyStock, administerData.quantityGiven + 1)
                    })}
                  >
                    +
                  </button>
                </div>
                {administerData.quantityGiven > administerData.pharmacyStock && (
                  <small className="error-text">⚠️ الكمية أكبر من المخزون المتوفر</small>
                )}
              </div>

              <div className="form-row">
                <label>ملاحظات (اختياري)</label>
                <textarea
                  value={administerData.notes}
                  onChange={(e) => setAdministerData({
                    ...administerData,
                    notes: e.target.value
                  })}
                  rows="3"
                  placeholder="أي ملاحظات حول تناول الدواء..."
                />
              </div>

              <div className="administer-summary">
                <div className="summary-item">
                  <span>الكمية المُعطاة:</span>
                  <strong>{administerData.quantityGiven} وحدة</strong>
                </div>
                <div className="summary-item">
                  <span>المخزون بعد التناول:</span>
                  <strong className={administerData.pharmacyStock - administerData.quantityGiven < 10 ? 'text-danger' : ''}>
                    {administerData.pharmacyStock - administerData.quantityGiven} وحدة
                  </strong>
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={() => setShowAdministerModal(false)}
                  disabled={loading}
                >
                  إلغاء
                </button>
                <button 
                  type="button" 
                  className="btn-submit btn-administer-confirm" 
                  onClick={handleAdminister}
                  disabled={loading || administerData.quantityGiven > administerData.pharmacyStock}
                >
                  {loading ? 'جاري التسجيل...' : '✓ تأكيد التناول'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </ProfessionalLayout>
  );
};

export default MedicationManagement;
