import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useToast } from '../components/Toast';
import { api, del } from '../api';
import { n, cur, dateOnly, monthStart, today } from '../utils';
import BackBar from '../components/BackBar';
import PrintHead from '../components/PrintHead';
import DatePresets from '../components/DatePresets';

export default function PartyStatement() {
  const { id } = useParams();
  const { lang, t } = useI18n();
  const { toast } = useToast();

  const [parties, setParties] = useState([]);
  const [selectedPartyId, setSelectedPartyId] = useState(id || '');
  const [fromDate, setFromDate] = useState(monthStart());
  const [toDate, setToDate] = useState(today());
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchParties() {
      try {
        const ps = await api('parties');
        setParties(ps || []);
      } catch (err) {
        console.error(err);
      }
    }
    fetchParties();
  }, []);

  const loadStatement = async (pid = selectedPartyId, fr = fromDate, to = toDate) => {
    if (!pid) return;
    setLoading(true);
    try {
      const data = await api(`statement?party=${pid}&from=${fr}&to=${to}`);
      setStatement(data);
    } catch (err) {
      toast(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      setSelectedPartyId(id);
      loadStatement(id, fromDate, toDate);
    }
  }, [id]);

  const handleDelete = async (kind, itemId) => {
    if (!window.confirm(t('del'))) return;
    try {
      await del(kind, itemId);
      toast('Deleted successfully');
      loadStatement();
    } catch (err) {
      toast(err.message);
    }
  };

  return (
    <div>
      <BackBar to="/parties" label="← Back to Parties" />

      {/* Filter Card */}
      <div className="panel-card noprint">
        <div className="panel-title">
          <span>📊</span>
          <span>{t('stmt')} &bull; {t('ledger')}</span>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="stmt-party">{t('party')} *</label>
            <div className="input-wrap">
              <span className="input-icon">👥</span>
              <select
                id="stmt-party"
                value={selectedPartyId}
                onChange={(e) => {
                  setSelectedPartyId(e.target.value);
                  if (e.target.value) loadStatement(e.target.value, fromDate, toDate);
                }}
              >
                <option value="">-- {t('pick')} --</option>
                {parties.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} {p.phone ? `(${p.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="stmt-from">{t('from')}</label>
            <div className="input-wrap">
              <span className="input-icon">📅</span>
              <input
                id="stmt-from"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="stmt-to">{t('to')}</label>
            <div className="input-wrap">
              <span className="input-icon">📅</span>
              <input
                id="stmt-to"
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
            if (selectedPartyId) loadStatement(selectedPartyId, f, to);
          }}
        />

        <div style={{ marginTop: '16px' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => loadStatement(selectedPartyId, fromDate, toDate)}
          >
            <span>🔍</span>
            <span>{t('show')}</span>
          </button>
        </div>
      </div>

      {/* Statement Statement Card & Printable View */}
      {statement && (
        <div className="panel-card" style={{ marginTop: '20px' }}>
          <PrintHead />

          {/* Party Header */}
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
              <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '4px' }}>
                {statement.party?.name}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                📞 <b>{statement.party?.phone || '-'}</b> &bull; 📍 {statement.party?.address || '-'}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                <b>{t('from')}:</b> {dateOnly(fromDate)} &nbsp;|&nbsp; <b>{t('to')}:</b> {dateOnly(toDate)}
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

          {/* Transactions Table */}
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('date')}</th>
                  <th>{t('det')}</th>
                  <th>{t('pass')}</th>
                  <th className="num">{t('net')}</th>
                  <th className="num">{t('rton')}</th>
                  <th className="num">{t('deb')}</th>
                  <th className="num">{t('cre')}</th>
                  <th className="num">{t('bal')}</th>
                  <th className="noprint" style={{ textAlign: 'center' }}>✕</th>
                </tr>
              </thead>
              <tbody>
                {statement.rows && statement.rows.length > 0 ? (
                  statement.rows.map((r) => (
                    <tr key={r.id}>
                      <td>{dateOnly(r.date)}</td>
                      <td>
                        {r.kind === 'loads' ? (
                          <span className="badge-plate">{r.details}</span>
                        ) : (
                          <span style={{ color: 'var(--success)', fontWeight: '600' }}>
                            💰 {r.details || 'Payment'}
                          </span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{r.pass || '-'}</td>
                      <td className="num font-mono">{r.mton ? `${n(r.mton)} T` : '-'}</td>
                      <td className="num font-mono">{r.rton ? `${n(r.rton)} T` : '-'}</td>
                      <td className="num font-mono" style={{ color: r.debit ? 'var(--danger)' : 'inherit' }}>
                        {r.debit ? cur(r.debit) : '-'}
                      </td>
                      <td className="num font-mono" style={{ color: r.credit ? 'var(--success)' : 'inherit' }}>
                        {r.credit ? cur(r.credit) : '-'}
                      </td>
                      <td className="num font-mono" style={{
                        fontWeight: '700',
                        color: r.balance > 0 ? 'var(--danger)' : 'var(--success)',
                      }}>
                        {cur(r.balance)}
                      </td>
                      <td className="noprint" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn-del"
                          title={t('del')}
                          onClick={() => handleDelete(r.kind, r.id)}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      {t('none')}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--bg-card-subtle)', fontWeight: '800' }}>
                  <th colSpan="3">{t('total')}</th>
                  <th className="num font-mono">{n(statement.t?.mton)} T</th>
                  <th className="num font-mono">{n(statement.t?.rton)} T</th>
                  <th className="num font-mono" style={{ color: 'var(--danger)' }}>{cur(statement.t?.debit)}</th>
                  <th className="num font-mono" style={{ color: 'var(--success)' }}>{cur(statement.t?.credit)}</th>
                  <th className="num font-mono" style={{ color: statement.pending > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    {cur(statement.pending)}
                  </th>
                  <th className="noprint" />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Net Pending Due Box */}
          <div style={{
            marginTop: '20px',
            padding: '16px 20px',
            background: 'var(--danger-light)',
            border: '1px solid var(--danger)',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--danger-text)' }}>
              {t('due')}:
            </span>
            <span style={{ fontSize: '24px', fontWeight: '900', color: 'var(--danger)' }}>
              {cur(statement.pending)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
