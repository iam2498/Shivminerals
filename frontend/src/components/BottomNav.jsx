import React from 'react';
import { NavLink } from 'react-router-dom';
import { useI18n } from '../i18n';

export default function BottomNav() {
  const { t } = useI18n();

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        <NavLink to="/" className={({ isActive }) => `bnav-item ${isActive ? 'active' : ''}`}>
          <i>🏠</i>
          <span>{t('bnavHome')}</span>
        </NavLink>
        <NavLink to="/load" className={({ isActive }) => `bnav-item ${isActive ? 'active' : ''}`}>
          <i>🚚</i>
          <span>{t('bnavLoad')}</span>
        </NavLink>
        <NavLink to="/pay" className={({ isActive }) => `bnav-item ${isActive ? 'active' : ''}`}>
          <i>💰</i>
          <span>{t('bnavPay')}</span>
        </NavLink>
        <NavLink to="/parties" className={({ isActive }) => `bnav-item ${isActive ? 'active' : ''}`}>
          <i>👥</i>
          <span>{t('bnavParties')}</span>
        </NavLink>
        <NavLink to="/rep" className={({ isActive }) => `bnav-item ${isActive ? 'active' : ''}`}>
          <i>📊</i>
          <span>{t('bnavReports')}</span>
        </NavLink>
      </div>
    </nav>
  );
}
