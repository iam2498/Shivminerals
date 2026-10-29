import React, { useState, useEffect } from 'react';
import { useI18n } from '../i18n';
import { useToast } from '../components/Toast';
import { api } from '../api';
import { n, cur, dateOnly, today } from '../utils';
import BackBar from '../components/BackBar';
import PrintHead from '../components/PrintHead';
import DatePresets from '../components/DatePresets';

export default function DaywiseReport() {
  const { lang, t } = useI18n();
  const { toast } = useToast();

  const [fromDate, setFromDate] = useState(today());
  const [toDate, setToDate] = useState(today());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async (fr = fromDate, to = toDate) => {
    setLoading(true);
    try {
      const data = await api(`daywise?from=${fr}&to=${to}`);
      setReport(data);
    } catch (err) {
      toast(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(today(), today());
  }, []);

  return (
    <div>
      <BackBar to="/rep" label="← Back to Reports" />

      {/* Filter Card */}
      <div className="panel-card noprint">
        <div className="panel-title">
          <span>📅</span>
          <span>{t('dayr')}</span>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="day-from">{t('from')}</label>
            <div className="input-wrap">
              <span className="input-icon">📅</span>
              <input
                id="day-from"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="day-to">{t('to')}</label>
            <div className="input-wrap">
              <span className="input-icon">📅</span>
              <input
                id="day-to"
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
            loadReport(f, to);
          }}
        />

        <div style={{ marginTop: '16px' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => loadReport(fromDate, toDate)}
          >
            <span>🔍</span>
            <span>{t('show')}</span>
          </button>
        </div>
      </div>

      {/* Report Output */}
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
              <h2 style={{ fontSize: '22px', fontWeight: '800' }}>📅 {t('dayr')}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>
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

          {/* Financial Breakdown KPI Cards */}
          <div className="stats-grid" style={{ marginBottom: '20px' }}>
            <div className="stat-card">
              <div className="stat-icon emerald">💵</div>
              <div className="stat-meta">
                <span className="stat-label">{t('cashT')}</span>
                <span className="stat-value" style={{ color: 'var(--success)' }}>{cur(report.cash)}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon rose">⛽</div>
              <div className="stat-meta">
                <span className="stat-label">{t('expT')}</span>
                <span className="stat-value" style={{ color: 'var(--danger)' }}>{cur(report.expense)}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon teal">💰</div>
              <div className="stat-meta">
                <span className="stat-label">{t('netC')}</span>
                <span className="stat-value" style={{ color: report.net >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {cur(report.net)}
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon amber">📊</div>
              <div className="stat-meta">
                <span className="stat-label">{t('grand')}</span>
                <span className="stat-value">{cur(report.grand)}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon amber">⏳</div>
              <div className="stat-meta">
                <span className="stat-label">{t('debT')}</span>
                <span className="stat-value" style={{ color: 'var(--danger)' }}>{cur(report.debit)}</span>
              </div>
            </div>
          </div>

          {/* Rozmel Entries Table */}
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t('date')}</th>
                  <th>{t('veh')}</th>
                  <th>{t('pass')}</th>
                  <th className="num">{t('net')}</th>
                  <th className="num">{t('rton')}</th>
                  <th>{t('dist')}</th>
                  <th>{t('party')}</th>
                  <th className="num">{t('amt')}</th>
                  <th className="num">{t('cashnow')}</th>
                </tr>
              </thead>
              <tbody>
                {report.rows && report.rows.length > 0 ? (
                  report.rows.map((r, idx) => (
                    <tr
                      key={idx}
                      style={r.exp ? { background: 'var(--bg-card-subtle)', color: '#8a5a00' } : {}}
                    >
                      <td>{idx + 1}</td>
                      <td>{dateOnly(r.date)}</td>
                      <td>
                        {r.exp ? (
                          <span className="badge-tag" style={{ background: '#fef3c7', color: '#92400e' }}>
                            🏷️ {t(r.vehicle) || r.vehicle}
                          </span>
                        ) : (
                          <span className="badge-plate">{r.vehicle}</span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{r.pass || '-'}</td>
                      <td className="num font-mono">{r.mton ? `${n(r.mton)} T` : '-'}</td>
                      <td className="num font-mono">{r.rton ? `${n(r.rton)} T` : '-'}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{r.district || '-'}</td>
                      <td><b>{r.party || '-'}</b></td>
                      <td className="num font-mono" style={{ color: r.exp ? 'var(--danger)' : 'var(--primary)', fontWeight: '700' }}>
                        {r.exp ? `-${cur(r.amount)}` : cur(r.amount)}
                      </td>
                      <td className="num font-mono" style={{ color: 'var(--success)' }}>
                        {r.cash ? cur(r.cash) : '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      {t('none')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
