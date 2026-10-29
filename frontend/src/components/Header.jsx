import React from 'react';
import { NavLink } from 'react-router-dom';
import { useI18n } from '../i18n';

export default function Header() {
  const { lang, setLang, theme, toggleTheme, t } = useI18n();

  return (
    <header className="app-header">
      <div className="header-container">
        {/* Brand & Status */}
        <NavLink to="/" className="brand-wrapper" id="home">
          <div className="brand-logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 3h15v13H1z" />
              <path d="M16 8h4l3 3v5h-7V8z" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </div>
          <div className="brand-text-col">
            <span className="brand-title">SHIV MINERALS</span>
            <span className="brand-subtitle">
              <span className="online-dot" title="Database Connected" />
              <span>Weighbridge &bull; Vijapur</span>
            </span>
          </div>
        </NavLink>

        {/* Desktop Navigation Pills */}
        <nav className="header-nav">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            🏠 {t('home')}
          </NavLink>
          <NavLink to="/load" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            🚚 {t('load')}
          </NavLink>
          <NavLink to="/pay" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            💰 {t('pay')}
          </NavLink>
          <NavLink to="/parties" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            👥 {t('parties')}
          </NavLink>
          <NavLink to="/rep" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            📊 {t('rep')}
          </NavLink>
          <NavLink to="/emp" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            🧑‍🏭 {t('emp')}
          </NavLink>
          <NavLink to="/exp" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            ⛽ {t('exp')}
          </NavLink>
        </nav>

        {/* Controls: Theme & Language Switchers */}
        <div className="header-actions">
          <button
            type="button"
            className="ctrl-btn icon-only"
            id="tb"
            onClick={toggleTheme}
            title={theme === 'dark' ? t('lightMode') : t('darkMode')}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            type="button"
            className="ctrl-btn"
            id="lb"
            onClick={setLang}
            title="Switch Language"
          >
            {lang === 'en' ? 'ગુજરાતી' : 'English'}
          </button>
        </div>
      </div>
    </header>
  );
}
