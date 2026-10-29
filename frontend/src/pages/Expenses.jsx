import React, { useState, useEffect } from 'react';
import { useI18n } from '../i18n';
import { useToast } from '../components/Toast';
import { api, post, del } from '../api';
import { cur, dateOnly, monthStart, today } from '../utils';
import BackBar from '../components/BackBar';
import PrintHead from '../components/PrintHead';
import DatePresets from '../components/DatePresets';

export default function Expenses() {
  const { lang, t } = useI18n();
  const { toast } = useToast();

  const [staffList, setStaffList] = useState([]);

  // Form State: Log New Expense
  const [expDate, setExpDate] = useState(today());
  const [selectedStaff, setSelectedStaff] = useState('');
  const [customPayee, setCustomPayee] = useState('');
  const [notes, setNotes] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  // Filter State: Expenses Report
  const [fromDate, setFromDate] = useState(monthStart());
  const [toDate, setToDate] = useState(today());
  const [filterStaff, setFilterStaff] = useState('');
  const [report, setReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // Load employees for staff dropdown
  const loadEmployees = async () => {
    try {
      const es = await api('employees');
      setStaffList(es || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadReport = async (fr = fromDate, to = toDate, staff = filterStaff) => {
    setLoadingReport(true);
    try {
      let url = `expenses?from=${fr}&to=${to}`;
      if (staff) url += `&name=${encodeURIComponent(staff)}`;
      const data = await api(url);

      // Client-side safety filter in case backend filter needs exact casing
      if (staff && data.items) {
        data.items = data.items.filter(
          (i) => (i.name || '').trim().toLowerCase() === staff.trim().toLowerCase()
        );
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
    loadReport(monthStart(), today(), '');
  }, []);

  const handleSaveExpense = async (e) => {
    e.preventDefault();
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
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast('Enter valid amount');
      return;
    }

    setSaving(true);
    try {
      await post('expenses', {
        date: expDate,
        category: 'other',
        name: finalName,
        amount: numAmount,
        notes,
      });

      toast(t('saved'));
      setAmount('');
      setNotes('');
      setCustomPayee('');
      loadReport();
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
      loadReport();
    } catch (err) {
      toast(err.message);
    }
  };

  const staffLabel = filterStaff ? filterStaff : t('allStaff');

  return (
    <div>
      <BackBar />

      {/* Log New Expense Panel */}
      <div className="panel-card">
        <div className="panel-title">
          <span>⛽</span>
          <span>{t('exp')} &bull; {lang === 'gu' ? 'નવો ખર્ચ ઉમેરો' : 'Log New Expense'}</span>
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
                <span>{t('staffName')}</span>
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

            {/* Custom payee input if 'Other' is picked */}
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

            {/* 3. Notes: Option where user can add notes for expenses */}
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

            {/* 4. Amount: Last is amount */}
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

          {/* 5. Save Button to add that entry */}
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
          {/* 1. From Date (Date only, not time) */}
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

          {/* 2. To Date (Date only, not time) */}
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
          <div className="form-group full">
            <label className="form-label" htmlFor="report-staff">{t('staffName')}</label>
            <div className="input-wrap">
              <span className="input-icon">👤</span>
              <select
                id="report-staff"
                value={filterStaff}
                onChange={(e) => {
                  setFilterStaff(e.target.value);
                  loadReport(fromDate, toDate, e.target.value);
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
        </div>

        <DatePresets
          onSelect={(f, to) => {
            setFromDate(f);
            setToDate(to);
            loadReport(f, to, filterStaff);
          }}
        />

        {/* 4. View Report Button */}
        <div style={{ marginTop: '16px' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => loadReport(fromDate, toDate, filterStaff)}
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
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '6px', color: 'var(--text-muted)', fontSize: '13.5px' }}>
                <span>📅 <b>{dateOnly(fromDate)}</b> &rarr; <b>{dateOnly(toDate)}</b></span>
                <span>👤 <b>{staffLabel}</b></span>
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

          {/* Financial Total Spent Card */}
          <div className="stats-grid" style={{ marginBottom: '20px' }}>
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

          {/* Expense Items Table */}
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>{t('date')}</th>
                  <th>{t('staffName')}</th>
                  <th>{t('notes')}</th>
                  <th className="num" style={{ width: '140px' }}>{t('amt')}</th>
                  <th className="noprint" style={{ textAlign: 'center', width: '80px' }}>{t('actions')}</th>
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
                    <td colSpan="5" style={{ textAlign: 'center', padding: '35px', color: 'var(--text-muted)', fontSize: '14.5px' }}>
                      {t('none')}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--bg-card-subtle)', fontWeight: '800', fontSize: '15px' }}>
                  <th colSpan="3">{t('total')}</th>
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
    </div>
  );
}
