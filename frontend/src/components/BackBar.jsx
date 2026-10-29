import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';

export default function BackBar({ to = '/', label }) {
  const { t } = useI18n();

  return (
    <div className="back-bar noprint">
      <Link to={to} className="back-link">
        <span className="back-icon">←</span>
        <span>{label || t('backToDash')}</span>
      </Link>
    </div>
  );
}
