import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useToast } from '../components/Toast';
import { api, del } from '../api';
import { cur, dateOnly, monthStart, today } from '../utils';
import BackBar from '../components/BackBar';
import PrintHead from '../components/PrintHead';
import DatePresets from '../components/DatePresets';

export default function EmployeeStatement() {
  const { id } = useParams();
  const { lang, t } = useI18n();
  const { toast } = useToast();

  const [employees, setEmployees] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState(id || '');
  const [fromDate, setFromDate] = useState(monthStart());
  const [toDate, setToDate] = useState(today());
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const es = await api('employees');
        setEmployees(es || []);
      } catch (err) {
        console.error(err);
      }
    }
    fetchEmployees();
  }, []);

  const loadStatement = async (eid = selectedEmpId, fr = fromDate, to = toDate) => {
    if (!eid) return;
    setLoading(true);
    try {
      const data = await api(`empstatement?employee=${eid}&from=${fr}&to=${to}`);
      setStatement(data);
    } catch (err) {
      toast(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      setSelectedEmpId(id);
      loadStatement(id, fromDate, toDate);
    }
  }, [id]);

  const handleDelete = async (entryId) => {
    if (!window.confirm(t('del'))) return;
    try {
      await del('empentries', entryId);
      toast('Deleted successfully');
      loadStatement();
    } catch (err) {
      toast(err.message);
    }
  };

  return (
    <div>
      <BackBar to="/emp" label="← Back to Staff" />

      {/* Filter Card */}
      <div className="panel-card noprint">
        <div className="panel-title">
          <span>🧑‍🏭</span>
          <span>{t('empr')} &bull; {t('ledger')}</span>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="empst-select">{t('empr')} *</label>
            <div className="input-wrap">
              <span className="input-icon">👤</span>
              <select
                id="empst-select"
                value={selectedEmpId}
                onChange={(e) => {
                  setSelectedEmpId(e.target.value);
                  if (e.target.value) loadStatement(e.target.value, fromDate, toDate);
                }}
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
            <label className="form-label" htmlFor="empst-from">{t('from')}</label>
            <div className="input-wrap">
              <span className="input-icon">📅</span>
              <input
                id="empst-from"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="empst-to">{t('to')}</label>
            <div className="input-wrap">
              <span className="input-icon">📅</span>
              <input
                id="empst-to"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DatePresets
          onSelect={(f, to) => {
            setFromDate(f);
            setToDate(to);
            if (selectedEmpId) loadStatement(selectedEmpId, f, to);
          }}
        />

        <div style={{ marginTop: '16px' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => loadStatement(selectedEmpId, fromDate, toDate)}
          >
            <span>🔍</span>
            <span>{t('show')}</span>
          </button>
        </div>
      </div>

      {/* Employee Statement Card & Printable View */}
      {statement && (
        <div className="panel-card" style={{ marginTop: '20px' }}>
          <PrintHead />

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '16px',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '14px',
          }}>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '800' }}>{statement.employee?.name}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                Role: <b>{statement.employee?.role || 'Staff'}</b> &bull; Mo: {statement.employee?.phone || '-'}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {dateOnly(fromDate)} &rarr; {dateOnly(toDate)}
              </p>
            </div>

            <button
              type="button"
              className="btn-primary noprint"
              onClick={() => window.print()}
            >
              <span>🖨️</span>
              <span>{t('print')}</span>
            </button>
          </div>

          {/* Opening Balance Bar */}
          <div style={{
            background: 'var(--bg-card-subtle)',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '14px',
          }}>
            <span><b>{t('carry')} ({dateOnly(fromDate)} {lang === 'gu' ? 'પહેલાં' : 'Before'}):</b></span>
            <span style={{
              fontWeight: '800',
              fontSize: '16px',
              color: statement.opening > 0 ? 'var(--danger)' : 'var(--success)',
            }}>
              {cur(statement.opening)}
            </span>
          </div>

          {/* Table */}
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('date')}</th>
                  <th>{t('det')}</th>
                  <th className="num">{t('earned')} (Credit)</th>
                  <th className="num">{t('spaid')} / {t('adv')} (Debit)</th>
                  <th className="num">{t('bal')}</th>
                  <th className="noprint" style={{ textAlign: 'center' }}>✕</th>
                </tr>
              </thead>
              <tbody>
                {statement.items && statement.items.length > 0 ? (
                  (() => {
                    let runningBal = statement.opening;
                    return statement.items.map((i) => {
                      const isEarned = i.type === 'earned';
                      const amt = Number(i.amount || 0);
                      if (isEarned) runningBal += amt;
                      else runningBal -= amt;

                      return (
                        <tr key={i._id}>
                          <td>{dateOnly(i.date)}</td>
                          <td>
                            <b>{t(i.type) || i.type}</b>
                            {i.notes ? ` - ${i.notes}` : ''}
                          </td>
                          <td className="num font-mono" style={{ color: isEarned ? 'var(--success)' : 'inherit' }}>
                            {isEarned ? cur(amt) : '-'}
                          </td>
                          <td className="num font-mono" style={{ color: !isEarned ? 'var(--danger)' : 'inherit' }}>
                            {!isEarned ? cur(amt) : '-'}
                          </td>
                          <td className="num font-mono" style={{
                            fontWeight: '700',
                            color: runningBal > 0 ? 'var(--danger)' : 'var(--success)',
                          }}>
                            {cur(runningBal)}
                          </td>
                          <td className="noprint" style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="btn-del"
                              title={t('del')}
                              onClick={() => handleDelete(i._id)}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    });
                  })()
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      {t('none')}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--bg-card-subtle)', fontWeight: '800' }}>
                  <th colSpan="2">{t('total')}</th>
                  <th className="num font-mono" style={{ color: 'var(--success)' }}>{cur(statement.earned)}</th>
                  <th className="num font-mono" style={{ color: 'var(--danger)' }}>{cur(statement.paid + statement.advance)}</th>
                  <th className="num font-mono" style={{ color: statement.pending > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    {cur(statement.pending)}
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
