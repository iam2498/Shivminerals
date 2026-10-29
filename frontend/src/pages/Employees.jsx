import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useToast } from '../components/Toast';
import { api, post } from '../api';
import { cur, now } from '../utils';
import BackBar from '../components/BackBar';

export default function Employees() {
  const { lang, t } = useI18n();
  const { toast } = useToast();

  const [employees, setEmployees] = useState([]);

  // Form State for Salary / Advance Entry
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [entryDate, setEntryDate] = useState(now());
  const [entryType, setEntryType] = useState('earned');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryNotes, setEntryNotes] = useState('');
  const [savingEntry, setSavingEntry] = useState(false);

  // Form State for Add New Employee
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpPhone, setNewEmpPhone] = useState('');
  const [newEmpRole, setNewEmpRole] = useState('');
  const [savingEmp, setSavingEmp] = useState(false);

  const loadEmployees = async () => {
    try {
      const es = await api('employees');
      setEmployees(es || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  // Submit Salary / Advance entry
  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!selectedEmpId) {
      toast(t('pickemp'));
      return;
    }
    const amt = Number(entryAmount);
    if (!amt || amt <= 0) {
      toast('Enter valid amount');
      return;
    }

    setSavingEntry(true);
    try {
      await post('empentries', {
        employee: selectedEmpId,
        date: entryDate,
        type: entryType,
        amount: amt,
        notes: entryNotes,
      });

      toast(t('saved'));
      setEntryAmount('');
      setEntryNotes('');
      loadEmployees();
    } catch (err) {
      toast(err.message);
    } finally {
      setSavingEntry(false);
    }
  };

  // Submit New Employee
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!newEmpName.trim()) {
      toast('Employee name is required');
      return;
    }

    setSavingEmp(true);
    try {
      await post('employees', {
        name: newEmpName.trim(),
        phone: newEmpPhone.trim(),
        role: newEmpRole.trim(),
      });

      toast(t('saved'));
      setNewEmpName('');
      setNewEmpPhone('');
      setNewEmpRole('');
      loadEmployees();
    } catch (err) {
      toast(err.message);
    } finally {
      setSavingEmp(false);
    }
  };

  return (
    <div>
      <BackBar />

      {/* Staff Directory Table */}
      <div className="panel-card">
        <div className="panel-title">
          <span>🧑‍🏭</span>
          <span>{t('emp')} &bull; {lang === 'gu' ? 'કર્મચારી ખાતાવહી' : 'Staff Roster'}</span>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('name')}</th>
                <th>{t('phone')}</th>
                <th>{t('role')}</th>
                <th className="num">{t('earned')}</th>
                <th className="num">{t('spaid')}</th>
                <th className="num">{t('adv')}</th>
                <th className="num">{t('pend')}</th>
                <th style={{ textAlign: 'center' }} className="noprint">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {employees.length > 0 ? (
                employees.map((e) => (
                  <tr key={e._id}>
                    <td>
                      <Link to={`/empst/${e._id}`} style={{ fontWeight: '700', color: 'var(--primary)' }}>
                        {e.name}
                      </Link>
                    </td>
                    <td>
                      {e.phone ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{e.phone}</span>
                          <a href={`tel:${e.phone}`} className="noprint action-icon-btn" title="Call">📞</a>
                          <a href={`https://wa.me/91${e.phone}`} target="_blank" rel="noreferrer" className="noprint action-icon-btn" title="WhatsApp">💬</a>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{e.role || '-'}</td>
                    <td className="num font-mono" style={{ color: 'var(--success)' }}>{cur(e.earned)}</td>
                    <td className="num font-mono" style={{ color: 'var(--primary)' }}>{cur(e.paid)}</td>
                    <td className="num font-mono" style={{ color: 'var(--warning)' }}>{cur(e.advance)}</td>
                    <td className="num font-mono" style={{
                      fontWeight: '700',
                      color: e.pending > 0 ? 'var(--danger)' : 'var(--success)',
                    }}>
                      {cur(e.pending)}
                    </td>
                    <td style={{ textAlign: 'center' }} className="noprint">
                      <Link to={`/empst/${e._id}`} className="btn-action-view">
                        📊 {t('ledger')}
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    {t('none')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Salary / Advance Entry Panel */}
      <div className="panel-card" style={{ marginTop: '20px' }}>
        <div className="panel-title">
          <span>💵</span>
          <span>{t('addentry')}</span>
        </div>

        <form onSubmit={handleAddEntry}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="entry-emp">{t('empr')} *</label>
              <div className="input-wrap">
                <span className="input-icon">👤</span>
                <select
                  id="entry-emp"
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  required
                >
                  <option value="">-- {t('pickemp')} --</option>
                  {employees.map((e) => (
                    <option key={e._id} value={e._id}>
                      {e.name} {e.role ? `(${e.role})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="entry-date">{t('dateTime')}</label>
              <div className="input-wrap">
                <span className="input-icon">📅</span>
                <input
                  id="entry-date"
                  type="datetime-local"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="entry-type">{t('type')}</label>
              <div className="input-wrap">
                <span className="input-icon">📋</span>
                <select
                  id="entry-type"
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value)}
                >
                  <option value="earned">{t('earned')}</option>
                  <option value="paid">{t('spaid')}</option>
                  <option value="advance">{t('adv')}</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="entry-amount">
                <span>{t('amt')} *</span>
                <span className="label-hint">Amount (₹)</span>
              </label>
              <div className="input-wrap">
                <span className="input-icon">₹</span>
                <input
                  id="entry-amount"
                  type="number"
                  step="any"
                  placeholder="0.00"
                  inputMode="decimal"
                  value={entryAmount}
                  onChange={(e) => setEntryAmount(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group full">
              <label className="form-label" htmlFor="entry-notes">{t('notes')}</label>
              <div className="input-wrap">
                <span className="input-icon">📝</span>
                <input
                  id="entry-notes"
                  type="text"
                  placeholder="Month / Details / Mode"
                  value={entryNotes}
                  onChange={(e) => setEntryNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <button type="submit" className="btn-primary" disabled={savingEntry}>
              <span>💾</span>
              <span>{savingEntry ? t('saving') : t('save')}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Add New Employee Panel */}
      <div className="panel-card" style={{ marginTop: '20px' }}>
        <div className="panel-title">
          <span>➕</span>
          <span>{t('addemp')}</span>
        </div>

        <form onSubmit={handleAddEmployee}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="new-emp-name">{t('name')} *</label>
              <div className="input-wrap">
                <span className="input-icon">👤</span>
                <input
                  id="new-emp-name"
                  type="text"
                  placeholder="Full name"
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-emp-phone">{t('phone')}</label>
              <div className="input-wrap">
                <span className="input-icon">📞</span>
                <input
                  id="new-emp-phone"
                  type="tel"
                  placeholder="Mobile number"
                  value={newEmpPhone}
                  onChange={(e) => setNewEmpPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-emp-role">{t('role')}</label>
              <div className="input-wrap">
                <span className="input-icon">🏷️</span>
                <input
                  id="new-emp-role"
                  type="text"
                  placeholder="e.g. Weighbridge Operator, Driver, Accountant"
                  value={newEmpRole}
                  onChange={(e) => setNewEmpRole(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <button type="submit" className="btn-primary" disabled={savingEmp}>
              <span>💾</span>
              <span>{savingEmp ? t('saving') : t('save')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
