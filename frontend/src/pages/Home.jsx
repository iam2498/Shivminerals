import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { B, useI18n } from '../i18n';
import { api } from '../api';
import { n, cur, dt, today } from '../utils';
import WeighbridgeSlipModal from '../components/WeighbridgeSlipModal';

export default function Home() {
  const { lang, t } = useI18n();
  const [parties, setParties] = useState([]);
  const [recent, setRecent] = useState([]);
  const [selectedSlipLoad, setSelectedSlipLoad] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [ps, rls] = await Promise.all([
          api('parties').catch(() => []),
          api('loads?limit=6').catch(() => []),
        ]);
        if (isMounted) {
          setParties(ps || []);
          setRecent(rls || []);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  const totalPending = parties.reduce((s, p) => s + (Number(p.pending) || 0), 0);
  const todayStr = today();
  const todayLoads = recent.filter((l) => (l.date || '').slice(0, 10) === todayStr);
  const todayTons = todayLoads.reduce((s, l) => s + (Number(l.netTon) || 0), 0);
  const todayAmount = todayLoads.reduce((s, l) => s + (Number(l.amount) || 0), 0);

  const currentTimeStr = new Date().toLocaleDateString(lang === 'gu' ? 'gu-IN' : 'en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div>
      <div className="dash-welcome">
        <div className="welcome-info">
          <h1>{lang === 'gu' ? B.nameGu : B.name}</h1>
          <p>{lang === 'gu' ? B.taglineGu : B.tagline} &bull; {B.addr}</p>
        </div>
        <div className="live-badge">
          <span className="online-dot" />
          <span>{currentTimeStr}</span>
        </div>
      </div>

      {/* Live KPI Metrics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">🚚</div>
          <div className="stat-meta">
            <span className="stat-label">{t('loads')} ({t('today')})</span>
            <span className="stat-value">{todayLoads.length}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">⚖️</div>
          <div className="stat-meta">
            <span className="stat-label">{t('net')} ({t('today')})</span>
            <span className="stat-value">
              {n(todayTons)} <small style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Ton</small>
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">💰</div>
          <div className="stat-meta">
            <span className="stat-label">{t('total')} ({t('today')})</span>
            <span className="stat-value">{cur(todayAmount)}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon rose">⏳</div>
          <div className="stat-meta">
            <span className="stat-label">{t('receivables')}</span>
            <span className="stat-value" style={{ color: 'var(--danger)' }}>{cur(totalPending)}</span>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Tiles */}
      <div className="section-header">
        <h2 className="section-title">{t('quickTitle')}</h2>
      </div>

      <div className="action-grid">
        <Link className="action-tile" to="/load">
          <div className="tile-icon-box" style={{ color: '#0284c7' }}>🚚</div>
          <div className="tile-label">{t('load')}</div>
          <div className="tile-desc">{t('loadSub')}</div>
        </Link>

        <Link className="action-tile" to="/pay">
          <div className="tile-icon-box" style={{ color: '#10b981' }}>💰</div>
          <div className="tile-label">{t('pay')}</div>
          <div className="tile-desc">{t('paySub')}</div>
        </Link>

        <Link className="action-tile" to="/parties">
          <div className="tile-icon-box" style={{ color: '#6366f1' }}>👥</div>
          <div className="tile-label">{t('parties')}</div>
          <div className="tile-desc">{t('partiesSub')}</div>
        </Link>

        <Link className="action-tile" to="/rep">
          <div className="tile-icon-box" style={{ color: '#8b5cf6' }}>📊</div>
          <div className="tile-label">{t('rep')}</div>
          <div className="tile-desc">{t('repSub')}</div>
        </Link>

        <Link className="action-tile" to="/emp">
          <div className="tile-icon-box" style={{ color: '#0d9488' }}>🧑‍🏭</div>
          <div className="tile-label">{t('emp')}</div>
          <div className="tile-desc">{t('empSub')}</div>
        </Link>

        <Link className="action-tile" to="/exp">
          <div className="tile-icon-box" style={{ color: '#f59e0b' }}>⛽</div>
          <div className="tile-label">{t('exp')}</div>
          <div className="tile-desc">{t('expSub')}</div>
        </Link>

        <div className="action-tile soon">
          <div className="tile-icon-box" style={{ color: '#94a3b8' }}>🧾</div>
          <div className="tile-label">{t('inv')}</div>
          <span className="badge-soon">{t('soon')}</span>
        </div>
      </div>

      {/* Recent Weighbridge Loads */}
      <div className="table-card">
        <div className="table-toolbar">
          <h3 className="section-title" style={{ margin: 0 }}>🚚 {t('recent')}</h3>
          <Link to="/load" className="ctrl-btn" style={{ textDecoration: 'none' }}>+ {t('load')}</Link>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('dateTime')}</th>
                <th>{t('veh')}</th>
                <th>{t('party')}</th>
                <th className="num">{t('net')}</th>
                <th className="num">{t('amt')}</th>
                <th className="num">{t('cash')}</th>
                <th style={{ textAlign: 'center' }}>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {recent.length > 0 ? (
                recent.map((l) => (
                  <tr key={l._id}>
                    <td>{dt(l.date)}</td>
                    <td><span className="badge-plate">{l.vehicleNo}</span></td>
                    <td><b>{typeof l.party === 'object' ? l.party?.name : (l.party || '-')}</b></td>
                    <td className="num font-mono">{n(l.netTon)} t</td>
                    <td className="num font-mono" style={{ color: 'var(--primary)', fontWeight: '700' }}>{cur(l.amount)}</td>
                    <td className="num font-mono" style={{ color: 'var(--success)' }}>{l.cash ? cur(l.cash) : '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="ctrl-btn"
                        style={{ height: '30px', padding: '0 10px', fontSize: '12px' }}
                        onClick={() => setSelectedSlipLoad(l)}
                      >
                        🖨️ {t('slip')}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    {t('none')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Weighbridge Slip Modal */}
      {selectedSlipLoad && (
        <WeighbridgeSlipModal load={selectedSlipLoad} onClose={() => setSelectedSlipLoad(null)} />
      )}
    </div>
  );
}
