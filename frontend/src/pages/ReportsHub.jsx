import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import BackBar from '../components/BackBar';

export default function ReportsHub() {
  const { t } = useI18n();

  return (
    <div>
      <BackBar />

      <div className="section-title">
        <span>📊 {t('rep')}</span>
      </div>

      <div className="tile-grid">
        <Link to="/stmt" className="tile-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="tile-icon-wrap" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            📑
          </div>
          <div className="tile-content">
            <div className="tile-title">{t('ledger')}</div>
            <div className="tile-subtitle">Party-wise dispatch & payment account</div>
          </div>
        </Link>

        <Link to="/veh" className="tile-card" style={{ borderLeft: '4px solid var(--accent)' }}>
          <div className="tile-icon-wrap" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
            🚛
          </div>
          <div className="tile-content">
            <div className="tile-title">{t('vehr')}</div>
            <div className="tile-subtitle">Vehicle load trips, billing & spot cash</div>
          </div>
        </Link>

        <Link to="/day" className="tile-card" style={{ borderLeft: '4px solid var(--secondary)' }}>
          <div className="tile-icon-wrap" style={{ background: 'var(--secondary-light)', color: 'var(--secondary)' }}>
            📅
          </div>
          <div className="tile-content">
            <div className="tile-title">{t('dayr')}</div>
            <div className="tile-subtitle">Daily cash, billing, diesel & site rozmel</div>
          </div>
        </Link>

        <Link to="/emp" className="tile-card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <div className="tile-icon-wrap" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
            🧑‍🏭
          </div>
          <div className="tile-content">
            <div className="tile-title">{t('emp')} {t('report')}</div>
            <div className="tile-subtitle">Staff salary earned, paid & advance balance</div>
          </div>
        </Link>

        <Link to="/exp" className="tile-card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <div className="tile-icon-wrap" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
            ⛽
          </div>
          <div className="tile-content">
            <div className="tile-title">{t('expReport')}</div>
            <div className="tile-subtitle">Staff expenses, diesel, repairs & general ledger</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
