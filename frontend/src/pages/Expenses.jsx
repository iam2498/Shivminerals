import React, { useState, useEffect } from 'react';
import { useI18n, categoryDisplay } from '../i18n';
import { useToast } from '../components/Toast';
import { api, post, del } from '../api';
import { cur, dateOnly, monthStart, today } from '../utils';
import BackBar from '../components/BackBar';
import PrintHead from '../components/PrintHead';
import DatePresets from '../components/DatePresets';

const DEFAULT_SUGGESTED_CATEGORIES = [
  'Mobile Recharge',
  'Personal Bike Petrol',
  'Food and Meals',
  'Tea and Snacks',
  'Masala / Tobacco',
  'Personal Purchase',
  'Salary Advance',
  'Other Personal Withdrawal',
  'Diesel',
  'Vehicle Repair',
  'Electricity',
  'Site / Office Rent',
  'Other',
];

export default function Expenses() {
  const { lang, t } = useI18n();
  const { toast } = useToast();

  const [staffList, setStaffList] = useState([]);
  const [categoryList, setCategoryList] = useState(
    DEFAULT_SUGGESTED_CATEGORIES.map((name, index) => ({ _id: `cat-${index}`, name }))
  );

  // Form State: Log New Expense
  const [expDate, setExpDate] = useState(today());
  const [selectedStaff, setSelectedStaff] = useState('');
  const [customPayee, setCustomPayee] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_SUGGESTED_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  // Filter State: Expenses Report
  const [fromDate, setFromDate] = useState(monthStart());
  const [toDate, setToDate] = useState(today());
  const [filterStaff, setFilterStaff] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [report, setReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // Manage Categories Modal
  const [showManageModal, setShowManageModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [savingCat, setSavingCat] = useState(false);

  // Load employees for staff dropdown
  const loadEmployees = async () => {
    try {
      const es = await api('employees');
      setStaffList(es || []);
    } catch (err) {
      console.error('Error loading employees:', err);
    }
  };

  // Load configured categories from backend
  const loadCategories = async () => {
    try {
      const cats = await api('expenses/categories');
      if (Array.isArray(cats) && cats.length > 0) {
        setCategoryList(cats);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadReport = async (
    fr = fromDate,
    to = toDate,
    staff = filterStaff,
    category = filterCategory
  ) => {
    setLoadingReport(true);
    try {
      let url = `expenses?from=${fr}&to=${to}`;
      if (staff) url += `&name=${encodeURIComponent(staff)}`;
      if (category && category !== 'all') url += `&category=${encodeURIComponent(category)}`;
      const data = await api(url);

      // Client-side safety filter
      if (data && data.items) {
        if (staff) {
          data.items = data.items.filter(
            (i) => (i.name || '').trim().toLowerCase() === staff.trim().toLowerCase()
          );
        }
        if (category && category !== 'all') {
          data.items = data.items.filter(
            (i) => (i.category || '').trim().toLowerCase() === category.trim().toLowerCase()
          );
        }
        data.total = data.items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
      }

      setReport(data);
    } catch (err) {
      toast(err.message);
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    loadEmployees();
    loadCategories();
    loadReport(monthStart(), today(), '', '');
  }, []);

  const handleSaveExpense = async (e) => {
    e.preventDefault();

    // 1. Resolve Staff / Payee
    let finalName = selectedStaff;
    if (selectedStaff === '__other__') {
      finalName = customPayee.trim();
      if (!finalName) {
        toast('Please enter payee name');
        return;
      }
    }
    if (!finalName) {
      toast(t('pickStaff'));
      return;
    }

    // 2. Resolve Expense Category
    let finalCategory = selectedCategory;
    if (selectedCategory === '__other__') {
      finalCategory = customCategory.trim();
      if (!finalCategory) {
        toast(t('customCategory') + ' is required');
        return;
      }
    }
    if (!finalCategory) {
      finalCategory = 'Other';
    }

    // 3. Resolve Amount
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast('Enter valid amount');
      return;
    }

    setSaving(true);
    try {
      await post('expenses', {
        date: expDate,
        category: finalCategory,
        name: finalName,
        amount: numAmount,
        notes,
      });

      toast(t('saved'));
      setAmount('');
      setNotes('');
      setCustomPayee('');
      setCustomCategory('');
      loadReport(fromDate, toDate, filterStaff, filterCategory);
      loadCategories(); // reload categories in case new custom category was registered
    } catch (err) {
      toast(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = async (expId) => {
    if (!window.confirm(t('del'))) return;
    try {
      await del('expenses', expId);
      toast('Deleted successfully');
      loadReport(fromDate, toDate, filterStaff, filterCategory);
    } catch (err) {
      toast(err.message);
    }
  };

  // Add custom category via Admin Modal
  const handleAddCategory = async (e) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    setSavingCat(true);
    try {
      await post('expenses/categories', { name: trimmed });
      toast(t('categoryAdded'));
      setNewCatName('');
      await loadCategories();
      setSelectedCategory(trimmed);
    } catch (err) {
      toast(err.message);
    } finally {
      setSavingCat(false);
    }
  };

  // Delete custom category via Admin Modal
  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await del('expenses/categories', catId);
      toast(t('categoryDeleted'));
      await loadCategories();
    } catch (err) {
      toast(err.message);
    }
  };

  const staffLabel = filterStaff ? filterStaff : t('allStaff');
  const categoryLabel = filterCategory
    ? categoryDisplay(filterCategory, lang)
    : t('allCategories');

  return (
    <div>
      <BackBar />

      {/* Log New Expense Panel */}
      <div className="panel-card">
        <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⛽</span>
            <span>{t('exp')} &bull; {lang === 'gu' ? 'નવો ખર્ચ ઉમેરો' : 'Log New Expense'}</span>
          </div>
          <button
            type="button"
            className="btn-cfg"
            onClick={() => setShowManageModal(true)}
            title="Configure Categories"
          >
            <span>⚙️</span>
            <span>{t('manageCategories')}</span>
          </button>
        </div>

        <form onSubmit={handleSaveExpense}>
          <div className="form-grid">
            {/* 1. Date: Select only date, not time */}
            <div className="form-group">
              <label className="form-label" htmlFor="exp-d">{t('date')}</label>
              <div className="input-wrap">
                <span className="input-icon">📅</span>
                <input
                  id="exp-d"
                  type="date"
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* 2. Staff Name: Select from the staff list */}
            <div className="form-group">
              <label className="form-label" htmlFor="exp-nm">
                <span>{t('staffName')} *</span>
                <span className="label-hint">{t('pickStaff')}</span>
              </label>
              <div className="input-wrap">
                <span className="input-icon">👤</span>
                <select
                  id="exp-nm"
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  required
                >
                  <option value="">-- {t('pickStaff')} --</option>
                  {staffList.map((e) => (
                    <option key={e._id} value={e.name}>
                      {e.name} {e.role ? `(${e.role})` : ''}
                    </option>
                  ))}
                  <option value="__other__">{t('otherPayee')}</option>
                </select>
              </div>
            </div>

            {/* 3. Expense Category Selection */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="exp-cat" style={{ marginBottom: '4px' }}>
                  <span>{t('category')} *</span>
                </label>
              </div>
              <div className="input-wrap">
                <span className="input-icon">🏷️</span>
                <select
                  id="exp-cat"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  required
                >
                  <option value="">-- {t('pickCategory')} --</option>
                  {categoryList.map((c) => (
                    <option key={c._id || c.name} value={c.name}>
                      {categoryDisplay(c.name, lang)}
                    </option>
                  ))}
                  <option value="__other__">{t('otherCategory')}</option>
                </select>
              </div>
            </div>

            {/* Custom payee input if 'Other' payee is picked */}
            {selectedStaff === '__other__' && (
              <div className="form-group full">
                <label className="form-label" htmlFor="custom-payee">{t('what')} *</label>
                <div className="input-wrap">
                  <span className="input-icon">📝</span>
                  <input
                    id="custom-payee"
                    type="text"
                    placeholder={lang === 'gu' ? 'વ્યક્તિ કે પેઢીનું નામ દાખલ કરો' : 'Enter payee or person name'}
                    value={customPayee}
                    onChange={(e) => setCustomPayee(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* Custom category input if 'Other (Enter custom category)' is picked */}
            {selectedCategory === '__other__' && (
              <div className="form-group full">
                <label className="form-label" htmlFor="custom-cat">
                  <span>{t('customCategory')} *</span>
                  <span className="label-hint">{lang === 'gu' ? 'નવી કેટેગરી દાખલ કરો' : 'Type new category name'}</span>
                </label>
                <div className="input-wrap">
                  <span className="input-icon">➕</span>
                  <input
                    id="custom-cat"
                    type="text"
                    placeholder={t('customCategoryPlaceholder')}
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* 4. Notes: Option where user can add notes for expenses */}
            <div className="form-group full">
              <label className="form-label" htmlFor="exp-nt">{t('notes')}</label>
              <div className="input-wrap">
                <span className="input-icon">📝</span>
                <input
                  id="exp-nt"
                  type="text"
                  placeholder={t('expNotesPlaceholder')}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* 5. Amount: Last is amount */}
            <div className="form-group full">
              <label className="form-label" htmlFor="exp-amt">
                <span>{t('amt')} *</span>
                <span className="label-hint">Expense amount (₹)</span>
              </label>
              <div className="input-wrap">
                <span className="input-icon">₹</span>
                <input
                  id="exp-amt"
                  type="number"
                  step="any"
                  placeholder="0.00"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  style={{ fontSize: '18px', fontWeight: '700' }}
                />
              </div>
            </div>
          </div>

          {/* 6. Save Button to add that entry */}
          <div style={{ marginTop: '16px' }}>
            <button type="submit" className="btn-primary" disabled={saving}>
              <span>💾</span>
              <span>{saving ? t('saving') : t('save')}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Expenses Report Filter Panel */}
      <div className="panel-card noprint" style={{ marginTop: '20px' }}>
        <div className="panel-title">
          <span>📊</span>
          <span>{t('expReport')}</span>
        </div>

        <div className="form-grid">
          {/* 1. From Date */}
          <div className="form-group">
            <label className="form-label" htmlFor="report-fr">{t('from')}</label>
            <div className="input-wrap">
              <span className="input-icon">📅</span>
              <input
                id="report-fr"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
          </div>

          {/* 2. To Date */}
          <div className="form-group">
            <label className="form-label" htmlFor="report-to">{t('to')}</label>
            <div className="input-wrap">
              <span className="input-icon">📅</span>
              <input
                id="report-to"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>

          {/* 3. Select Staff */}
          <div className="form-group">
            <label className="form-label" htmlFor="report-staff">{t('staffName')}</label>
            <div className="input-wrap">
              <span className="input-icon">👤</span>
              <select
                id="report-staff"
                value={filterStaff}
                onChange={(e) => {
                  setFilterStaff(e.target.value);
                  loadReport(fromDate, toDate, e.target.value, filterCategory);
                }}
              >
                <option value="">-- {t('allStaff')} --</option>
                {staffList.map((e) => (
                  <option key={e._id} value={e.name}>
                    {e.name} {e.role ? `(${e.role})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Select Expense Category */}
          <div className="form-group">
            <label className="form-label" htmlFor="report-cat">{t('category')}</label>
            <div className="input-wrap">
              <span className="input-icon">🏷️</span>
              <select
                id="report-cat"
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  loadReport(fromDate, toDate, filterStaff, e.target.value);
                }}
              >
                <option value="">-- {t('allCategories')} --</option>
                {categoryList.map((c) => (
                  <option key={c._id || c.name} value={c.name}>
                    {categoryDisplay(c.name, lang)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <DatePresets
          onSelect={(f, to) => {
            setFromDate(f);
            setToDate(to);
            loadReport(f, to, filterStaff, filterCategory);
          }}
        />

        {/* View Report Button */}
        <div style={{ marginTop: '16px' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => loadReport(fromDate, toDate, filterStaff, filterCategory)}
          >
            <span>🔍</span>
            <span>{t('viewReport')}</span>
          </button>
        </div>
      </div>

      {/* Printable Report Output */}
      {report && (
        <div className="panel-card" style={{ marginTop: '20px' }}>
          <PrintHead />

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '16px',
          }}>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>⛽</span>
                <span>{t('expReport')}</span>
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '6px', color: 'var(--text-muted)', fontSize: '13.5px' }}>
                <span>📅 <b>{dateOnly(fromDate)}</b> &rarr; <b>{dateOnly(toDate)}</b></span>
                <span>👤 <b>{staffLabel}</b></span>
                <span>🏷️ <b>{categoryLabel}</b></span>
              </div>
            </div>

            <button
              type="button"
              className="btn-primary noprint"
              onClick={() => window.print()}
              style={{ padding: '10px 18px', fontWeight: '700' }}
            >
              <span>🖨️</span>
              <span>{t('printReport')}</span>
            </button>
          </div>

          {/* Financial Summary KPI Cards */}
          <div className="stats-grid" style={{ marginBottom: '16px' }}>
            <div className="stat-card" style={{ background: 'var(--danger-light)', borderColor: 'var(--danger)' }}>
              <div className="stat-icon rose">💸</div>
              <div className="stat-meta">
                <span className="stat-label" style={{ color: 'var(--danger-text)' }}>{t('spent')}</span>
                <span className="stat-value" style={{ color: 'var(--danger)' }}>{cur(report.total)}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon amber">📋</div>
              <div className="stat-meta">
                <span className="stat-label">{lang === 'gu' ? 'કુલ એન્ટ્રીઓ' : 'Total Entries'}</span>
                <span className="stat-value">{report.items ? report.items.length : 0}</span>
              </div>
            </div>
          </div>

          {/* Category-wise Breakdown Pills (Clickable to Filter) */}
          {report.byCat && Object.keys(report.byCat).length > 0 && (
            <div className="noprint" style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {t('catBreakdown')}
              </div>
              <div className="category-pills-wrap">
                <button
                  type="button"
                  className={`category-pill ${!filterCategory ? 'active' : ''}`}
                  onClick={() => {
                    setFilterCategory('');
                    loadReport(fromDate, toDate, filterStaff, '');
                  }}
                >
                  <span>{t('allCategories')}</span>
                  <span className="pill-amt">{cur(report.total)}</span>
                </button>
                {Object.entries(report.byCat).map(([cat, amt]) => {
                  const isActive = filterCategory.toLowerCase() === cat.toLowerCase();
                  return (
                    <button
                      key={cat}
                      type="button"
                      className={`category-pill ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        const next = isActive ? '' : cat;
                        setFilterCategory(next);
                        loadReport(fromDate, toDate, filterStaff, next);
                      }}
                    >
                      <span>{categoryDisplay(cat, lang)}</span>
                      <span className="pill-amt">{cur(amt)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Expense Items Table */}
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '110px' }}>{t('date')}</th>
                  <th>{t('staffName')}</th>
                  <th>{t('category')}</th>
                  <th>{t('notes')}</th>
                  <th className="num" style={{ width: '130px' }}>{t('amt')}</th>
                  <th className="noprint" style={{ textAlign: 'center', width: '70px' }}>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {report.items && report.items.length > 0 ? (
                  report.items.map((i) => (
                    <tr key={i._id}>
                      <td><b>{dateOnly(i.date)}</b></td>
                      <td>
                        <span style={{ fontWeight: '600', color: 'var(--primary)' }}>
                          {i.name || '-'}
                        </span>
                      </td>
                      <td>
                        <span className="category-badge">
                          🏷️ {categoryDisplay(i.category, lang)}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{i.notes || '-'}</td>
                      <td className="num font-mono" style={{ color: 'var(--danger)', fontWeight: '700', fontSize: '15px' }}>
                        {cur(i.amount)}
                      </td>
                      <td className="noprint" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn-del"
                          title={t('del')}
                          onClick={() => handleDeleteExpense(i._id)}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '35px', color: 'var(--text-muted)', fontSize: '14.5px' }}>
                      {t('none')}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--bg-card-subtle)', fontWeight: '800', fontSize: '15px' }}>
                  <th colSpan="4">{t('total')}</th>
                  <th className="num font-mono" style={{ color: 'var(--danger)', fontSize: '16px' }}>
                    {cur(report.total)}
                  </th>
                  <th className="noprint" />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Configure Categories Admin Modal */}
      {showManageModal && (
        <div className="modal-overlay" onClick={() => setShowManageModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <span>⚙️</span>
                <span>{t('manageCategories')}</span>
              </h3>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '16px' }}
                onClick={() => setShowManageModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Form to Add New Category */}
              <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder={t('newCategoryName')}
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn-primary" disabled={savingCat} style={{ whiteSpace: 'nowrap' }}>
                  <span>➕</span>
                  <span>{t('addCategory')}</span>
                </button>
              </form>

              {/* List of Existing Categories */}
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>
                {lang === 'gu' ? 'હાલની કેટેગરીઓ:' : 'Configured Categories:'}
              </div>
              <div className="cat-list-box">
                {categoryList.map((cat) => (
                  <div key={cat._id || cat.name} className="cat-list-item">
                    <span>🏷️ {categoryDisplay(cat.name, lang)}</span>
                    {cat._id && !cat._id.startsWith('cat-') && (
                      <button
                        type="button"
                        className="btn-del"
                        title="Delete category"
                        onClick={() => handleDeleteCategory(cat._id)}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ textAlign: 'right', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowManageModal(false)}
                >
                  {t('close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
